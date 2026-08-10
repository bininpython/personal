import { NextResponse } from 'next/server';
import { trainerRecoverySchema } from '@/lib/validators';
import { generateTrainerPrivateCode, getCodeHint, normalizeAuthCode } from '@/lib/auth/credentials';
import { hashPassword, normalizeName, verifyPassword } from '@/lib/auth/hash';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession, revokeActorSessions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_UPDATE_REQUIRED, isCommercialSchemaMissing } from '@/lib/supabase/errors';

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request) {
  try {
    const parsed = trainerRecoverySchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Revise seu nome, senha e idade.' }, 400);

    const normalizedName = normalizeName(parsed.data.name);
    const limit = await consumeRateLimit({
      request,
      scope: 'trainer-recovery',
      identifier: `${normalizedName}|${parsed.data.age}`,
      maxAttempts: 4,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });
    if (!limit.allowed) {
      return json(
        { error: 'Recuperação temporariamente bloqueada.' },
        429,
        { 'Retry-After': String(limit.retryAfter) },
      );
    }

    const admin = createAdminClient();
    const { data: candidates, error: candidatesError } = await admin
      .from('trainers')
      .select('id, name, public_code, access_code_hash, recovery_password_hash')
      .eq('login_name_normalized', normalizedName)
      .eq('age', parsed.data.age)
      .is('deleted_at', null)
      .limit(20);
    if (candidatesError) throw candidatesError;

    let trainer: NonNullable<typeof candidates>[number] | null = null;
    for (const candidate of candidates ?? []) {
      const valid = candidate.recovery_password_hash
        ? await verifyPassword(parsed.data.password, candidate.recovery_password_hash).catch(() => false)
        : false;
      if (valid) {
        trainer = candidate;
        break;
      }
    }

    if (!trainer) return json({ error: 'Nome, senha ou idade inválidos.' }, 401);

    let newAccessCode = generateTrainerPrivateCode();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidateCode = generateTrainerPrivateCode();
      const canonical = normalizeAuthCode(candidateCode).toUpperCase();
      const reusedCode = trainer.access_code_hash
        ? await verifyPassword(canonical, trainer.access_code_hash).catch(() => false)
        : false;
      if (!reusedCode) {
        newAccessCode = candidateCode;
        break;
      }
    }

    await revokeActorSessions(trainer.id, 'trainer');
    const { error } = await admin.from('trainers').update({
      access_code_hash: await hashPassword(normalizeAuthCode(newAccessCode).toUpperCase()),
      access_code_hint: getCodeHint(newAccessCode),
      failed_login_attempts: 0,
      locked_until: null,
      credential_version: 3,
    }).eq('id', trainer.id);
    if (error) throw error;

    await createSession({
      actorId: trainer.id,
      role: 'trainer',
      trainerId: trainer.id,
      request,
    });

    return json({
      success: true,
      access_code: newAccessCode,
      codes_shown_once: true,
      user: {
        id: trainer.id,
        role: 'trainer',
        name: trainer.name,
        trainer_id: trainer.id,
      },
    }, 200);
  } catch (error) {
    if (isCommercialSchemaMissing(error)) {
      console.error('[Trainer Recovery] Database migration required:', error);
      return json({ error: DATABASE_UPDATE_REQUIRED, code: 'DATABASE_UPDATE_REQUIRED' }, 503);
    }
    console.error('[Trainer Recovery] Unexpected error:', error);
    return json({ error: 'Não foi possível recuperar o acesso.' }, 500);
  }
}
