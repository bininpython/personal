import { getSession } from '@/lib/auth/session';
import { completeWorkoutSchema } from '@/lib/validators';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveWorkoutCompletionTiming } from '@/lib/workouts/completion-time';
import { listIndividualWorkoutHistory } from '@/lib/workouts/individual-workout-service';
import {
  getWorkoutDayRange,
  getWorkoutWeekRange,
  nextWorkoutDayId,
  weeklyWorkoutAllowance,
} from '@/lib/workouts/week-cycle';

type Related<T> = T | T[] | null;

interface RelatedIndividualPlan {
  id: string;
  user_id: string;
  status: string;
  days_per_week: number;
}

function one<T>(relation: Related<T>) {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);
    const history = await listIndividualWorkoutHistory(session.sub);
    return json({
      history,
      summary: {
        completedWorkouts: history.filter((item) => item.status === 'completed').length,
        totalVolume: Math.round(history.reduce((sum, item) => sum + item.volume, 0) * 100) / 100,
      },
    });
  } catch (error) {
    console.error('[Individual Workout Sessions] GET error:', error);
    return json({ error: 'Não foi possível carregar seu histórico.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);

    const parsed = completeWorkoutSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Treino inválido.' }, 400);
    const timing = resolveWorkoutCompletionTiming(parsed.data);
    if (!timing.success) return json({ error: timing.error }, 400);

    const admin = createAdminClient();
    const { data: idempotent, error: idempotencyError } = await admin
      .from('individual_workout_sessions')
      .select('id, completion_percentage, total_volume')
      .eq('user_id', session.sub)
      .eq('client_session_id', parsed.data.clientSessionId)
      .maybeSingle();
    if (idempotencyError) throw idempotencyError;
    if (idempotent) return json({ success: true, session: idempotent, idempotent: true });

    const { data: day, error: dayError } = await admin
      .from('individual_workout_days')
      .select('id, plan_id, order_index, individual_workout_plans!inner (id, user_id, status, days_per_week)')
      .eq('id', parsed.data.workoutDayId)
      .maybeSingle();
    if (dayError) throw dayError;
    const plan = day ? one(day.individual_workout_plans as Related<RelatedIndividualPlan>) : null;
    if (!day || !plan || plan.user_id !== session.sub || plan.status !== 'active') {
      return json({ error: 'Este treino não pertence à sua ficha ativa.' }, 403);
    }

    const { data: planDays, error: planDaysError } = await admin
      .from('individual_workout_days')
      .select('id, order_index')
      .eq('plan_id', plan.id)
      .order('order_index', { ascending: true });
    if (planDaysError) throw planDaysError;

    const { startedAt, completedAt, durationSeconds } = timing;
    const weekRange = getWorkoutWeekRange(completedAt);
    const dayRange = getWorkoutDayRange(completedAt);
    const { data: weekSessions, error: weekSessionsError } = await admin
      .from('individual_workout_sessions')
      .select('id, workout_day_id, completed_at')
      .eq('user_id', session.sub)
      .eq('workout_plan_id', plan.id)
      .eq('status', 'completed')
      .gte('completed_at', weekRange.startIso)
      .lt('completed_at', weekRange.nextStartIso)
      .order('completed_at', { ascending: true });
    if (weekSessionsError) throw weekSessionsError;

    const completedToday = (weekSessions ?? []).find((item) => (
      item.completed_at >= dayRange.startIso
      && item.completed_at < dayRange.nextStartIso
    ));
    if (completedToday) {
      return json({ success: true, session: completedToday, alreadyCompletedToday: true });
    }

    const orderedDayIds = (planDays ?? []).map((planDay) => planDay.id);
    const completedByDay = new Map<string, number>();
    for (const completed of weekSessions ?? []) {
      completedByDay.set(completed.workout_day_id, (completedByDay.get(completed.workout_day_id) ?? 0) + 1);
    }
    const weeklyTarget = Math.max(orderedDayIds.length, plan.days_per_week || orderedDayIds.length);
    const expectedWorkoutDayId = nextWorkoutDayId(
      orderedDayIds,
      weeklyTarget,
      completedByDay,
    );
    if (!expectedWorkoutDayId) {
      return json({
        success: true,
        session: (weekSessions ?? []).at(-1),
        alreadyCompletedThisWeek: true,
      });
    }
    if (day.id !== expectedWorkoutDayId) {
      return json({
        error: 'Siga a sequência semanal antes de concluir esta ficha.',
        nextWorkoutDayId: expectedWorkoutDayId,
      }, 409);
    }

    const sameWorkoutWeek = (weekSessions ?? []).filter((item) => item.workout_day_id === day.id);
    const allowance = weeklyWorkoutAllowance(
      orderedDayIds.length,
      plan.days_per_week || orderedDayIds.length || 1,
      day.order_index,
    );
    if (sameWorkoutWeek.length >= allowance) {
      return json({
        success: true,
        session: sameWorkoutWeek.at(-1),
        alreadyCompletedThisWeek: true,
      });
    }

    const { data: plannedExercises, error: exercisesError } = await admin
      .from('individual_workout_exercises')
      .select('id, exercise_key, sets, reps')
      .eq('workout_day_id', day.id);
    if (exercisesError) throw exercisesError;
    const plannedById = new Map((plannedExercises ?? []).map((exercise) => [exercise.id, exercise]));
    if (
      parsed.data.exercises.length !== plannedById.size
      || parsed.data.exercises.some((exercise) => !plannedById.has(exercise.workoutExerciseId))
    ) return json({ error: 'Os exercícios enviados não correspondem a este treino.' }, 400);

    let expectedSets = 0;
    let completedSets = 0;
    let totalVolume = 0;
    for (const exercise of parsed.data.exercises) {
      const planned = plannedById.get(exercise.workoutExerciseId)!;
      expectedSets += Number(planned.sets || 0);
      const uniqueSets = new Set(exercise.sets.map((set) => set.setNumber));
      if (
        exercise.sets.length !== Number(planned.sets)
        || uniqueSets.size !== exercise.sets.length
        || exercise.sets.some((set) => set.setNumber > Number(planned.sets))
      ) return json({ error: 'As séries enviadas não correspondem ao treino planejado.' }, 400);
      for (const set of exercise.sets) {
        if (!set.completed) continue;
        completedSets += 1;
        totalVolume += Number(set.performedRepetitions || 0) * Number(set.performedLoad || 0);
      }
    }

    const completionPercentage = expectedSets > 0 ? Math.round((completedSets / expectedSets) * 10000) / 100 : 0;
    const roundedVolume = Math.round(totalVolume * 100) / 100;
    const { data: workoutSession, error: sessionError } = await admin
      .from('individual_workout_sessions')
      .insert({
        user_id: session.sub,
        workout_day_id: day.id,
        workout_plan_id: plan.id,
        client_session_id: parsed.data.clientSessionId,
        workout_date: dayRange.date,
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds,
        completion_percentage: completionPercentage,
        total_volume: roundedVolume,
        status: 'completed',
        rating: parsed.data.rating ?? null,
        feedback: parsed.data.feedback || null,
      })
      .select('id')
      .single();
    if (sessionError || !workoutSession) throw sessionError || new Error('Treino não salvo.');

    try {
      const exerciseRows = parsed.data.exercises.map((exercise) => {
        const planned = plannedById.get(exercise.workoutExerciseId)!;
        return {
          workout_session_id: workoutSession.id,
          workout_exercise_id: planned.id,
          exercise_key: planned.exercise_key,
          completed: exercise.sets.every((set) => set.completed),
          skipped: exercise.sets.every((set) => !set.completed),
        };
      });
      const { data: exerciseSessions, error: exerciseSessionError } = await admin
        .from('individual_exercise_sessions')
        .insert(exerciseRows)
        .select('id, workout_exercise_id');
      if (exerciseSessionError) throw exerciseSessionError;

      const sessionByExercise = new Map((exerciseSessions ?? []).map((row) => [row.workout_exercise_id, row.id]));
      const setRows = parsed.data.exercises.flatMap((exercise) => {
        const planned = plannedById.get(exercise.workoutExerciseId)!;
        const plannedRepetitions = /^\d+$/.test(String(planned.reps)) ? Number(planned.reps) : null;
        return exercise.sets.map((set) => ({
          exercise_session_id: sessionByExercise.get(exercise.workoutExerciseId),
          set_number: set.setNumber,
          completed: set.completed,
          planned_repetitions: plannedRepetitions,
          performed_repetitions: set.performedRepetitions ?? null,
          performed_load: set.performedLoad ?? null,
          rpe: set.rpe ?? null,
          completed_at: set.completed ? completedAt.toISOString() : null,
        }));
      });
      if (setRows.some((row) => !row.exercise_session_id)) throw new Error('Série sem exercício executado.');
      const { error: setError } = await admin.from('individual_set_records').insert(setRows);
      if (setError) throw setError;
    } catch (persistenceError) {
      await admin.from('individual_workout_sessions').delete().eq('id', workoutSession.id).eq('user_id', session.sub);
      throw persistenceError;
    }

    return json({
      success: true,
      session: {
        id: workoutSession.id,
        completion_percentage: completionPercentage,
        total_volume: roundedVolume,
        duration_seconds: durationSeconds,
      },
    }, 201);
  } catch (error) {
    console.error('[Individual Workout Sessions] POST error:', error);
    return json({ error: 'Não foi possível concluir seu treino.' }, 500);
  }
}
