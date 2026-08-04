// ============================================
// POST /api/auth/student/login
// ============================================

import { NextResponse } from 'next/server';
import { studentLoginSchema } from '@/lib/validators';
import { verifyPassword, normalizeName } from '@/lib/auth/hash';
import { createStudentToken } from '@/lib/auth/jwt';
import { setSessionCookie } from '@/lib/auth/session';
import { initDemoData, getStudentsByTrainerId, getTrainers } from '@/lib/demo-data';
import { MAX_LOGIN_ATTEMPTS, STUDENT_LOCKOUT_MINUTES } from '@/constants';

export async function POST(request: Request) {
  try {
    await initDemoData();

    const body = await request.json();
    const result = studentLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { name, access_code, remember_me } = result.data;
    const normalizedInputName = normalizeName(name);

    // Search across all trainers for matching student
    // In production, we might require the trainer code too, or use a different approach
    const allTrainers = getTrainers();
    let matchedStudent = null;

    for (const trainer of allTrainers) {
      const students = getStudentsByTrainerId(trainer.id);
      const student = students.find(s => s.normalized_name === normalizedInputName);
      if (student) {
        matchedStudent = student;
        break;
      }
    }

    // Generic error message — never reveal if name or code is wrong
    const genericError = 'Nome ou código de acesso inválido.';

    if (!matchedStudent) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    // Check if account is locked
    if (matchedStudent.locked_until && new Date(matchedStudent.locked_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(matchedStudent.locked_until).getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        { error: `Acesso bloqueado temporariamente. Tente novamente em ${minutesLeft} minutos.` },
        { status: 423 }
      );
    }

    // Check status
    if (matchedStudent.status !== 'active') {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    // Verify access code
    const isValid = await verifyPassword(access_code, matchedStudent.access_code_hash);

    if (!isValid) {
      matchedStudent.failed_login_attempts += 1;

      if (matchedStudent.failed_login_attempts >= MAX_LOGIN_ATTEMPTS) {
        matchedStudent.locked_until = new Date(
          Date.now() + STUDENT_LOCKOUT_MINUTES * 60 * 1000
        ).toISOString();
        return NextResponse.json(
          { error: `Muitas tentativas incorretas. Acesso bloqueado por ${STUDENT_LOCKOUT_MINUTES} minutos.` },
          { status: 423 }
        );
      }

      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    // Reset failed attempts
    matchedStudent.failed_login_attempts = 0;
    matchedStudent.locked_until = undefined;
    matchedStudent.last_login_at = new Date().toISOString();

    // Create session token
    const token = await createStudentToken(
      {
        id: matchedStudent.id,
        trainer_id: matchedStudent.trainer_id,
        full_name: matchedStudent.full_name,
        avatar_url: matchedStudent.avatar_url,
      },
      remember_me ? 30 : 7
    );

    await setSessionCookie(token, remember_me ?? false);

    return NextResponse.json({
      success: true,
      user: {
        id: matchedStudent.id,
        role: 'student',
        name: matchedStudent.full_name,
        trainer_id: matchedStudent.trainer_id,
        avatar_url: matchedStudent.avatar_url,
      },
    });
  } catch (error) {
    console.error('[Student Login] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
