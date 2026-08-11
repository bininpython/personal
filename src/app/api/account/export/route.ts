import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { dateKeyInSaoPaulo } from '@/lib/time/sao-paulo';

const PAGE_SIZE = 500;

async function dataOrThrow<T>(promise: PromiseLike<{ data: T; error: unknown }>) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

async function fetchAll<T>(
  loadPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await dataOrThrow(loadPage(from, from + PAGE_SIZE - 1));
    rows.push(...(page ?? []));
    if (!page || page.length < PAGE_SIZE) return rows;
  }
}

function rowIds(rows: Array<{ id: string }>) {
  return rows.map((row) => row.id);
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const admin = createAdminClient();
    let exportData: Record<string, unknown>;

    if (session.role === 'trainer') {
      const profile = await dataOrThrow(admin
        .from('trainers')
        .select('id, name, nickname, age, professional_name, cref, gym_name, city, state, phone, specialties, avatar_url, public_code, terms_accepted_at, terms_version, privacy_policy_version, created_at, last_login_at')
        .eq('id', session.sub)
        .single());
      const students = await fetchAll<{ id: string }>((from, to) => admin
        .from('students')
        .select('id, trainer_id, name, nickname, birth_date, gender, goal, level, weight, height, restrictions, injuries, medical_notes, available_days, start_date, status, notes, avatar_url, privacy_consent_at, privacy_policy_version, terms_accepted_at, terms_version, trainer_privacy_attested_at, trainer_privacy_attested_by, trainer_privacy_policy_version, created_at')
        .eq('trainer_id', session.trainer_id)
        .is('deleted_at', null)
        .order('created_at')
        .range(from, to));
      const studentIds = rowIds(students);
      const workoutPlans = await fetchAll<{ id: string }>((from, to) => admin
        .from('workout_plans').select('*').eq('trainer_id', session.trainer_id).order('created_at').range(from, to));
      const planIds = rowIds(workoutPlans);
      const workoutDays = planIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('workout_days').select('*').in('plan_id', planIds).order('created_at').range(from, to))
        : [];
      const dayIds = rowIds(workoutDays);
      const workoutExercises = dayIds.length
        ? await fetchAll<{ id: string; exercise_id: string }>((from, to) => admin.from('workout_exercises').select('*').in('workout_day_id', dayIds).order('created_at').range(from, to))
        : [];
      const exerciseIds = [...new Set(workoutExercises.map((row) => row.exercise_id))];
      const exercises = exerciseIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('exercises').select('*').in('id', exerciseIds).order('created_at').range(from, to))
        : [];
      const assessments = studentIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('physical_assessments').select('*').in('student_id', studentIds).order('created_at').range(from, to))
        : [];
      const workoutSessions = studentIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('workout_sessions').select('*').in('student_id', studentIds).order('created_at').range(from, to))
        : [];
      const workoutSessionIds = rowIds(workoutSessions);
      const exerciseSessions = workoutSessionIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('exercise_sessions').select('*').in('workout_session_id', workoutSessionIds).order('created_at').range(from, to))
        : [];
      const exerciseSessionIds = rowIds(exerciseSessions);
      const setRecords = exerciseSessionIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('set_records').select('*').in('exercise_session_id', exerciseSessionIds).order('created_at').range(from, to))
        : [];
      const appointments = await fetchAll<{ id: string }>((from, to) => admin.from('appointments').select('*').eq('trainer_id', session.trainer_id).order('created_at').range(from, to));
      const messages = await fetchAll<{ id: string }>((from, to) => admin.from('messages').select('*').or(`sender_id.eq.${session.sub},recipient_id.eq.${session.sub}`).order('created_at').range(from, to));
      const notifications = await fetchAll<{ id: string }>((from, to) => admin.from('notifications').select('*').eq('user_id', session.sub).eq('user_type', 'trainer').order('created_at').range(from, to));
      const studentAchievements = studentIds.length
        ? await fetchAll<{ id: string; achievement_id: string }>((from, to) => admin.from('student_achievements').select('*').in('student_id', studentIds).order('created_at').range(from, to))
        : [];
      const achievementIds = [...new Set(studentAchievements.map((row) => row.achievement_id))];
      const achievements = achievementIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('achievements').select('*').in('id', achievementIds).order('created_at').range(from, to))
        : [];

      exportData = {
        profile, students, workoutPlans, workoutDays, workoutExercises, exercises,
        assessments, workoutSessions, exerciseSessions, setRecords, appointments,
        messages, notifications, studentAchievements, achievements,
      };
    } else if (session.role === 'individual') {
      const profile = await dataOrThrow(admin
        .from('individual_users')
        .select('id, name, email, city, birth_date, gender, height, weight, goal, level, available_days, restrictions, biography, status, avatar_url, terms_accepted_at, terms_version, privacy_policy_version, created_at, last_login_at')
        .eq('id', session.sub)
        .single());
      const workoutPlans = await fetchAll<{ id: string }>((from, to) => admin
        .from('individual_workout_plans').select('*').eq('user_id', session.sub).order('created_at').range(from, to));
      const planIds = rowIds(workoutPlans);
      const workoutDays = planIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('individual_workout_days').select('*').in('plan_id', planIds).order('created_at').range(from, to))
        : [];
      const dayIds = rowIds(workoutDays);
      const workoutExercises = dayIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('individual_workout_exercises').select('*').in('workout_day_id', dayIds).order('created_at').range(from, to))
        : [];
      exportData = { profile, workoutPlans, workoutDays, workoutExercises };
    } else {
      const profile = await dataOrThrow(admin
        .from('students')
        .select('id, trainer_id, name, nickname, birth_date, gender, goal, level, weight, height, restrictions, injuries, medical_notes, available_days, start_date, status, notes, avatar_url, privacy_consent_at, privacy_policy_version, terms_accepted_at, terms_version, trainer_privacy_attested_at, trainer_privacy_attested_by, trainer_privacy_policy_version, created_at, last_login_at')
        .eq('id', session.sub)
        .single());
      const workoutPlans = await fetchAll<{ id: string }>((from, to) => admin.from('workout_plans').select('*').eq('student_id', session.sub).order('created_at').range(from, to));
      const planIds = rowIds(workoutPlans);
      const workoutDays = planIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('workout_days').select('*').in('plan_id', planIds).order('created_at').range(from, to))
        : [];
      const dayIds = rowIds(workoutDays);
      const workoutExercises = dayIds.length
        ? await fetchAll<{ id: string; exercise_id: string }>((from, to) => admin.from('workout_exercises').select('*').in('workout_day_id', dayIds).order('created_at').range(from, to))
        : [];
      const exerciseIds = [...new Set(workoutExercises.map((row) => row.exercise_id))];
      const exercises = exerciseIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('exercises').select('*').in('id', exerciseIds).order('created_at').range(from, to))
        : [];
      const assessments = await fetchAll<{ id: string }>((from, to) => admin.from('physical_assessments').select('*').eq('student_id', session.sub).order('created_at').range(from, to));
      const workoutSessions = await fetchAll<{ id: string }>((from, to) => admin.from('workout_sessions').select('*').eq('student_id', session.sub).order('created_at').range(from, to));
      const workoutSessionIds = rowIds(workoutSessions);
      const exerciseSessions = workoutSessionIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('exercise_sessions').select('*').in('workout_session_id', workoutSessionIds).order('created_at').range(from, to))
        : [];
      const exerciseSessionIds = rowIds(exerciseSessions);
      const setRecords = exerciseSessionIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('set_records').select('*').in('exercise_session_id', exerciseSessionIds).order('created_at').range(from, to))
        : [];
      const appointments = await fetchAll<{ id: string }>((from, to) => admin.from('appointments').select('*').eq('student_id', session.sub).order('created_at').range(from, to));
      const messages = await fetchAll<{ id: string }>((from, to) => admin.from('messages').select('*').or(`sender_id.eq.${session.sub},recipient_id.eq.${session.sub}`).order('created_at').range(from, to));
      const notifications = await fetchAll<{ id: string }>((from, to) => admin.from('notifications').select('*').eq('user_id', session.sub).eq('user_type', 'student').order('created_at').range(from, to));
      const studentAchievements = await fetchAll<{ id: string; achievement_id: string }>((from, to) => admin.from('student_achievements').select('*').eq('student_id', session.sub).order('created_at').range(from, to));
      const achievementIds = [...new Set(studentAchievements.map((row) => row.achievement_id))];
      const achievements = achievementIds.length
        ? await fetchAll<{ id: string }>((from, to) => admin.from('achievements').select('*').in('id', achievementIds).order('created_at').range(from, to))
        : [];

      exportData = {
        profile, workoutPlans, workoutDays, workoutExercises, exercises,
        assessments, workoutSessions, exerciseSessions, setRecords, appointments,
        messages, notifications, studentAchievements, achievements,
      };
    }

    const exportedAt = new Date().toISOString();
    const body = JSON.stringify({
      product: 'G KONG',
      schemaVersion: 2,
      exportedAt,
      subjectType: session.role,
      data: exportData,
    }, null, 2);
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="g-kong-export-${dateKeyInSaoPaulo()}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Account Export] Error:', error);
    return Response.json({ error: 'Não foi possível gerar a exportação.' }, { status: 500 });
  }
}
