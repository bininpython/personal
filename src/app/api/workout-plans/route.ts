import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCatalogExercises } from '@/lib/exercises/catalog';
import { workoutPlanCreateSchema } from '@/lib/validators';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

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
          id, name, goal, days_per_week, status, start_date, created_at,
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
          createdAt: plan.created_at,
        };
      });

      return json({ plans });
    }

    const { data, error } = await admin
      .from('workout_plans')
      .select(`
        id, name, goal, days_per_week, status, start_date, created_at,
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
  let createdPlanId = '';

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

    const input = parsed.data;
    const admin = createAdminClient();
    const { data: student, error: studentError } = await admin
      .from('students')
      .select('id, status')
      .eq('id', input.studentId)
      .eq('trainer_id', session.trainer_id)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student || student.status !== 'active') {
      return json({ error: 'Aluno ativo não encontrado.' }, 404);
    }

    const requestedKeys = [...new Set(
      input.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseKey)),
    )];
    const catalogExercises = getCatalogExercises(requestedKeys);
    if (catalogExercises.length !== requestedKeys.length) {
      return json({ error: 'A ficha contém um exercício inválido.' }, 400);
    }

    const { data: existingExercises, error: existingError } = await admin
      .from('exercises')
      .select('id, target_muscle')
      .in('target_muscle', requestedKeys);

    if (existingError) throw existingError;

    const exerciseIdByKey = new Map(
      (existingExercises ?? []).map((exercise) => [exercise.target_muscle, exercise.id]),
    );
    const missingExercises = catalogExercises.filter(
      (exercise) => !exerciseIdByKey.has(exercise.key),
    );

    if (missingExercises.length > 0) {
      const { data: insertedExercises, error: insertExerciseError } = await admin
        .from('exercises')
        .insert(missingExercises.map((exercise) => ({
          name: exercise.name,
          target_muscle: exercise.key,
          video_url: exercise.videoUrl,
          instructions: exercise.instructions,
        })))
        .select('id, target_muscle');

      if (insertExerciseError) throw insertExerciseError;
      for (const exercise of insertedExercises ?? []) {
        exerciseIdByKey.set(exercise.target_muscle, exercise.id);
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: plan, error: planError } = await admin
      .from('workout_plans')
      .insert({
        student_id: input.studentId,
        trainer_id: session.trainer_id,
        name: input.name,
        goal: input.goal || 'Geral',
        days_per_week: input.daysPerWeek,
        status: 'draft',
        start_date: today,
      })
      .select('id, name')
      .single();

    if (planError) throw planError;
    createdPlanId = plan.id;

    const { data: insertedDays, error: dayError } = await admin
      .from('workout_days')
      .insert(input.days.map((day, index) => ({
        plan_id: plan.id,
        name: day.name,
        day_label: day.label,
        order_index: index,
      })))
      .select('id, order_index');

    if (dayError) throw dayError;
    const dayIdByIndex = new Map(
      (insertedDays ?? []).map((day) => [day.order_index, day.id]),
    );

    const workoutExercises = input.days.flatMap((day, dayIndex) => (
      day.exercises.map((exercise, exerciseIndex) => ({
        workout_day_id: dayIdByIndex.get(dayIndex),
        exercise_id: exerciseIdByKey.get(exercise.exerciseKey),
        sets: exercise.sets,
        reps: exercise.reps,
        rest_time: exercise.restTime,
        method: exercise.method || null,
        order_index: exerciseIndex,
      }))
    ));

    if (workoutExercises.some((exercise) => !exercise.workout_day_id || !exercise.exercise_id)) {
      throw new Error('Could not resolve workout relationships.');
    }

    const { error: workoutExerciseError } = await admin
      .from('workout_exercises')
      .insert(workoutExercises);
    if (workoutExerciseError) throw workoutExerciseError;

    const { error: activateError } = await admin
      .from('workout_plans')
      .update({ status: 'active' })
      .eq('id', plan.id);
    if (activateError) throw activateError;

    const { error: archiveError } = await admin
      .from('workout_plans')
      .update({ status: 'archived' })
      .eq('student_id', input.studentId)
      .eq('trainer_id', session.trainer_id)
      .eq('status', 'active')
      .neq('id', plan.id);
    if (archiveError) throw archiveError;

    return json({ success: true, plan: { id: plan.id, name: plan.name } }, 201);
  } catch (error) {
    if (createdPlanId) {
      try {
        const admin = createAdminClient();
        await admin.from('workout_plans').delete().eq('id', createdPlanId);
      } catch (cleanupError) {
        console.error('[Create Workout Plan] Cleanup error:', cleanupError);
      }
    }

    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }

    console.error('[Create Workout Plan] Error:', error);
    return json({ error: 'Não foi possível salvar a ficha.' }, 500);
  }
}
