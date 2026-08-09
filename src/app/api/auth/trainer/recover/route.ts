import { NextResponse } from 'next/server';
import { trainerRecoverySchema } from '@/lib/validators';
import {
  generateRecoveryCode,
  generateTrainerPrivateCode,
  getCodeHint,
  normalizeAuthCode,
} from '@/lib/auth/credentials';
import { hashPassword, normalizeName, verifyPassword } from '@/lib/auth/hash';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession, revokeActorSessions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request) {
  try {
    const parsed = trainerRecoverySchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Revise os dados de recuperação.' }, 400);

    const normalizedName = normalizeName(parsed.data.name);
    const publicCode = normalizeAuthCode(parsed.data.trainer_code).toUpperCase();
    const recoveryCode = normalizeAuthCode(parsed.data.recovery_code).toUpperCase();
    const limit = await consumeRateLimit({
      request,
      scope: 'trainer-recovery',
      identifier: `${publicCode}|${normalizedName}`,
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
    const formattedPublicCode = publicCode.startsWith('FC') ? `FC-${publicCode.slice(2)}` : publicCode;
    const { data: trainer } = await admin
      .from('trainers')
      .select('id, name, public_code, recovery_code_hash')
      .eq('login_name_normalized', normalizedName)
      .eq('public_code', formattedPublicCode)
      .is('deleted_at', null)
      .maybeSingle();

    const valid = trainer?.recovery_code_hash
      ? await verifyPassword(recoveryCode, trainer.recovery_code_hash).catch(() => false)
      : false;
    if (!trainer || !valid) {
      return json({ error: 'Dados de recuperação inválidos.' }, 401);
    }

    const newAccessCode = generateTrainerPrivateCode();
    const newRecoveryCode = generateRecoveryCode();
    await revokeActorSessions(trainer.id, 'trainer');
    const { error } = await admin.from('trainers').update({
      access_code_hash: await hashPassword(normalizeAuthCode(newAccessCode).toUpperCase()),
      access_code_hint: getCodeHint(newAccessCode),
      recovery_code_hash: await hashPassword(normalizeAuthCode(newRecoveryCode).toUpperCase()),
      recovery_code_hint: getCodeHint(newRecoveryCode),
      failed_login_attempts: 0,
      locked_until: null,
      credential_version: 2,
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
      recovery_code: newRecoveryCode,
      codes_shown_once: true,
      user: {
        id: trainer.id,
        role: 'trainer',
        name: trainer.name,
        trainer_id: trainer.id,
        trainer_code: trainer.public_code,
      },
    }, 200);
  } catch (error) {
    console.error('[Trainer Recovery] Unexpected error:', error);
    return json({ error: 'Não foi possível recuperar o acesso.' }, 500);
  }
}
