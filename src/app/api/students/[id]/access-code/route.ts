import { NextResponse } from 'next/server';
import { generateStudentPrivateCode, getCodeHint, normalizeAuthCode } from '@/lib/auth/credentials';
import { hashPassword } from '@/lib/auth/hash';
import { getSession, revokeActorSessions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== 'trainer') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: student } = await admin
    .from('students')
    .select('id, trainer_id')
    .eq('id', id)
    .eq('trainer_id', session.trainer_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });

  const accessCode = generateStudentPrivateCode();
  const { error } = await admin.from('students').update({
    access_code: null,
    access_code_hash: await hashPassword(normalizeAuthCode(accessCode).toUpperCase()),
    access_code_hint: getCodeHint(accessCode),
    failed_login_attempts: 0,
    locked_until: null,
    credential_version: 2,
  }).eq('id', student.id);
  if (error) {
    return NextResponse.json({ error: 'Não foi possível gerar um novo código.' }, { status: 500 });
  }

  await revokeActorSessions(student.id, 'student');
  return NextResponse.json({
    success: true,
    access_code: accessCode,
    access_code_hint: getCodeHint(accessCode),
    codes_shown_once: true,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
