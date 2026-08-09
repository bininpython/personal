import { NextResponse } from 'next/server';
import { trainerLoginSchema } from '@/lib/validators';
import {
  generateTrainerPublicCode,
  getCodeHint,
  normalizeAuthCode,
} from '@/lib/auth/credentials';
import { hashPassword, normalizeName, verifyPassword } from '@/lib/auth/hash';
import { clearRateLimit, consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPrivateAvatar } from '@/lib/profile/private-avatar';
import { DATABASE_UPDATE_REQUIRED, isCommercialSchemaMissing } from '@/lib/supabase/errors';

const GENERIC_ERROR = 'Nome ou código de acesso inválido.';

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request) {
  try {
    const result = trainerLoginSchema.safeParse(await request.json());
    if (!result.success) return json({ error: 'Revise o nome e o código informados.' }, 400);

    const { name, access_code, remember } = result.data;
    const normalizedName = normalizeName(name);
    const canonicalCode = normalizeAuthCode(access_code).toUpperCase();
    const limit = await consumeRateLimit({
      request,
      scope: 'trainer-login',
      identifier: normalizedName,
      maxAttempts: 5,
      windowSeconds: 900,
      blockSeconds: 900,
    });
    if (!limit.allowed) {
      return json(
        { error: 'Acesso temporariamente bloqueado. Aguarde e tente novamente.' },
        429,
        { 'Retry-After': String(limit.retryAfter) },
      );
    }

    const admin = createAdminClient();
    const { data: candidates, error } = await admin
      .from('trainers')
      .select('id, name, code, public_code, access_code_hash, failed_login_attempts, locked_until, avatar_url')
      .eq('login_name_normalized', normalizedName)
      .is('deleted_at', null)
      .limit(10);
    if (error) throw error;

    let trainer: NonNullable<typeof candidates>[number] | null = null;
    let usedLegacyCode = false;
    for (const candidate of candidates ?? []) {
      if (candidate.locked_until && new Date(candidate.locked_until) > new Date()) continue;
      const validHash = candidate.access_code_hash
        ? await verifyPassword(canonicalCode, candidate.access_code_hash).catch(() => false)
        : false;
      const validLegacy = !candidate.access_code_hash
        && normalizeAuthCode(candidate.code || '').toUpperCase() === canonicalCode;
      if (validHash || validLegacy) {
        trainer = candidate;
        usedLegacyCode = validLegacy;
        break;
      }
    }

    if (!trainer) {
      for (const candidate of candidates ?? []) {
        const attempts = Number((candidate as { failed_login_attempts?: number }).failed_login_attempts || 0) + 1;
        await admin.from('trainers').update({
          failed_login_attempts: attempts,
          locked_until: attempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
            : null,
        }).eq('id', candidate.id);
      }
      return json({ error: GENERIC_ERROR }, 401);
    }

    let publicCode = trainer.public_code || trainer.code;
    if (usedLegacyCode) {
      publicCode = generateTrainerPublicCode();
      await admin.from('trainers').update({
        code: publicCode,
        public_code: publicCode,
        access_code_hash: await hashPassword(canonicalCode),
        access_code_hint: getCodeHint(canonicalCode),
        credential_version: 1,
      }).eq('id', trainer.id);
    }

    await admin.from('trainers').update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    }).eq('id', trainer.id);
    await clearRateLimit(limit.keyHash);
    await createSession({
      actorId: trainer.id,
      role: 'trainer',
      trainerId: trainer.id,
      request,
      remember,
    });

    return json({
      success: true,
      credential_upgrade: usedLegacyCode,
      user: {
        id: trainer.id,
        role: 'trainer',
        name: trainer.name,
        trainer_id: trainer.id,
        trainer_code: publicCode,
        avatar_url: isPrivateAvatar(trainer.avatar_url)
          ? `/api/profile/avatar/image?user=${encodeURIComponent(trainer.id)}`
          : (trainer.avatar_url || undefined),
      },
    }, 200);
  } catch (error) {
    if (isCommercialSchemaMissing(error)) {
      console.error('[Trainer Login] Database migration required:', error);
      return json({ error: DATABASE_UPDATE_REQUIRED, code: 'DATABASE_UPDATE_REQUIRED' }, 503);
    }
    console.error('[Trainer Login] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
