import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { canAccessStudentFeatures } from '@/lib/auth/session-types';
import { completeWorkoutSchema } from '@/lib/validators';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import {
  getWorkoutDayRange,
  getWorkoutWeekRange,
  nextWorkoutDayIdAfterLast,
  weeklyWorkoutAllowance,
} from '@/lib/workouts/week-cycle';
import { getTrailingSaoPauloWeekRange } from '@/lib/time/sao-paulo';
import { resolveWorkoutCompletionTiming } from '@/lib/workouts/completion-time';

type Related<T> = T | T[] | null;

interface RelatedDay {
  name: string;
  day_label: string | null;
}

interface RelatedPlan {
  id: string;
  name: string;
  student_id: string;
  trainer_id: string;
  status: string;
  days_per_week: number | null;
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function one<T>(relation: Related<T>): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') return json({ error: 'Não autorizado.' }, 401);
    if (!canAccessStudentFeatures(session)) return json({ error: 'Conclua o primeiro acesso para continuar.' }, 403);

    const admin = createAdminClient();
    const [{ data: sessions, error: sessionError }, { data: assessments, error: assessmentError }] = await Promise.all([
      admin
        .from('workout_sessions')
        .select(`
          id, started_at, completed_at, duration_seconds, completion_percentage,
          total_volume, status, rating, feedback, workout_days (name, day_label), workout_plans (name)
        `)
        .eq('student_id', session.sub)
        .order('started_at', { ascending: false }),
      admin
        .from('physical_assessments')
        .select('id, assessment_date, weight, body_fat_percentage')
        .eq('student_id', session.sub)
        .order('assessment_date', { ascending: true }),
    ]);

    if (sessionError) throw sessionError;
    if (assessmentError) throw assessmentError;

    const history = (sessions ?? []).map((item) => {
      const day = one(item.workout_days as Related<RelatedDay>);
      const plan = one(item.workout_plans as Related<{ name: string }>);
      return {
        id: item.id,
        date: item.completed_at || item.started_at,
        name: day?.name || plan?.name || 'Treino',
        dayLabel: day?.day_label || '',
        durationSeconds: item.duration_seconds,
        completion: Number(item.completion_percentage ?? 0),
        volume: Number(item.total_volume ?? 0),
        status: item.status,
        rating: item.rating,
        feedback: item.feedback,
      };
    });

    const frequency = Array.from({ length: 4 }).map((_, index) => {
      const range = getTrailingSaoPauloWeekRange(new Date(), index);
      const start = new Date(range.startIso);
      const end = new Date(range.nextStartIso);
      const count = history.filter((workout) => {
        const date = new Date(workout.date);
        return workout.status === 'completed' && date >= start && date < end;
      }).length;
      return { label: index === 0 ? 'Atual' : `-${index} sem`, workouts: count, order: 3 - index };
    }).sort((a, b) => a.order - b.order).map(({ label, workouts }) => ({ label, workouts }));

