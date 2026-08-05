import { NextResponse } from 'next/server';
import {
  MAX_STUDENTS_PER_TRAINER,
  STUDENT_ACCESS_CODE_LENGTH,
} from '@/constants';
import { studentCreateSchema } from '@/lib/validators';
import { getSession } from '@/lib/auth/session';
import {
  buildStudentAuthPassword,
  buildSyntheticEmail,
  generateNumericAccessCode,
  isDuplicateAccountError,
} from '@/lib/auth/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

const CODE_GENERATION_ATTEMPTS = 100;

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  let reservedCode = '';

  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return json({ error: 'Não autorizado.' }, 401);
    }

    const result = studentCreateSchema.safeParse(await request.json());
    if (!result.success) {
      return json({
        error: 'Revise os dados do aluno.',
        details: result.error.flatten(),
      }, 400);
    }

    const data = result.data;
    const admin = createAdminClient();
    const { count: currentStudentCount, error: countError } = await admin
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('trainer_id', session.trainer_id);

    if (countError) {
      console.error('[Create Student] Count error:', countError);
      return json({ error: 'Não foi possível verificar o limite de alunos.' }, 500);
    }

    if ((currentStudentCount ?? 0) >= MAX_STUDENTS_PER_TRAINER) {
      return json({
        error: `Você já atingiu o limite de ${MAX_STUDENTS_PER_TRAINER} alunos.`,
      }, 409);
    }

    let authUserId = '';
    let mockEmail = '';

    for (let attempt = 0; attempt < CODE_GENERATION_ATTEMPTS; attempt += 1) {
      const candidateCode = generateNumericAccessCode(STUDENT_ACCESS_CODE_LENGTH);
      const { error: reservationError } = await admin
        .from('student_access_codes')
        .insert({
          code: candidateCode,
          trainer_id: session.trainer_id,
        });

      if (reservationError) {
        if (reservationError.code === '23505') continue;

        console.error('[Create Student] Code reservation error:', reservationError);
        return json({
          error: 'O banco ainda não está atualizado para gerar códigos de aluno.',
        }, 503);
      }

      reservedCode = candidateCode;
      mockEmail = buildSyntheticEmail('student', reservedCode);
      const password = buildStudentAuthPassword(reservedCode);
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: mockEmail,
        password,
        email_confirm: true,
        user_metadata: { name: data.full_name },
        app_metadata: { role: 'student' },
      });

      if (authError || !authData.user) {
        if (isDuplicateAccountError(authError)) {
          reservedCode = '';
          continue;
        }

        await admin.from('student_access_codes').delete().eq('code', reservedCode);
        reservedCode = '';
        console.error('[Create Student] Auth error:', authError);
        return json({ error: 'Não foi possível criar o acesso do aluno.' }, 500);
      }

      authUserId = authData.user.id;
      break;
    }

    if (!reservedCode || !authUserId) {
      return json({
        error: 'Não há código disponível no momento. Tente novamente mais tarde.',
      }, 503);
    }

    const { error: profileError } = await admin.from('students').insert({
      id: authUserId,
      trainer_id: session.trainer_id,
      name: data.full_name,
      nickname: data.nickname || null,
      birth_date: data.birth_date || null,
      access_code: reservedCode,
      mock_email: mockEmail,
      status: 'active',
      goal: data.goal || null,
      level: data.experience_level || 'beginner',
      weight: data.current_weight ?? null,
      height: data.height ?? null,
      gender: data.gender || 'other',
      restrictions: data.restrictions || null,
      injuries: data.injuries || null,
      medical_notes: data.medical_notes || null,
      available_days: data.available_days || [],
      start_date: data.start_date || null,
      notes: data.notes || null,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authUserId);
      await admin.from('student_access_codes').delete().eq('code', reservedCode);

      if (
        profileError.code === 'P0001'
        || profileError.message.includes('student_limit_reached')
      ) {
        return json({
          error: `Você já atingiu o limite de ${MAX_STUDENTS_PER_TRAINER} alunos.`,
        }, 409);
      }

      console.error('[Create Student] Profile error:', profileError);
      return json({ error: 'Não foi possível salvar o perfil do aluno.' }, 500);
    }

    const { error: reservationUpdateError } = await admin
      .from('student_access_codes')
      .update({ student_id: authUserId })
      .eq('code', reservedCode);

    if (reservationUpdateError) {
      console.error('[Create Student] Reservation link error:', reservationUpdateError);
    }

    return json({
      success: true,
      student_count: (currentStudentCount ?? 0) + 1,
      student_limit: MAX_STUDENTS_PER_TRAINER,
      student: {
        id: authUserId,
        name: data.full_name,
        access_code: reservedCode,
      },
    }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      console.error('[Create Student] Configuration error:', error.message);
      return json({ error: 'O serviço de cadastro ainda não está configurado.' }, 503);
    }

    console.error('[Create Student] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return json({ error: 'Não autorizado.' }, 401);
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('id, name, access_code, goal, level, status, created_at')
      .eq('trainer_id', session.trainer_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const students = data.map((student) => ({
      id: student.id,
      name: student.name,
      access_code: student.access_code,
      goal: student.goal || 'Não definido',
      level: student.level === 'beginner'
        ? 'Iniciante'
        : student.level === 'intermediate'
          ? 'Intermediário'
          : 'Avançado',
      lastWorkout: 'Sem dados',
      frequency: '0x/sem',
      completion: 0,
      status: student.status,
      trend: 'stable',
    }));

    return json({
      students,
      student_count: students.length,
      student_limit: MAX_STUDENTS_PER_TRAINER,
    }, 200);
  } catch (error) {
    console.error('[Get Students] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
