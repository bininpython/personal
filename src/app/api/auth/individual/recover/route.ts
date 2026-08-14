import { NextResponse } from 'next/server';
import { trainerRecoverySchema } from '@/lib/validators';
import { generateIndividualPrivateCode, getCodeHint, normalizeAuthCode } from '@/lib/auth/credentials';
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
    if (!parsed.success) return json({ error: 'Revise seu nome, senha e idade.' }, 400);

    const normalizedName = normalizeName(parsed.data.name);
    const limit = await consumeRateLimit({
      request,
      scope: 'individual-recovery',
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
      .from('individual_users')
      .select('id, name, access_code_hash, password_hash')
      .eq('login_name_normalized', normalizedName)
      .eq('age', parsed.data.age)
      .is('deleted_at', null)
      .limit(20);
    if (candidatesError) throw candidatesError;

    let user: NonNullable<typeof candidates>[number] | null = null;
    for (const candidate of candidates ?? []) {
      const valid = candidate.password_hash
        ? await verifyPassword(parsed.data.password, candidate.password_hash).catch(() => false)
        : false;
      if (valid) {
        user = candidate;
        break;
      }
    }

    if (!user) return json({ error: 'Nome, senha ou idade inválidos.' }, 401);

    let newAccessCode = generateIndividualPrivateCode();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidateCode = generateIndividualPrivateCode();
      const canonical = normalizeAuthCode(candidateCode).toUpperCase();
      const reusedCode = user.access_code_hash
        ? await verifyPassword(canonical, user.access_code_hash).catch(() => false)
        : false;
      if (!reusedCode) {
        newAccessCode = candidateCode;
        break;
      }
    }

    await revokeActorSessions(user.id, 'individual');
    const { error } = await admin.from('individual_users').update({
      access_code_hash: await hashPassword(normalizeAuthCode(newAccessCode).toUpperCase()),
      access_code_hint: getCodeHint(newAccessCode),
      failed_login_attempts: 0,
      locked_until: null,
      credential_version: 2,
    }).eq('id', user.id);
    if (error) throw error;

    await createSession({
      actorId: user.id,
      role: 'individual',
      trainerId: user.id,
      request,
    });

    return json({
      success: true,
      access_code: newAccessCode,
      codes_shown_once: true,
      user: {
        id: user.id,
        role: 'individual',
        name: user.name,
      },
    }, 200);
  } catch (error) {
    console.error('[Individual Recovery] Unexpected error:', error);
    return json({ error: 'Não foi possível recuperar o acesso.' }, 500);
  }
}
