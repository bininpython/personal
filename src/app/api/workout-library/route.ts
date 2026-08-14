import { getSession } from '@/lib/auth/session';
import { canAccessStudentFeatures } from '@/lib/auth/session-types';
import { createAdminClient } from '@/lib/supabase/admin';
import { listWorkoutLibraryTemplates, workoutLibrarySummary } from '@/lib/workout-library';

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    if (!canAccessStudentFeatures(session) && session.role !== 'individual') {
      return json({ error: 'Conclua o primeiro acesso para continuar.' }, 403);
    }

    if (session.role === 'student') {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from('workout_plans')
        .select('id, name, goal, days_per_week, status, start_date, end_date, library_template_id, workout_days(id, workout_exercises(id))')
        .eq('student_id', session.sub)
        .eq('trainer_id', session.trainer_id)
        .eq('status', 'active')
        .not('library_template_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return json({
        assignments: (data ?? []).map((plan) => {
          const days = plan.workout_days ?? [];
          return {
            id: plan.id,
            templateId: plan.library_template_id,
            name: plan.name,
            goal: plan.goal || 'Condicionamento geral',
            daysPerWeek: plan.days_per_week,
            startDate: plan.start_date,
            endDate: plan.end_date,
            workoutDayCount: days.length,
            exerciseCount: days.reduce((total, day) => total + (day.workout_exercises?.length ?? 0), 0),
          };
        }),
      });
    }

    return json({ templates: listWorkoutLibraryTemplates().map(workoutLibrarySummary) });
  } catch (error) {
    console.error('[Workout Library] GET error:', error);
    return json({ error: 'Não foi possível carregar a Biblioteca.' }, 500);
  }
}
