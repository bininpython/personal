import 'server-only';
import { getCatalogExercises, MUSCLE_REGIONS } from '@/lib/exercises/catalog';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlanExpired } from './plan-validity';

type Related<T> = T | T[] | null;

interface RelatedPerson {
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

function one<T>(related: Related<T>): T | null {
  return Array.isArray(related) ? (related[0] ?? null) : related;
}

export async function getManagedWorkoutPlan(args: {
  planId: string;
  trainerId: string;
  studentId?: string;
  activeOnly?: boolean;
}) {
  const admin = createAdminClient();
  let query = admin
    .from('workout_plans')
    .select(`
      id, student_id, name, goal, days_per_week, status, start_date, end_date, created_at,
      students (name),
      trainers (name),
      workout_days (
        id, name, day_label, order_index,
        workout_exercises (
          id, sets, reps, rest_time, method, order_index,
          exercises (id, name, target_muscle, video_url, instructions)
        )
      )
    `)
    .eq('id', args.planId)
    .eq('trainer_id', args.trainerId);

  if (args.studentId) query = query.eq('student_id', args.studentId);
  if (args.activeOnly) query = query.eq('status', 'active');

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const rawDays = (data.workout_days ?? []) as RelatedWorkoutDay[];
  const exerciseKeys = [...new Set(rawDays.flatMap((day) => (
    (day.workout_exercises ?? []).flatMap((item) => {
      const exercise = one(item.exercises);
      return exercise?.target_muscle ? [exercise.target_muscle] : [];
    })
  )))];
  const catalogByKey = new Map(getCatalogExercises(exerciseKeys).map((exercise) => [exercise.key, exercise]));

  const days = rawDays
    .slice()
    .sort((left, right) => left.order_index - right.order_index)
    .map((day) => ({
      id: day.id,
      label: day.day_label || '',
      name: day.name,
      exercises: (day.workout_exercises ?? [])
        .slice()
        .sort((left, right) => left.order_index - right.order_index)
        .map((item) => {
          const exercise = one(item.exercises);
          const exerciseKey = exercise?.target_muscle || '';
          const catalog = catalogByKey.get(exerciseKey);
          const primaryMuscle = catalog?.primaryMuscle || exerciseKey.split(':')[0] || 'Geral';
          return {
            id: item.id,
            exerciseKey,
            name: exercise?.name || catalog?.name || 'Exercício',
            primaryMuscle,
            primaryMuscleLabel: catalog
              ? MUSCLE_REGIONS[catalog.primaryMuscle]
              : MUSCLE_REGIONS[primaryMuscle as keyof typeof MUSCLE_REGIONS] || primaryMuscle,
            equipment: catalog?.equipment || 'Conforme orientação profissional',
            instructions: exercise?.instructions || catalog?.instructions || '',
            videoUrl: exercise?.video_url || catalog?.videoUrl || null,
            sets: item.sets,
            reps: item.reps,
            restTime: item.rest_time,
            method: item.method || '',
          };
        }),
    }));

  const student = one(data.students as Related<RelatedPerson>);
  const trainer = one(data.trainers as Related<RelatedPerson>);

  return {
    id: data.id,
    studentId: data.student_id,
    studentName: student?.name || 'Aluno',
    trainerName: trainer?.name || 'Personal responsável',
    name: data.name,
    goal: data.goal || 'Condicionamento geral',
    daysPerWeek: data.days_per_week || days.length,
    status: data.status as 'active' | 'draft' | 'archived',
    startDate: data.start_date,
    endDate: data.end_date,
    isExpired: data.status === 'active' && isPlanExpired(data.end_date),
    createdAt: data.created_at,
    workoutDayCount: days.length,
    exerciseCount: days.reduce((total, day) => total + day.exercises.length, 0),
    days,
  };
}

export type ManagedWorkoutPlan = NonNullable<Awaited<ReturnType<typeof getManagedWorkoutPlan>>>;
