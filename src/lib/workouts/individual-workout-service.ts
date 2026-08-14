import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getIndividualPlan } from './individual-plan-service';
import {
  getWorkoutDayRange,
  getWorkoutWeekRange,
  nextWorkoutDayId,
  weeklyWorkoutAllowance,
} from './week-cycle';

type Related<T> = T | T[] | null;

function one<T>(relation: Related<T>) {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export async function getActiveIndividualWorkout(userId: string) {
  const admin = createAdminClient();
  const { data: active, error: activeError } = await admin
    .from('individual_workout_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (activeError) throw activeError;
  if (!active) return null;

  const plan = await getIndividualPlan(userId, active.id);
  if (!plan) return null;

  const weekRange = getWorkoutWeekRange();
  const dayRange = getWorkoutDayRange();
  const [weekResult, recentResult] = await Promise.all([
    admin
      .from('individual_workout_sessions')
      .select('id, workout_day_id, completed_at')
      .eq('user_id', userId)
      .eq('workout_plan_id', plan.id)
      .eq('status', 'completed')
      .gte('completed_at', weekRange.startIso)
      .lt('completed_at', weekRange.nextStartIso)
      .order('completed_at', { ascending: true }),
    admin
      .from('individual_workout_sessions')
      .select('id, workout_day_id, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50),
  ]);
  if (weekResult.error) throw weekResult.error;
  if (recentResult.error) throw recentResult.error;

  const weekSessions = weekResult.data ?? [];
  const recentSessions = recentResult.data ?? [];
  const recentSessionIds = recentSessions.map((session) => session.id);
  const lastPerformanceByExercise = new Map<string, {
    sets: number;
    repetitions: number | null;
    load: number | null;
    rpe: number | null;
    completedAt: string | null;
  }>();

  if (recentSessionIds.length > 0) {
    const { data: exerciseSessions, error: exerciseError } = await admin
      .from('individual_exercise_sessions')
      .select('id, exercise_key, workout_session_id')
      .in('workout_session_id', recentSessionIds);
    if (exerciseError) throw exerciseError;

    const sessionOrder = new Map(recentSessionIds.map((id, index) => [id, index]));
    const latestByExercise = new Map<string, { id: string; workout_session_id: string }>();
    for (const item of (exerciseSessions ?? []).slice().sort((left, right) => (
      (sessionOrder.get(left.workout_session_id) ?? Number.MAX_SAFE_INTEGER)
      - (sessionOrder.get(right.workout_session_id) ?? Number.MAX_SAFE_INTEGER)
    ))) {
      if (!latestByExercise.has(item.exercise_key)) latestByExercise.set(item.exercise_key, item);
    }

    const exerciseSessionIds = [...latestByExercise.values()].map((item) => item.id);
    if (exerciseSessionIds.length > 0) {
      const { data: records, error: recordsError } = await admin
        .from('individual_set_records')
        .select('exercise_session_id, set_number, completed, performed_repetitions, performed_load, rpe')
        .in('exercise_session_id', exerciseSessionIds)
        .eq('completed', true)
        .order('set_number', { ascending: true });
      if (recordsError) throw recordsError;

      for (const [exerciseKey, exerciseSession] of latestByExercise) {
        const exerciseRecords = (records ?? []).filter((record) => record.exercise_session_id === exerciseSession.id);
        if (exerciseRecords.length === 0) continue;
        const loads = exerciseRecords.map((record) => record.performed_load).filter((value): value is number => value !== null);
        const rpes = exerciseRecords.map((record) => record.rpe).filter((value): value is number => value !== null);
        lastPerformanceByExercise.set(exerciseKey, {
          sets: exerciseRecords.length,
          repetitions: exerciseRecords.find((record) => record.performed_repetitions !== null)?.performed_repetitions ?? null,
          load: loads.length > 0 ? Math.max(...loads.map(Number)) : null,
          rpe: rpes.length > 0 ? Math.round((rpes.reduce((sum, value) => sum + Number(value), 0) / rpes.length) * 10) / 10 : null,
          completedAt: recentSessions.find((session) => session.id === exerciseSession.workout_session_id)?.completed_at ?? null,
        });
      }
    }
  }

  const completedByDay = new Map<string, number>();
  for (const session of weekSessions) {
    completedByDay.set(session.workout_day_id, (completedByDay.get(session.workout_day_id) ?? 0) + 1);
  }

  const days = plan.days.map((day, dayIndex, allDays) => {
    const weeklyAllowance = weeklyWorkoutAllowance(allDays.length, plan.daysPerWeek, dayIndex);
    const weeklyCompletions = completedByDay.get(day.id) ?? 0;
    const latestForDay = recentSessions.find((session) => session.workout_day_id === day.id);
    return {
      ...day,
      weeklyAllowance,
      weeklyCompletions,
      completedThisWeek: weeklyCompletions >= weeklyAllowance,
      completedToday: weekSessions.some((session) => (
        session.workout_day_id === day.id
        && session.completed_at >= dayRange.startIso
        && session.completed_at < dayRange.nextStartIso
      )),
      lastCompletedAt: latestForDay?.completed_at ?? null,
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        lastPerformance: lastPerformanceByExercise.get(exercise.exerciseKey) ?? null,
      })),
    };
  });

  const weeklyTarget = Math.max(days.length, plan.daysPerWeek);
  const completedToday = weekSessions.some((session) => (
    session.completed_at >= dayRange.startIso
    && session.completed_at < dayRange.nextStartIso
  ));

  return {
    ...plan,
    days,
    week: {
      currentDate: dayRange.date,
      startDate: weekRange.startDate,
      endDate: weekRange.endDate,
      target: weeklyTarget,
      completed: weekSessions.length,
      isComplete: weekSessions.length >= weeklyTarget,
      completedToday,
      nextWorkoutDayId: nextWorkoutDayId(
        days.map((day) => day.id),
        weeklyTarget,
        completedByDay,
      ),
    },
  };
}

export async function listIndividualWorkoutHistory(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('individual_workout_sessions')
    .select(`
      id, started_at, completed_at, duration_seconds, completion_percentage,
      total_volume, status, rating, feedback,
      individual_workout_days (name, day_label),
      individual_workout_plans (name)
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  return (data ?? []).map((session) => {
    const day = one(session.individual_workout_days as Related<{ name: string; day_label: string }>);
    const plan = one(session.individual_workout_plans as Related<{ name: string }>);
    return {
      id: session.id,
      date: session.completed_at || session.started_at,
      name: day?.name || plan?.name || 'Treino',
      planName: plan?.name || 'Ficha',
      dayLabel: day?.day_label || '',
      durationSeconds: session.duration_seconds,
      completion: Number(session.completion_percentage ?? 0),
      volume: Number(session.total_volume ?? 0),
      status: session.status,
      rating: session.rating,
      feedback: session.feedback,
    };
  });
}
