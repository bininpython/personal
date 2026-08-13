import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { canAccessStudentFeatures } from '@/lib/auth/session-types';
import { createAdminClient } from '@/lib/supabase/admin';
import { workoutPlanCreateSchema } from '@/lib/validators';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { isPlanExpired } from '@/lib/workouts/plan-validity';
import {
  getWorkoutDayRange,
  getWorkoutWeekRange,
  nextWorkoutDayId,
  weeklyWorkoutAllowance,
} from '@/lib/workouts/week-cycle';
import {
  publishWorkoutPlanRevision,
  WorkoutPlanPublishError,
} from '@/lib/workouts/plan-service';

type Related<T> = T | T[] | null;

interface RelatedStudent {
  name: string;
}

interface RelatedExercise {
  id: string;
  name: string;
  target_muscle: string | null;
  video_url: string | null;
  instructions: string | null;
}

interface RelatedWorkoutExercise {
  id: string;
  sets: number;
  reps: string;
  rest_time: number;
  method: string | null;
  order_index: number;
  exercises: Related<RelatedExercise>;
}

interface RelatedWorkoutDay {
  id: string;
  name: string;
  day_label: string | null;
  order_index: number;
  workout_exercises: RelatedWorkoutExercise[] | null;
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function one<T>(related: Related<T>): T | null {
  return Array.isArray(related) ? (related[0] ?? null) : related;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return json({ error: 'Não autorizado.' }, 401);
    if (!canAccessStudentFeatures(session)) return json({ error: 'Conclua o primeiro acesso para continuar.' }, 403);

    const admin = createAdminClient();

    if (session.role === 'trainer') {
      const { data, error } = await admin
        .from('workout_plans')
        .select(`
          id, student_id, name, goal, days_per_week, status, start_date, end_date, created_at,
          students (name),
          workout_days (id, workout_exercises (id))
        `)
        .eq('trainer_id', session.trainer_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const plans = (data ?? []).map((plan) => {
        const student = one(plan.students as Related<RelatedStudent>);
        const days = (plan.workout_days ?? []) as Array<{
          id: string;
          workout_exercises: Array<{ id: string }> | null;
        }>;
        const exerciseCount = days.reduce(
          (total, day) => total + (day.workout_exercises?.length ?? 0),
          0,
        );

        return {
          id: plan.id,
          studentId: plan.student_id,
          name: plan.name,
          student: student?.name ?? 'Aluno',
          goal: plan.goal || 'Geral',
          days: plan.days_per_week || days.length,
          workoutDayCount: days.length,
          exerciseCount,
          status: plan.status,
          startDate: plan.start_date,
          endDate: plan.end_date,
          isExpired: plan.status === 'active' && isPlanExpired(plan.end_date),
          createdAt: plan.created_at,
        };
      });

      return json({ plans });
    }

    const { data, error } = await admin
      .from('workout_plans')
      .select(`
        id, name, goal, days_per_week, status, start_date, end_date, created_at,
        workout_days (
          id, name, day_label, order_index,
          workout_exercises (
            id, sets, reps, rest_time, method, order_index,
            exercises (id, name, target_muscle, video_url, instructions)
          )
        )
      `)
      .eq('student_id', session.sub)
      .eq('trainer_id', session.trainer_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return json({ plan: null });

    const weekRange = getWorkoutWeekRange();
    const dayRange = getWorkoutDayRange();
    const { data: completedSessions, error: completedError } = await admin
      .from('workout_sessions')
      .select('workout_day_id, completed_at')
      .eq('student_id', session.sub)
      .eq('workout_plan_id', data.id)
      .eq('status', 'completed')
      .gte('completed_at', weekRange.startIso)
      .lt('completed_at', weekRange.nextStartIso)
      .order('completed_at', { ascending: true });
    if (completedError) throw completedError;

    const currentExerciseIds = Array.from(new Set(((data.workout_days ?? []) as RelatedWorkoutDay[]).flatMap((day) => (
      (day.workout_exercises ?? []).flatMap((item) => {
        const exercise = one(item.exercises);
        return exercise?.id ? [exercise.id] : [];
      })
    ))));
    const lastPerformanceByExercise = new Map<string, { sets: number; repetitions: number | null; load: number | null; rpe: number | null; completedAt: string | null }>();

    if (currentExerciseIds.length > 0) {
      const { data: recentSessions, error: recentSessionsError } = await admin
        .from('workout_sessions')
        .select('id, completed_at')
        .eq('student_id', session.sub)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);
      if (recentSessionsError) throw recentSessionsError;

      const recentSessionIds = (recentSessions ?? []).map((item) => item.id);
      if (recentSessionIds.length > 0) {
        const { data: exerciseSessions, error: exerciseSessionsError } = await admin
          .from('exercise_sessions')
          .select('id, exercise_id, workout_session_id')
          .in('workout_session_id', recentSessionIds)
          .in('exercise_id', currentExerciseIds);
        if (exerciseSessionsError) throw exerciseSessionsError;

        const sessionOrder = new Map(recentSessionIds.map((id, index) => [id, index]));
        const latestExerciseSessions = new Map<string, { id: string; workout_session_id: string }>();
        for (const item of (exerciseSessions ?? []).sort((left, right) => (
          (sessionOrder.get(left.workout_session_id) ?? Number.MAX_SAFE_INTEGER)
          - (sessionOrder.get(right.workout_session_id) ?? Number.MAX_SAFE_INTEGER)
        ))) {
          if (!latestExerciseSessions.has(item.exercise_id)) latestExerciseSessions.set(item.exercise_id, item);
        }

        const latestExerciseSessionIds = [...latestExerciseSessions.values()].map((item) => item.id);
        if (latestExerciseSessionIds.length > 0) {
          const { data: setRecords, error: setRecordsError } = await admin
            .from('set_records')
            .select('exercise_session_id, set_number, completed, performed_repetitions, performed_load, rpe')
            .in('exercise_session_id', latestExerciseSessionIds)
            .eq('completed', true)
            .order('set_number', { ascending: true });
          if (setRecordsError) throw setRecordsError;

          for (const [exerciseId, exerciseSession] of latestExerciseSessions) {
            const records = (setRecords ?? []).filter((record) => record.exercise_session_id === exerciseSession.id);
            if (records.length === 0) continue;
            const repetitions = records.find((record) => record.performed_repetitions !== null)?.performed_repetitions ?? null;
            const loads = records.map((record) => record.performed_load).filter((value): value is number => value !== null);
            const rpes = records.map((record) => record.rpe).filter((value): value is number => value !== null);
            const completedAt = recentSessions?.find((item) => item.id === exerciseSession.workout_session_id)?.completed_at ?? null;
            lastPerformanceByExercise.set(exerciseId, {
              sets: records.length,
              repetitions,
              load: loads.length > 0 ? Math.max(...loads) : null,
              rpe: rpes.length > 0 ? Math.round((rpes.reduce((sum, value) => sum + value, 0) / rpes.length) * 10) / 10 : null,
              completedAt,
            });
          }
        }
      }
    }

    const completedByDay = new Map<string, number>();
    const lastCompletedByDay = new Map<string, string>();
    for (const completed of completedSessions ?? []) {
      completedByDay.set(completed.workout_day_id, (completedByDay.get(completed.workout_day_id) ?? 0) + 1);
      if (completed.completed_at) lastCompletedByDay.set(completed.workout_day_id, completed.completed_at);
    }

    const days = ((data.workout_days ?? []) as RelatedWorkoutDay[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((day, dayIndex, allDays) => {
        const weeklyAllowance = weeklyWorkoutAllowance(
          allDays.length,
          data.days_per_week || allDays.length,
          dayIndex,
        );
        const weeklyCompletions = completedByDay.get(day.id) ?? 0;
        const completedToday = (completedSessions ?? []).some((session) => (
          session.workout_day_id === day.id
          && session.completed_at
          && session.completed_at >= dayRange.startIso
          && session.completed_at < dayRange.nextStartIso
        ));
        return {
          id: day.id,
          label: day.day_label || '',
          name: day.name,
          weeklyAllowance,
          weeklyCompletions,
          completedThisWeek: weeklyCompletions >= weeklyAllowance,
          completedToday,
          lastCompletedAt: lastCompletedByDay.get(day.id) ?? null,
          exercises: (day.workout_exercises ?? [])
            .sort((a, b) => a.order_index - b.order_index)
            .map((item) => {
              const exercise = one(item.exercises);
              return {
                id: item.id,
                exerciseId: exercise?.id ?? '',
                name: exercise?.name ?? 'Exercício',
                muscle: exercise?.target_muscle?.split(':')[0] ?? '',
                instructions: exercise?.instructions ?? '',
                videoUrl: exercise?.video_url ?? null,
                sets: item.sets,
                reps: item.reps,
                restTime: item.rest_time,
                method: item.method || '',
                lastPerformance: exercise?.id ? lastPerformanceByExercise.get(exercise.id) ?? null : null,
              };
            }),
        };
      });

    const weeklyTarget = Math.max(days.length, data.days_per_week || days.length);
    const completedThisWeek = (completedSessions ?? []).length;

    return json({
      plan: {
        id: data.id,
        name: data.name,
        goal: data.goal || 'Geral',
        daysPerWeek: data.days_per_week || days.length,
        startDate: data.start_date,
        endDate: data.end_date,
        isExpired: isPlanExpired(data.end_date),
        updatedAt: data.created_at,
        week: {
          currentDate: dayRange.date,
          startDate: weekRange.startDate,
          endDate: weekRange.endDate,
          target: weeklyTarget,
          completed: completedThisWeek,
          isComplete: completedThisWeek >= weeklyTarget,
          nextWorkoutDayId: nextWorkoutDayId(
            days.map((day) => day.id),
            weeklyTarget,
            completedByDay,
          ),
        },
        days,
      },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }

    console.error('[Get Workout Plans] Error:', error);
    return json({ error: 'Não foi possível carregar a ficha.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return json({ error: 'Não autorizado.' }, 401);
    }

    const parsed = workoutPlanCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({
        error: 'Revise os dados da ficha.',
        details: parsed.error.flatten(),
      }, 400);
    }

    const plan = await publishWorkoutPlanRevision({
      trainerId: session.trainer_id,
      input: parsed.data,
    });
    return json({ success: true, plan }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    if (error instanceof WorkoutPlanPublishError) {
      return json({ error: error.message }, error.status);
    }

    console.error('[Create Workout Plan] Error:', error);
    return json({ error: 'Não foi possível salvar a ficha.' }, 500);
  }
}
