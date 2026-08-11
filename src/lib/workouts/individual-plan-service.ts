import 'server-only';
import { getCatalogExercises, MUSCLE_REGIONS } from '@/lib/exercises/catalog';
import { createAdminClient } from '@/lib/supabase/admin';
import type { IndividualWorkoutPlanInput } from '@/lib/validators';
import { brazilToday, isPlanExpired } from './plan-validity';

export class IndividualPlanError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'IndividualPlanError';
  }
}

interface RawExercise {
  id: string;
  exercise_key: string;
  name: string;
  primary_muscle: string;
  equipment: string;
  instructions: string;
  video_url: string | null;
  sets: number;
  reps: string;
  rest_time: number;
  method: string | null;
  order_index: number;
}

interface RawDay {
  id: string;
  name: string;
  day_label: string;
  order_index: number;
  individual_workout_exercises: RawExercise[] | null;
}

interface RawPlan {
  id: string;
  user_id: string;
  name: string;
  goal: string | null;
  days_per_week: number;
  status: 'active' | 'draft' | 'archived';
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  individual_workout_days: RawDay[] | null;
}

const PLAN_SELECT = `
  id, user_id, name, goal, days_per_week, status, start_date, end_date, created_at, updated_at,
  individual_workout_days (
    id, name, day_label, order_index,
    individual_workout_exercises (
      id, exercise_key, name, primary_muscle, equipment, instructions, video_url,
      sets, reps, rest_time, method, order_index
    )
  )
`;

export type IndividualPlan = ReturnType<typeof normalizePlan>;

