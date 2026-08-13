import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { workoutPlanCopySchema } from '@/lib/validators';
import { getManagedWorkoutPlan } from '@/lib/workouts/managed-plan-service';
import {
  publishWorkoutPlanRevision,
  WorkoutPlanPublishError,
} from '@/lib/workouts/plan-service';
import {
  addPlanValidity,
  brazilToday,
  inferPlanValidity,
} from '@/lib/workouts/plan-validity';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);

    const planId = z.string().uuid().safeParse((await context.params).id);
    if (!planId.success) return json({ error: 'Ficha inválida.' }, 400);

    const parsed = workoutPlanCopySchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ error: 'Selecione um aluno válido.', details: parsed.error.flatten() }, 400);
    }

    const source = await getManagedWorkoutPlan({
      planId: planId.data,
      trainerId: session.trainer_id,
    });
    if (!source) return json({ error: 'Ficha não encontrada.' }, 404);
    if (source.studentId === parsed.data.studentId) {
      return json({ error: 'Escolha outro aluno para receber esta ficha.' }, 400);
    }

    const today = brazilToday();
    const validity = inferPlanValidity(source.startDate || today, source.endDate);
    const copiedPlan = await publishWorkoutPlanRevision({
      trainerId: session.trainer_id,
      input: {
        studentId: parsed.data.studentId,
        name: source.name,
        goal: source.goal,
        daysPerWeek: source.daysPerWeek,
        endDate: addPlanValidity(today, validity.amount, validity.unit),
        days: source.days.map((day) => ({
          label: day.label,
          name: day.name,
          exercises: day.exercises.map((exercise) => ({
            exerciseKey: exercise.exerciseKey,
            sets: exercise.sets,
            reps: exercise.reps,
            restTime: exercise.restTime,
            method: exercise.method,
          })),
        })),
      },
    });

    return json({
      success: true,
      plan: copiedPlan,
      message: 'Ficha enviada e publicada para o aluno.',
    }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    if (error instanceof WorkoutPlanPublishError) {
      return json({ error: error.message }, error.status);
    }
    console.error('[Copy Workout Plan] Error:', error);
    return json({ error: 'Não foi possível enviar a ficha para o aluno.' }, 500);
  }
}
