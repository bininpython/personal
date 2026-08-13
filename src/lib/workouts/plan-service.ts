import 'server-only';
import { getCatalogExercises } from '@/lib/exercises/catalog';
import { createAdminClient } from '@/lib/supabase/admin';
import type { WorkoutPlanCreateInput } from '@/lib/validators';
import { brazilToday } from './plan-validity';
import { normalizeTrainingMethod } from './training-methods';

export class WorkoutPlanPublishError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'WorkoutPlanPublishError';
  }
}

export async function publishWorkoutPlanRevision(args: {
  trainerId: string;
  input: WorkoutPlanCreateInput;
}) {
  const { trainerId, input } = args;
  const admin = createAdminClient();
  const today = brazilToday();
  let createdPlanId = '';

  if (input.endDate < today) {
    throw new WorkoutPlanPublishError('O prazo da ficha não pode estar no passado.', 400);
  }

  const { data: student, error: studentError } = await admin
    .from('students')
    .select('id, status')
    .eq('id', input.studentId)
    .eq('trainer_id', trainerId)
    .maybeSingle();
  if (studentError) throw studentError;
  if (!student || student.status !== 'active') {
    throw new WorkoutPlanPublishError('Aluno ativo não encontrado.', 404);
  }

  const requestedKeys = [...new Set(
    input.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseKey)),
  )];
  const catalogExercises = getCatalogExercises(requestedKeys);
  if (catalogExercises.length !== requestedKeys.length) {
    throw new WorkoutPlanPublishError('A ficha contém um exercício inválido.', 400);
  }

  const { data: existingExercises, error: existingError } = await admin
    .from('exercises')
    .select('id, target_muscle')
    .in('target_muscle', requestedKeys);
  if (existingError) throw existingError;

  const exerciseIdByKey = new Map<string, string>();
  for (const exercise of existingExercises ?? []) {
    if (exercise.target_muscle) exerciseIdByKey.set(exercise.target_muscle, exercise.id);
  }

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
      if (exercise.target_muscle) exerciseIdByKey.set(exercise.target_muscle, exercise.id);
    }
  }

  try {
    const { data: plan, error: planError } = await admin
      .from('workout_plans')
      .insert({
        student_id: input.studentId,
        trainer_id: trainerId,
        name: input.name,
        goal: input.goal || 'Geral',
        days_per_week: input.daysPerWeek,
        status: 'draft',
        start_date: today,
        end_date: input.endDate,
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
      day.exercises.map((exercise, exerciseIndex) => {
        const trainingMethod = normalizeTrainingMethod(exercise.method, exercise.methodNotes);
        return {
          workout_day_id: dayIdByIndex.get(dayIndex),
          exercise_id: exerciseIdByKey.get(exercise.exerciseKey),
          sets: exercise.sets,
          reps: exercise.reps,
          rest_time: exercise.restTime,
          method: trainingMethod.method,
          method_notes: trainingMethod.methodNotes || null,
          order_index: exerciseIndex,
        };
      })
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
      .eq('id', plan.id)
      .eq('trainer_id', trainerId);
    if (activateError) throw activateError;

    const { error: archiveError } = await admin
      .from('workout_plans')
      .update({ status: 'archived' })
      .eq('student_id', input.studentId)
      .eq('trainer_id', trainerId)
      .eq('status', 'active')
      .neq('id', plan.id);
    if (archiveError) throw archiveError;

    return {
      id: plan.id,
      name: plan.name,
      startDate: today,
      endDate: input.endDate,
    };
  } catch (error) {
    if (createdPlanId) {
      try {
        await admin.from('workout_plans').delete().eq('id', createdPlanId);
      } catch (cleanupError) {
        console.error('[Publish Workout Plan] Cleanup error:', cleanupError);
      }
    }
    throw error;
  }
}
