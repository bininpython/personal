import { NextResponse } from 'next/server';
import {
  generateIndividualPrivateCode,
  getCodeHint,
  normalizeAuthCode,
} from '@/lib/auth/credentials';
import { hashPassword, normalizeName, verifyPassword } from '@/lib/auth/hash';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_UPDATE_REQUIRED, isCommercialSchemaMissing } from '@/lib/supabase/errors';
import { individualRegisterSchema } from '@/lib/validators';

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
      scope: 'individual-register',
      maxAttempts: 4,
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

    const parsed = individualRegisterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ error: 'Revise os dados informados.', details: parsed.error.flatten() }, 400);
    }

    const admin = createAdminClient();
    const normalizedName = normalizeName(parsed.data.full_name);
    const { data: existingCandidates, error: candidatesError } = await admin
      .from('individual_users')
      .select('access_code_hash')
      .eq('login_name_normalized', normalizedName)
      .is('deleted_at', null)
      .limit(50);
    if (candidatesError) throw candidatesError;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const accessCode = generateIndividualPrivateCode();
      const canonicalCode = normalizeAuthCode(accessCode).toUpperCase();
      const codeAlreadyUsed = (await Promise.all((existingCandidates ?? []).map((candidate) => (
        candidate.access_code_hash
          ? verifyPassword(canonicalCode, candidate.access_code_hash).catch(() => false)
          : Promise.resolve(false)
      )))).some(Boolean);
      if (codeAlreadyUsed) continue;

      const userId = crypto.randomUUID();
      const { data: user, error } = await admin
        .from('individual_users')
        .insert({
          id: userId,
          name: parsed.data.full_name,
          login_name_normalized: normalizedName,
          access_code_hash: await hashPassword(canonicalCode),
          access_code_hint: getCodeHint(accessCode),
          access_code_changed_at: new Date().toISOString(),
          credential_version: 2,
          goal: parsed.data.goal || null,
          level: parsed.data.level,
          terms_accepted_at: new Date().toISOString(),
          terms_version: '2026-08-11',
          privacy_policy_version: '2026-08-11',
        })
        .select('id, name')
        .single();
      if (error || !user) throw error || new Error('Conta individual não criada.');

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
        },
      }, 201);
    }

    return json({ error: 'Não foi possível gerar um código exclusivo. Tente novamente.' }, 503);
  } catch (error) {
    if (isCommercialSchemaMissing(error)) {
      console.error('[Individual Register] Database migration required:', error);
      return json({ error: DATABASE_UPDATE_REQUIRED, code: 'DATABASE_UPDATE_REQUIRED' }, 503);
    }
    console.error('[Individual Register] Unexpected error:', error);
    return json({ error: 'Não foi possível criar a conta agora.' }, 500);
  }
}
