import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { addPlanValidity, brazilToday, inferPlanValidity } from '@/lib/workouts/plan-validity';
import {
  publishWorkoutPlanRevision,
  WorkoutPlanPublishError,
} from '@/lib/workouts/plan-service';

type Related<T> = T | T[] | null;

interface RelatedExercise {
  target_muscle: string | null;
}

interface RelatedWorkoutExercise {
  sets: number;
  reps: string;
  rest_time: number;
  method: string | null;
  order_index: number;
  exercises: Related<RelatedExercise>;
}

interface RelatedWorkoutDay {
  name: string;
  day_label: string | null;
  order_index: number;
  workout_exercises: RelatedWorkoutExercise[] | null;
}

const duplicateSchema = z.object({
  targetStudentIds: z.array(z.string().uuid('Aluno inválido')).min(1, 'Selecione ao menos um aluno').max(30),
}).strict();

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function one<T>(related: Related<T>): T | null {
  return Array.isArray(related) ? (related[0] ?? null) : related;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);

    const parsed = duplicateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ error: 'Selecione ao menos um aluno de destino.', details: parsed.error.flatten() }, 400);
    }
    const targetStudentIds = [...new Set(parsed.data.targetStudentIds)];

    const { id } = await context.params;
    const admin = createAdminClient();
    const { data: sourcePlan, error } = await admin
      .from('workout_plans')
      .select(`
        name, goal, days_per_week, start_date, end_date,
        workout_days (
          name, day_label, order_index,
          workout_exercises (
            sets, reps, rest_time, method, order_index,
            exercises (target_muscle)
          )
        )
      `)
      .eq('id', id)
      .eq('trainer_id', session.trainer_id)
      .maybeSingle();
    if (error) throw error;
    if (!sourcePlan) return json({ error: 'Ficha não encontrada.' }, 404);

    const today = brazilToday();
    const validity = inferPlanValidity(sourcePlan.start_date || today, sourcePlan.end_date);
    const endDate = addPlanValidity(today, validity.amount, validity.unit);

    const days = ((sourcePlan.workout_days ?? []) as RelatedWorkoutDay[])
      .sort((left, right) => left.order_index - right.order_index)
      .map((day) => ({
        label: day.day_label || '',
        name: day.name,
        exercises: (day.workout_exercises ?? [])
          .sort((left, right) => left.order_index - right.order_index)
          .map((item) => ({
            exerciseKey: one(item.exercises)?.target_muscle || '',
            sets: item.sets,
            reps: item.reps,
            restTime: item.rest_time,
            method: item.method || undefined,
          })),
      }));

    if (days.length === 0 || days.some((day) => day.exercises.length === 0)) {
      return json({ error: 'Esta ficha está incompleta e não pode ser reaproveitada.' }, 400);
    }

    const { data: targetStudents, error: targetsError } = await admin
      .from('students')
      .select('id, name')
      .in('id', targetStudentIds)
      .eq('trainer_id', session.trainer_id)
      .is('deleted_at', null);
    if (targetsError) throw targetsError;
    const nameById = new Map((targetStudents ?? []).map((student) => [student.id, student.name]));

    const assigned: Array<{ studentId: string; studentName: string; planId: string }> = [];
    const failed: Array<{ studentId: string; studentName: string; error: string }> = [];

    // Cada aluno é publicado isoladamente: um destino inválido não pode
    // impedir que os demais recebam a ficha.
    for (const studentId of targetStudentIds) {
      const studentName = nameById.get(studentId) || 'Aluno';
      try {
        const plan = await publishWorkoutPlanRevision({
          trainerId: session.trainer_id,
          input: {
            studentId,
            name: sourcePlan.name,
            goal: sourcePlan.goal || undefined,
            daysPerWeek: sourcePlan.days_per_week || days.length,
            endDate,
            days,
          },
        });
        assigned.push({ studentId, studentName, planId: plan.id });
      } catch (publishError) {
        if (publishError instanceof WorkoutPlanPublishError) {
          failed.push({ studentId, studentName, error: publishError.message });
          continue;
        }
        throw publishError;
      }
    }

    if (assigned.length === 0) {
      return json({
        error: failed[0]?.error || 'Não foi possível duplicar a ficha.',
        assigned,
        failed,
      }, 400);
    }

    return json({
      success: true,
      assigned,
      failed,
      endDate,
      message: assigned.length === 1
        ? `Ficha atribuída a ${assigned[0].studentName}.`
        : `Ficha atribuída a ${assigned.length} alunos.`,
    }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    if (error instanceof WorkoutPlanPublishError) {
      return json({ error: error.message }, error.status);
    }
    console.error('[Duplicate Workout Plan] Error:', error);
    return json({ error: 'Não foi possível duplicar a ficha.' }, 500);
  }
}
