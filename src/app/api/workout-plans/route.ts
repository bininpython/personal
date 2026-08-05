import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { workoutPlanCreateSchema } from '@/lib/validators';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { isPlanExpired } from '@/lib/workouts/plan-validity';
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

    const admin = createAdminClient();

    if (session.role === 'trainer') {
      const { data, error } = await admin
        .from('workout_plans')
        .select(`
          id, name, goal, days_per_week, status, start_date, end_date, created_at,
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

    const days = ((data.workout_days ?? []) as RelatedWorkoutDay[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((day) => ({
        id: day.id,
        label: day.day_label || '',
        name: day.name,
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
            };
          }),
      }));

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
