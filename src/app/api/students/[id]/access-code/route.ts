import { NextResponse } from 'next/server';
import { generateStudentPrivateCode, getCodeHint, normalizeAuthCode } from '@/lib/auth/credentials';
import { hashPassword, normalizeName, verifyPassword } from '@/lib/auth/hash';
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
    .select('id, trainer_id, name, access_code_hash')
    .eq('id', id)
    .eq('trainer_id', session.trainer_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });

  const normalizedName = normalizeName(student.name);
  const { data: sameNameStudents, error: codeLookupError } = await admin
    .from('students')
    .select('id, access_code, access_code_hash')
    .eq('login_name_normalized', normalizedName)
    .neq('id', student.id)
    .is('deleted_at', null)
    .limit(50);
  if (codeLookupError) {
    return NextResponse.json({ error: 'Não foi possível verificar o novo código.' }, { status: 500 });
  }

  let accessCode = '';
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidateCode = generateStudentPrivateCode();
    const canonicalCode = normalizeAuthCode(candidateCode).toUpperCase();
    const reusedCurrentCode = student.access_code_hash
      ? await verifyPassword(canonicalCode, student.access_code_hash).catch(() => false)
      : false;
    const usedByOtherStudent = (await Promise.all((sameNameStudents ?? []).map(async (candidate) => (
      candidate.access_code_hash
        ? verifyPassword(canonicalCode, candidate.access_code_hash).catch(() => false)
        : normalizeAuthCode(candidate.access_code || '').toUpperCase() === canonicalCode
    )))).some(Boolean);
    if (!reusedCurrentCode && !usedByOtherStudent) {
      accessCode = candidateCode;
      break;
    }
  }
  if (!accessCode) {
    return NextResponse.json({ error: 'Não foi possível gerar um código exclusivo.' }, { status: 503 });
  }

  const { error } = await admin.from('students').update({
    access_code: null,
    access_code_hash: await hashPassword(normalizeAuthCode(accessCode).toUpperCase()),
    access_code_hint: getCodeHint(accessCode),
    failed_login_attempts: 0,
    locked_until: null,
    credential_version: 3,
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
