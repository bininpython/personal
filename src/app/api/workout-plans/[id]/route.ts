import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { workoutPlanUpdateSchema } from '@/lib/validators';
import {
  publishWorkoutPlanRevision,
  WorkoutPlanPublishError,
} from '@/lib/workouts/plan-service';

type Related<T> = T | T[] | null;

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

async function findOwnedPlan(id: string, trainerId: string) {
  const admin = createAdminClient();
  return admin
    .from('workout_plans')
    .select(`
      id, student_id, name, goal, days_per_week, status, start_date, end_date, created_at,
      students (name),
      workout_days (
        id, name, day_label, order_index,
        workout_exercises (
          id, sets, reps, rest_time, method, order_index,
          exercises (id, name, target_muscle, video_url, instructions)
        )
      )
    `)
    .eq('id', id)
    .eq('trainer_id', trainerId)
    .maybeSingle();
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);
    const { id } = await context.params;
    const { data, error } = await findOwnedPlan(id, session.trainer_id);
    if (error) throw error;
    if (!data) return json({ error: 'Ficha não encontrada.' }, 404);

    const student = one(data.students as Related<{ name: string }>);
    const days = ((data.workout_days ?? []) as RelatedWorkoutDay[])
      .sort((left, right) => left.order_index - right.order_index)
      .map((day) => ({
        id: day.id,
        label: day.day_label || '',
        name: day.name,
        exercises: (day.workout_exercises ?? [])
          .sort((left, right) => left.order_index - right.order_index)
          .map((item) => {
            const exercise = one(item.exercises);
            return {
              id: item.id,
              exerciseKey: exercise?.target_muscle || '',
              name: exercise?.name || 'Exercício',
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
        studentId: data.student_id,
        studentName: student?.name || 'Aluno',
        name: data.name,
        goal: data.goal || '',
        daysPerWeek: data.days_per_week || days.length,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        createdAt: data.created_at,
        days,
      },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    console.error('[Get Workout Plan] Error:', error);
    return json({ error: 'Não foi possível carregar a ficha.' }, 500);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);
    const parsed = workoutPlanUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ error: 'Revise os dados da ficha.', details: parsed.error.flatten() }, 400);
    }

    const { id } = await context.params;
    const { data: sourcePlan, error } = await findOwnedPlan(id, session.trainer_id);
    if (error) throw error;
    if (!sourcePlan) return json({ error: 'Ficha não encontrada.' }, 404);

    const plan = await publishWorkoutPlanRevision({
      trainerId: session.trainer_id,
      input: {
        studentId: sourcePlan.student_id,
        ...parsed.data,
      },
    });

    return json({
      success: true,
      plan,
      message: 'Nova versão da ficha publicada.',
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    if (error instanceof WorkoutPlanPublishError) {
      return json({ error: error.message }, error.status);
    }
    console.error('[Update Workout Plan] Error:', error);
    return json({ error: 'Não foi possível atualizar a ficha.' }, 500);
  }
}
