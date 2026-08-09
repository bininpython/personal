import { NextResponse } from 'next/server';
import { trainerRegisterSchema } from '@/lib/validators';
import {
  generateRecoveryCode,
  generateTrainerPrivateCode,
  generateTrainerPublicCode,
  getCodeHint,
  normalizeAuthCode,
} from '@/lib/auth/credentials';
import { hashPassword, normalizeName } from '@/lib/auth/hash';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { DATABASE_UPDATE_REQUIRED, isCommercialSchemaMissing } from '@/lib/supabase/errors';

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request) {
  try {
    const limit = await consumeRateLimit({
      request,
      scope: 'trainer-register',
      maxAttempts: 3,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });
    if (!limit.allowed) {
      return json(
        { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' },
        429,
        { 'Retry-After': String(limit.retryAfter) },
      );
    }

    const result = trainerRegisterSchema.safeParse(await request.json());
    if (!result.success) {
      return json({ error: 'Revise os dados informados.', details: result.error.flatten() }, 400);
    }

    const admin = createAdminClient();
    const { full_name, city, state } = result.data;
    const privateCode = generateTrainerPrivateCode();
    const recoveryCode = generateRecoveryCode();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const publicCode = generateTrainerPublicCode();
      const trainerId = crypto.randomUUID();
      const [accessHash, recoveryHash] = await Promise.all([
        hashPassword(normalizeAuthCode(privateCode).toUpperCase()),
        hashPassword(normalizeAuthCode(recoveryCode).toUpperCase()),
      ]);

      const { data: trainer, error } = await admin
        .from('trainers')
        .insert({
          id: trainerId,
          auth_user_id: null,
          name: full_name,
          login_name_normalized: normalizeName(full_name),
          code: publicCode,
          public_code: publicCode,
          access_code_hash: accessHash,
          access_code_hint: getCodeHint(privateCode),
          recovery_code_hash: recoveryHash,
          recovery_code_hint: getCodeHint(recoveryCode),
          credential_version: 2,
          terms_accepted_at: new Date().toISOString(),
          terms_version: '2026-08-08',
          privacy_policy_version: '2026-08-08',
          city,
          state,
        })
        .select('id, name')
        .single();

      if (error?.code === '23505') continue;
      if (error || !trainer) throw error || new Error('Cadastro não criado.');

      await createSession({
        actorId: trainer.id,
        role: 'trainer',
        trainerId: trainer.id,
        request,
      });

      return json({
        success: true,
        access_code: privateCode,
        trainer_code: publicCode,
        recovery_code: recoveryCode,
        codes_shown_once: true,
        user: {
          id: trainer.id,
          role: 'trainer',
          name: trainer.name,
          trainer_id: trainer.id,
          trainer_code: publicCode,
        },
      }, 201);
    }

    return json({ error: 'Não foi possível gerar um código exclusivo. Tente novamente.' }, 503);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O serviço de cadastro ainda não está configurado.' }, 503);
    }
    if (isCommercialSchemaMissing(error)) {
      console.error('[Trainer Register] Database migration required:', error);
      return json({ error: DATABASE_UPDATE_REQUIRED, code: 'DATABASE_UPDATE_REQUIRED' }, 503);
    }
    console.error('[Trainer Register] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
