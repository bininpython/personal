import { NextResponse } from 'next/server';
import {
  generateRecoveryCode,
  generateTrainerPrivateCode,
  getCodeHint,
  normalizeAuthCode,
} from '@/lib/auth/credentials';
import { hashPassword } from '@/lib/auth/hash';
import { createSession, getSession, revokeActorSessions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const accessCode = generateTrainerPrivateCode();
    const recoveryCode = generateRecoveryCode();
    const admin = createAdminClient();
    const { error } = await admin.from('trainers').update({
      access_code_hash: await hashPassword(normalizeAuthCode(accessCode).toUpperCase()),
      access_code_hint: getCodeHint(accessCode),
      recovery_code_hash: await hashPassword(normalizeAuthCode(recoveryCode).toUpperCase()),
      recovery_code_hint: getCodeHint(recoveryCode),
      credential_version: 2,
      failed_login_attempts: 0,
      locked_until: null,
    }).eq('id', session.sub);
    if (error) throw error;

    await revokeActorSessions(session.sub, 'trainer');
    await createSession({
      actorId: session.sub,
      role: 'trainer',
      trainerId: session.trainer_id,
      request,
    });

    return NextResponse.json({
      success: true,
      access_code: accessCode,
      recovery_code: recoveryCode,
      codes_shown_once: true,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Rotate trainer codes] Error:', error);
    return NextResponse.json({ error: 'Não foi possível trocar os códigos.' }, { status: 500 });
  }
}
