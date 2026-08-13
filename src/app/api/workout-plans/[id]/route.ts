import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { workoutPlanUpdateSchema } from '@/lib/validators';
import { getManagedWorkoutPlan } from '@/lib/workouts/managed-plan-service';
import {
  publishWorkoutPlanRevision,
  WorkoutPlanPublishError,
} from '@/lib/workouts/plan-service';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);
    const { id } = await context.params;
    const data = await getManagedWorkoutPlan({ planId: id, trainerId: session.trainer_id });
    if (!data) return json({ error: 'Ficha não encontrada.' }, 404);

    return json({
      plan: {
        id: data.id,
        studentId: data.studentId,
        studentName: data.studentName,
        name: data.name,
        goal: data.goal || '',
        daysPerWeek: data.daysPerWeek,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: data.createdAt,
        days: data.days,
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
    const sourcePlan = await getManagedWorkoutPlan({ planId: id, trainerId: session.trainer_id });
    if (!sourcePlan) return json({ error: 'Ficha não encontrada.' }, 404);

    const plan = await publishWorkoutPlanRevision({
      trainerId: session.trainer_id,
      input: {
        studentId: sourcePlan.studentId,
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