function normalizePlan(plan: RawPlan) {
  const days = (plan.individual_workout_days ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((day) => ({
      id: day.id,
      label: day.day_label,
      name: day.name,
      exercises: (day.individual_workout_exercises ?? [])
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((exercise) => ({
          id: exercise.id,
          exerciseKey: exercise.exercise_key,
          name: exercise.name,
          primaryMuscle: exercise.primary_muscle,
          primaryMuscleLabel: MUSCLE_REGIONS[exercise.primary_muscle as keyof typeof MUSCLE_REGIONS] || exercise.primary_muscle,
          equipment: exercise.equipment,
          instructions: exercise.instructions,
          videoUrl: exercise.video_url,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.rest_time,
          method: exercise.method || '',
        })),
    }));

  return {
    id: plan.id,
    name: plan.name,
    goal: plan.goal || 'Condicionamento geral',
    daysPerWeek: plan.days_per_week,
    status: plan.status,
    startDate: plan.start_date,
    endDate: plan.end_date,
    isExpired: isPlanExpired(plan.end_date),
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    workoutDayCount: days.length,
    exerciseCount: days.reduce((total, day) => total + day.exercises.length, 0),
    days,
  };
}

export async function listIndividualPlans(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('individual_workout_plans')
    .select(PLAN_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawPlan[]).map(normalizePlan);
}

export async function getIndividualPlan(userId: string, planId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('individual_workout_plans')
    .select(PLAN_SELECT)
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizePlan(data as unknown as RawPlan) : null;
}

export async function publishIndividualPlan(args: {
  userId: string;
  input: IndividualWorkoutPlanInput;
}) {
  const { userId, input } = args;
  const admin = createAdminClient();
  const today = brazilToday();
  let createdPlanId = '';
  let previousActiveIds: string[] = [];

  if (input.endDate < today) {
    throw new IndividualPlanError('O prazo da ficha não pode estar no passado.', 400);
  }

  const requestedKeys = [...new Set(input.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseKey)))];
  const catalog = getCatalogExercises(requestedKeys);
  if (catalog.length !== requestedKeys.length) {
    throw new IndividualPlanError('A ficha contém um exercício inválido.', 400);
  }
  const catalogByKey = new Map(catalog.map((exercise) => [exercise.key, exercise]));

  try {
    const { data: plan, error: planError } = await admin
      .from('individual_workout_plans')
      .insert({
        user_id: userId,
        name: input.name,
        goal: input.goal || 'Condicionamento geral',
        days_per_week: input.daysPerWeek,
        status: 'draft',
        start_date: today,
        end_date: input.endDate,
      })
      .select('id, name')
      .single();
    if (planError || !plan) throw planError || new Error('Ficha não criada.');
    createdPlanId = plan.id;

    const { data: insertedDays, error: dayError } = await admin
      .from('individual_workout_days')
      .insert(input.days.map((day, index) => ({
        plan_id: plan.id,
        name: day.name,
        day_label: day.label,
        order_index: index,
      })))
      .select('id, order_index');
    if (dayError) throw dayError;

    const dayIdByIndex = new Map((insertedDays ?? []).map((day) => [day.order_index, day.id]));
    const exercises = input.days.flatMap((day, dayIndex) => day.exercises.map((saved, exerciseIndex) => {
      const catalogExercise = catalogByKey.get(saved.exerciseKey);
      return {
        workout_day_id: dayIdByIndex.get(dayIndex),
        exercise_key: saved.exerciseKey,
        name: catalogExercise?.name,
        primary_muscle: catalogExercise?.primaryMuscle,
        equipment: catalogExercise?.equipment,
        instructions: catalogExercise?.instructions,
        video_url: catalogExercise?.videoUrl,
        sets: saved.sets,
        reps: saved.reps,
        rest_time: saved.restTime,
        method: saved.method || null,
        order_index: exerciseIndex,
      };
    }));
    if (exercises.some((exercise) => !exercise.workout_day_id || !exercise.name || !exercise.primary_muscle)) {
      throw new Error('Não foi possível relacionar os exercícios da ficha.');
    }
    const { error: exerciseError } = await admin.from('individual_workout_exercises').insert(exercises);
    if (exerciseError) throw exerciseError;

    const { data: previousActive, error: activeQueryError } = await admin
      .from('individual_workout_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');
    if (activeQueryError) throw activeQueryError;
    previousActiveIds = (previousActive ?? []).map((item) => item.id).filter((id) => id !== plan.id);
    if (previousActiveIds.length) {
      const { error: archiveError } = await admin
        .from('individual_workout_plans')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .in('id', previousActiveIds)
        .eq('user_id', userId);
      if (archiveError) throw archiveError;
    }

    const { error: activateError } = await admin
      .from('individual_workout_plans')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', plan.id)
      .eq('user_id', userId);
    if (activateError) throw activateError;

    return { id: plan.id, name: plan.name, startDate: today, endDate: input.endDate };
  } catch (error) {
    if (createdPlanId) await admin.from('individual_workout_plans').delete().eq('id', createdPlanId).eq('user_id', userId);
    if (previousActiveIds.length) {
      await admin.from('individual_workout_plans').update({ status: 'active' }).eq('id', previousActiveIds[0]).eq('user_id', userId);
    }
    throw error;
  }
}

export async function activateIndividualPlan(userId: string, planId: string) {
  const admin = createAdminClient();
  const plan = await getIndividualPlan(userId, planId);
  if (!plan) throw new IndividualPlanError('Ficha não encontrada.', 404);
  if (plan.isExpired) throw new IndividualPlanError('Uma ficha vencida não pode ser ativada. Edite o prazo primeiro.', 400);

  const { error: archiveError } = await admin
    .from('individual_workout_plans')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('id', planId);
  if (archiveError) throw archiveError;
  const { error } = await admin
    .from('individual_workout_plans')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteIndividualPlan(userId: string, planId: string) {
  const admin = createAdminClient();
  const plan = await getIndividualPlan(userId, planId);
  if (!plan) throw new IndividualPlanError('Ficha não encontrada.', 404);
  const { error } = await admin.from('individual_workout_plans').delete().eq('id', planId).eq('user_id', userId);
  if (error) throw error;

  if (plan.status === 'active') {
    const { data: replacement } = await admin
      .from('individual_workout_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'archived')
      .or(`end_date.is.null,end_date.gte.${brazilToday()}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (replacement) await activateIndividualPlan(userId, replacement.id);
  }
}
