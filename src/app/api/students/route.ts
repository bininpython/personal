import { NextResponse } from 'next/server';
import {
  MAX_STUDENTS_PER_TRAINER,
} from '@/constants';
import { studentCreateSchema } from '@/lib/validators';
import { getSession } from '@/lib/auth/session';
import { generateStudentPrivateCode, getCodeHint, normalizeAuthCode } from '@/lib/auth/credentials';
import { hashPassword, normalizeName, verifyPassword } from '@/lib/auth/hash';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
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
      .eq('trainer_id', session.trainer_id)
      .eq('status', 'active')
      .is('deleted_at', null);

    if (countError) {
      console.error('[Create Student] Count error:', countError);
      return json({ error: 'Não foi possível verificar o limite de alunos.' }, 500);
    }

    if ((currentStudentCount ?? 0) >= MAX_STUDENTS_PER_TRAINER) {
      return json({
        error: `Você já atingiu o limite de ${MAX_STUDENTS_PER_TRAINER} alunos.`,
      }, 409);
    }

    const studentId = crypto.randomUUID();
    const normalizedStudentName = normalizeName(data.full_name);
    const { data: sameNameStudents, error: codeLookupError } = await admin
      .from('students')
      .select('access_code, access_code_hash')
      .eq('login_name_normalized', normalizedStudentName)
      .is('deleted_at', null)
      .limit(50);
    if (codeLookupError) throw codeLookupError;

    let accessCode = '';
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidateCode = generateStudentPrivateCode();
      const canonicalCode = normalizeAuthCode(candidateCode).toUpperCase();
      const alreadyUsed = (await Promise.all((sameNameStudents ?? []).map(async (candidate) => (
        candidate.access_code_hash
          ? verifyPassword(canonicalCode, candidate.access_code_hash).catch(() => false)
          : normalizeAuthCode(candidate.access_code || '').toUpperCase() === canonicalCode
      )))).some(Boolean);
      if (!alreadyUsed) {
        accessCode = candidateCode;
        break;
      }
    }
    if (!accessCode) return json({ error: 'Não foi possível gerar um código exclusivo.' }, 503);

    const { error: profileError } = await admin.from('students').insert({
      id: studentId,
      trainer_id: session.trainer_id,
      name: data.full_name,
      login_name_normalized: normalizedStudentName,
      nickname: data.nickname || null,
      birth_date: data.birth_date || null,
      access_code: null,
      access_code_hash: await hashPassword(normalizeAuthCode(accessCode).toUpperCase()),
      access_code_hint: getCodeHint(accessCode),
      mock_email: null,
      credential_version: 3,
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
      privacy_consent_at: new Date().toISOString(),
      privacy_policy_version: '2026-08-08',
    });

    if (profileError) {
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

    return json({
      success: true,
      student_count: (currentStudentCount ?? 0) + 1,
      student_limit: MAX_STUDENTS_PER_TRAINER,
      student: {
        id: studentId,
        name: data.full_name,
        access_code: accessCode,
        access_code_hint: getCodeHint(accessCode),
        codes_shown_once: true,
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

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('students')
      .select('id, name, access_code_hint, goal, level, status, created_at')
      .eq('trainer_id', session.trainer_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const studentIds = data.map((student) => student.id);
    const { data: sessionRows, error: sessionError } = studentIds.length > 0
      ? await admin
        .from('workout_sessions')
        .select('student_id, started_at, completed_at, completion_percentage, status')
        .in('student_id', studentIds)
        .order('started_at', { ascending: false })
      : { data: [], error: null };

    if (sessionError) throw sessionError;

    const now = new Date();
    const recentStart = new Date(now);
    recentStart.setDate(recentStart.getDate() - 7);
    const previousStart = new Date(now);
    previousStart.setDate(previousStart.getDate() - 14);

    const students = data.map((student) => {
      const studentSessions = (sessionRows ?? []).filter((item) => item.student_id === student.id);
      const completedSessions = studentSessions.filter((item) => item.status === 'completed');
      const recentCount = completedSessions.filter((item) => new Date(item.completed_at || item.started_at) >= recentStart).length;
      const previousCount = completedSessions.filter((item) => {
        const date = new Date(item.completed_at || item.started_at);
        return date >= previousStart && date < recentStart;
      }).length;
      const lastWorkoutDate = studentSessions[0]?.completed_at || studentSessions[0]?.started_at;
      const completion = completedSessions.length > 0
        ? Math.round(completedSessions.reduce(
          (total, item) => total + Number(item.completion_percentage ?? 0),
          0,
        ) / completedSessions.length)
        : 0;

      return {
        id: student.id,
        name: student.name,
        access_code: student.access_code_hint || 'Não disponível',
        goal: student.goal || 'Não definido',
        level: student.level === 'beginner'
          ? 'Iniciante'
          : student.level === 'intermediate'
            ? 'Intermediário'
            : 'Avançado',
        lastWorkout: lastWorkoutDate
          ? new Date(lastWorkoutDate).toLocaleDateString('pt-BR')
          : 'Sem treino registrado',
        frequency: `${recentCount}x/sem`,
        completion,
        status: student.status,
        trend: recentCount > previousCount ? 'up' : recentCount < previousCount ? 'down' : 'stable',
      };
    });

    return json({
      students,
      student_count: students.filter((student) => student.status === 'active').length,
      total_student_count: students.length,
      student_limit: MAX_STUDENTS_PER_TRAINER,
    }, 200);
  } catch (error) {
    console.error('[Get Students] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
