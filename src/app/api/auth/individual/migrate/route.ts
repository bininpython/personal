import { NextResponse } from 'next/server';
import {
  generateIndividualPrivateCode,
  getCodeHint,
  normalizeAuthCode,
} from '@/lib/auth/credentials';
import { hashPassword, normalizeName, verifyPassword } from '@/lib/auth/hash';
import { clearRateLimit, consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession } from '@/lib/auth/session';
import { isPrivateAvatar } from '@/lib/profile/private-avatar';
import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_UPDATE_REQUIRED, isCommercialSchemaMissing } from '@/lib/supabase/errors';
import { individualLegacyMigrationSchema } from '@/lib/validators';

const GENERIC_ERROR = 'E-mail ou senha da conta antiga inválidos.';

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request) {
  try {
    const parsed = individualLegacyMigrationSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Revise o e-mail e a senha da conta antiga.' }, 400);

    const email = parsed.data.email.trim().toLocaleLowerCase('pt-BR');
    const limit = await consumeRateLimit({
      request,
      scope: 'individual-credential-migration',
      identifier: email,
      maxAttempts: 5,
      windowSeconds: 900,
      blockSeconds: 900,
    });
    if (!limit.allowed) {
      return json(
        { error: 'Migração temporariamente bloqueada. Aguarde e tente novamente.' },
        429,
        { 'Retry-After': String(limit.retryAfter) },
      );
    }

    const admin = createAdminClient();
    const { data: user, error } = await admin
      .from('individual_users')
      .select('id, name, password_hash, status, failed_login_attempts, locked_until, avatar_url')
      .eq('email_normalized', email)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;

    const locked = user?.locked_until && new Date(user.locked_until) > new Date();
    const passwordIsValid = user?.password_hash && !locked
      ? await verifyPassword(parsed.data.password, user.password_hash).catch(() => false)
      : false;
    if (!user || user.status !== 'active' || !passwordIsValid) {
      if (user) {
        const attempts = Number(user.failed_login_attempts || 0) + 1;
        await admin.from('individual_users').update({
          failed_login_attempts: attempts,
          locked_until: attempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
            : null,
        }).eq('id', user.id);
      }
      return json({ error: GENERIC_ERROR }, 401);
    }

    const normalizedName = normalizeName(user.name);
    const { data: candidates, error: candidatesError } = await admin
      .from('individual_users')
      .select('access_code_hash')
      .eq('login_name_normalized', normalizedName)
      .is('deleted_at', null)
      .limit(50);
    if (candidatesError) throw candidatesError;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const accessCode = generateIndividualPrivateCode();
      const canonicalCode = normalizeAuthCode(accessCode).toUpperCase();
      const codeAlreadyUsed = (await Promise.all((candidates ?? []).map((candidate) => (
        candidate.access_code_hash
          ? verifyPassword(canonicalCode, candidate.access_code_hash).catch(() => false)
          : Promise.resolve(false)
      )))).some(Boolean);
      if (codeAlreadyUsed) continue;

      const now = new Date().toISOString();
      const { error: updateError } = await admin.from('individual_users').update({
        login_name_normalized: normalizedName,
        access_code_hash: await hashPassword(canonicalCode),
        access_code_hint: getCodeHint(accessCode),
        access_code_changed_at: now,
        credential_version: 2,
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: now,
        updated_at: now,
      }).eq('id', user.id);
      if (updateError) throw updateError;

      await clearRateLimit(limit.keyHash);
      await createSession({
        actorId: user.id,
        role: 'individual',
        trainerId: user.id,
        request,
      });

      return json({
        success: true,
        access_code: accessCode,
        codes_shown_once: true,
        user: {
          id: user.id,
          role: 'individual',
          name: user.name,
          trainer_id: user.id,
          avatar_url: isPrivateAvatar(user.avatar_url)
            ? `/api/profile/avatar/image?user=${encodeURIComponent(user.id)}`
            : (user.avatar_url || undefined),
        },
      }, 200);
    }

    return json({ error: 'Não foi possível gerar um código exclusivo. Tente novamente.' }, 503);
  } catch (error) {
    if (isCommercialSchemaMissing(error)) {
      console.error('[Individual Migration] Database migration required:', error);
      return json({ error: DATABASE_UPDATE_REQUIRED, code: 'DATABASE_UPDATE_REQUIRED' }, 503);
    }
    console.error('[Individual Migration] Unexpected error:', error);
    return json({ error: 'Não foi possível migrar a conta agora.' }, 500);
  }
}
