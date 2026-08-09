import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

async function dataOrThrow<T>(promise: PromiseLike<{ data: T; error: unknown }>) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const admin = createAdminClient();
    let exportData: Record<string, unknown>;

    if (session.role === 'trainer') {
      const profile = await dataOrThrow(admin.from('trainers').select('id, name, professional_name, cref, gym_name, city, state, specialties, public_code, created_at, last_login_at').eq('id', session.sub).single());
      const students = await dataOrThrow(admin.from('students').select('id, name, nickname, birth_date, gender, goal, level, weight, height, restrictions, injuries, medical_notes, available_days, start_date, status, notes, privacy_consent_at, created_at').eq('trainer_id', session.trainer_id).is('deleted_at', null));
      const studentIds = (students ?? []).map((student: { id: string }) => student.id);
      const [plans, assessments, sessions, appointments] = await Promise.all([
        dataOrThrow(admin.from('workout_plans').select('*').eq('trainer_id', session.trainer_id)),
        studentIds.length ? dataOrThrow(admin.from('physical_assessments').select('*').in('student_id', studentIds)) : [],
        studentIds.length ? dataOrThrow(admin.from('workout_sessions').select('*').in('student_id', studentIds)) : [],
        dataOrThrow(admin.from('appointments').select('*').eq('trainer_id', session.trainer_id)),
      ]);
      exportData = { profile, students, workoutPlans: plans, assessments, workoutSessions: sessions, appointments };
    } else {
      const profile = await dataOrThrow(admin.from('students').select('id, trainer_id, name, nickname, birth_date, gender, goal, level, weight, height, restrictions, injuries, medical_notes, available_days, start_date, status, privacy_consent_at, created_at').eq('id', session.sub).single());
      const [plans, assessments, sessions, appointments] = await Promise.all([
        dataOrThrow(admin.from('workout_plans').select('*').eq('student_id', session.sub)),
        dataOrThrow(admin.from('physical_assessments').select('*').eq('student_id', session.sub)),
        dataOrThrow(admin.from('workout_sessions').select('*').eq('student_id', session.sub)),
        dataOrThrow(admin.from('appointments').select('*').eq('student_id', session.sub)),
      ]);
      const sessionIds = (sessions ?? []).map((item: { id: string }) => item.id);
      const exerciseSessions = sessionIds.length
        ? await dataOrThrow(admin.from('exercise_sessions').select('*').in('workout_session_id', sessionIds))
        : [];
      const exerciseSessionIds = (exerciseSessions ?? []).map((item: { id: string }) => item.id);
      const setRecords = exerciseSessionIds.length
        ? await dataOrThrow(admin.from('set_records').select('*').in('exercise_session_id', exerciseSessionIds))
        : [];
      exportData = { profile, workoutPlans: plans, assessments, workoutSessions: sessions, exerciseSessions, setRecords, appointments };
    }

    const body = JSON.stringify({
      product: 'FitControl Pro',
      exportedAt: new Date().toISOString(),
      subjectType: session.role,
      data: exportData,
    }, null, 2);
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="fitcontrol-export-${new Date().toISOString().slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Account Export] Error:', error);
    return Response.json({ error: 'Não foi possível gerar a exportação.' }, { status: 500 });
  }
}