    return json({
      history,
      progress: {
        completedWorkouts: history.filter((item) => item.status === 'completed').length,
        frequency,
        weight: (assessments ?? []).filter((item) => item.weight != null).map((item) => ({
          date: new Date(`${item.assessment_date}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }),
          weight: Number(item.weight),
        })),
        bodyFat: (assessments ?? []).filter((item) => item.body_fat_percentage != null).map((item) => ({
          date: new Date(`${item.assessment_date}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }),
          value: Number(item.body_fat_percentage),
        })),
      },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    console.error('[Workout Sessions] Get error:', error);
    return json({ error: 'Não foi possível carregar o histórico.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') return json({ error: 'Não autorizado.' }, 401);
    if (!canAccessStudentFeatures(session)) return json({ error: 'Conclua o primeiro acesso para continuar.' }, 403);

    const parsed = completeWorkoutSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Treino inválido.' }, 400);
    const timing = resolveWorkoutCompletionTiming(parsed.data);
    if (!timing.success) return json({ error: timing.error }, 400);

    const admin = createAdminClient();
    const { data: idempotentSession, error: idempotencyError } = await admin
      .from('workout_sessions')
      .select('id, completion_percentage, total_volume')
      .eq('student_id', session.sub)
      .eq('client_session_id', parsed.data.clientSessionId)
      .maybeSingle();
    if (idempotencyError) throw idempotencyError;
    if (idempotentSession) {
      return json({ success: true, session: idempotentSession, idempotent: true });
    }

    const { data: day, error: dayError } = await admin
      .from('workout_days')
      .select('id, plan_id, order_index, workout_plans!inner (id, name, student_id, trainer_id, status, days_per_week)')
      .eq('id', parsed.data.workoutDayId)
      .maybeSingle();

    if (dayError) throw dayError;
    const plan = day ? one(day.workout_plans as Related<RelatedPlan>) : null;
    const acceptsOfflineCompletion = plan?.status === 'archived' && Boolean(parsed.data.completedAt);
    if (
      !day
      || !plan
      || plan.student_id !== session.sub
      || plan.trainer_id !== session.trainer_id
      || (plan.status !== 'active' && !acceptsOfflineCompletion)
    ) {
      return json({ error: 'Este treino não pertence à sua ficha ativa.' }, 403);
    }

    const { data: planDays, error: planDaysError } = await admin
      .from('workout_days')
      .select('id, order_index')
      .eq('plan_id', plan.id)
      .order('order_index', { ascending: true });
    if (planDaysError) throw planDaysError;

    const { startedAt, completedAt, durationSeconds } = timing;
    const weekRange = getWorkoutWeekRange(completedAt);
    const dayRange = getWorkoutDayRange(completedAt);
    const [existingResult, completedTodayResult, previousSessionResult] = await Promise.all([
      admin
        .from('workout_sessions')
        .select('id, completed_at')
        .eq('student_id', session.sub)
        .eq('workout_day_id', day.id)
        .eq('workout_plan_id', plan.id)
        .eq('status', 'completed')
        .gte('completed_at', weekRange.startIso)
        .lt('completed_at', weekRange.nextStartIso)
        .order('completed_at', { ascending: true }),
      admin
        .from('workout_sessions')
        .select('id, workout_day_id, completed_at')
        .eq('student_id', session.sub)
        .eq('workout_plan_id', plan.id)
        .eq('status', 'completed')
        .gte('completed_at', dayRange.startIso)
        .lt('completed_at', dayRange.nextStartIso)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('workout_sessions')
        .select('workout_day_id, completed_at')
        .eq('student_id', session.sub)
        .eq('workout_plan_id', plan.id)
        .eq('status', 'completed')
        .lt('completed_at', completedAt.toISOString())
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const { data: existingSessions, error: existingError } = existingResult;
    if (existingError) throw existingError;
    if (completedTodayResult.error) throw completedTodayResult.error;
    if (previousSessionResult.error) throw previousSessionResult.error;
    const completedToday = completedTodayResult.data;
    if (completedToday) {
      return json({ success: true, session: completedToday, alreadyCompletedToday: true });
    }

    const orderedDayIds = (planDays ?? []).map((planDay) => planDay.id);
    const expectedWorkoutDayId = nextWorkoutDayIdAfterLast(
      orderedDayIds,
      previousSessionResult.data?.workout_day_id,
    );
    if (expectedWorkoutDayId && day.id !== expectedWorkoutDayId) {
      return json({
        error: 'Siga a sequência da ficha antes de concluir este treino.',
        nextWorkoutDayId: expectedWorkoutDayId,
      }, 409);
    }

    const allowance = weeklyWorkoutAllowance(
      orderedDayIds.length,
      plan.days_per_week || orderedDayIds.length || 1,
      day.order_index,
    );
    if ((existingSessions ?? []).length >= allowance) {
      return json({
        success: true,
        session: (existingSessions ?? []).at(-1),
        alreadyCompletedThisWeek: true,
      });
    }

    const { data: plannedExercises, error: exerciseError } = await admin
      .from('workout_exercises')
      .select('id, exercise_id, sets, reps')
      .eq('workout_day_id', day.id);
    if (exerciseError) throw exerciseError;

    const plannedById = new Map((plannedExercises ?? []).map((exercise) => [exercise.id, exercise]));
    if (
      parsed.data.exercises.length !== plannedById.size
      || parsed.data.exercises.some((exercise) => !plannedById.has(exercise.workoutExerciseId))
    ) {
      return json({ error: 'Os exercícios enviados não correspondem a este treino.' }, 400);
    }

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
      ) return json({ error: 'As séries enviadas não correspondem ao treino prescrito.' }, 400);

      for (const set of exercise.sets) {
        if (!set.completed) continue;
        completedSets += 1;
        totalVolume += Number(set.performedRepetitions || 0) * Number(set.performedLoad || 0);
      }
    }

    const completionPercentage = expectedSets > 0
      ? Math.round((completedSets / expectedSets) * 10000) / 100
      : 0;
    const { data: workoutSession, error } = await admin
      .from('workout_sessions')
      .insert({
        student_id: session.sub,
        workout_day_id: day.id,
        workout_plan_id: plan.id,
        client_session_id: parsed.data.clientSessionId,
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        completion_percentage: completionPercentage,
        total_volume: Math.round(totalVolume * 100) / 100,
        status: 'completed',
        duration_seconds: durationSeconds,
        rating: parsed.data.rating ?? null,
        feedback: parsed.data.feedback || null,
      })
      .select('id')
      .single();

    if (error) throw error;

    try {
      const exerciseRows = parsed.data.exercises.map((exercise) => {
        const planned = plannedById.get(exercise.workoutExerciseId)!;
        return {
          workout_session_id: workoutSession.id,
          workout_exercise_id: planned.id,
          exercise_id: planned.exercise_id,
          completed: exercise.sets.every((set) => set.completed),
          skipped: exercise.sets.every((set) => !set.completed),
        };
      });
      const { data: exerciseSessions, error: exerciseSessionError } = await admin
        .from('exercise_sessions')
        .insert(exerciseRows)
        .select('id, workout_exercise_id');
      if (exerciseSessionError) throw exerciseSessionError;

      const exerciseSessionByWorkoutExercise = new Map(
        (exerciseSessions ?? []).map((row) => [row.workout_exercise_id, row.id]),
      );
      const setRows = parsed.data.exercises.flatMap((exercise) => {
        const planned = plannedById.get(exercise.workoutExerciseId)!;
        const plannedRepetitions = /^\d+$/.test(String(planned.reps)) ? Number(planned.reps) : null;
        return exercise.sets.map((set) => ({
          exercise_session_id: exerciseSessionByWorkoutExercise.get(exercise.workoutExerciseId),
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
      const { error: setError } = await admin.from('set_records').insert(setRows);
      if (setError) throw setError;
    } catch (persistenceError) {
      await admin.from('workout_sessions').delete().eq('id', workoutSession.id);
      throw persistenceError;
    }

    return json({
      success: true,
      session: {
        ...workoutSession,
        completion_percentage: completionPercentage,
        total_volume: Math.round(totalVolume * 100) / 100,
        duration_seconds: durationSeconds,
      },
    }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    console.error('[Workout Sessions] Post error:', error);
    return json({ error: 'Não foi possível concluir o treino.' }, 500);
  }
}
