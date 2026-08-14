import { NextResponse } from 'next/server';
import {
  generateIndividualPrivateCode,
  getCodeHint,
  normalizeAuthCode,
} from '@/lib/auth/credentials';
import { hashPassword, normalizeName, verifyPassword } from '@/lib/auth/hash';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession, getSession, revokeActorSessions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'individual') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const limit = await consumeRateLimit({
      request,
      scope: 'individual-rotate-code',
      identifier: session.sub,
      maxAttempts: 5,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Muitas trocas de código. Aguarde antes de tentar novamente.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' } },
      );
    }

    const admin = createAdminClient();
    const { data: current, error: currentError } = await admin
      .from('individual_users')
      .select('name')
      .eq('id', session.sub)
      .single();
    if (currentError || !current) throw currentError || new Error('Conta não encontrada.');

    const normalizedName = normalizeName(current.name);
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

      const { error } = await admin.from('individual_users').update({
        login_name_normalized: normalizedName,
        access_code_hash: await hashPassword(canonicalCode),
        access_code_hint: getCodeHint(accessCode),
        access_code_changed_at: new Date().toISOString(),
        credential_version: 2,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      }).eq('id', session.sub);
      if (error) throw error;

      await revokeActorSessions(session.sub, 'individual');
      await createSession({
        actorId: session.sub,
        role: 'individual',
        trainerId: session.sub,
        request,
      });

      return NextResponse.json({
        success: true,
        access_code: accessCode,
        codes_shown_once: true,
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json(
      { error: 'Não foi possível gerar um código exclusivo. Tente novamente.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[Rotate individual code] Error:', error);
    return NextResponse.json(
      { error: 'Não foi possível trocar o código.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
