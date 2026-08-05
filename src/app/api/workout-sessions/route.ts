import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

type Related<T> = T | T[] | null;

interface RelatedDay {
  name: string;
  day_label: string | null;
}

interface RelatedPlan {
  id: string;
  name: string;
  student_id: string;
  trainer_id: string;
  status: string;
}

const completeWorkoutSchema = z.object({
  workoutDayId: z.string().uuid(),
  completionPercentage: z.number().min(0).max(100).default(100),
  durationSeconds: z.number().int().min(0).max(21_600).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().trim().max(1000).optional(),
}).strict();

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function one<T>(relation: Related<T>): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') return json({ error: 'Não autorizado.' }, 401);

    const admin = createAdminClient();
    const [{ data: sessions, error: sessionError }, { data: assessments, error: assessmentError }] = await Promise.all([
      admin
        .from('workout_sessions')
        .select(`
          id, started_at, completed_at, duration_seconds, completion_percentage,
          total_volume, status, rating, feedback, workout_days (name, day_label), workout_plans (name)
        `)
        .eq('student_id', session.sub)
        .order('started_at', { ascending: false }),
      admin
        .from('physical_assessments')
        .select('id, assessment_date, weight, body_fat_percentage')
        .eq('student_id', session.sub)
        .order('assessment_date', { ascending: true }),
    ]);

    if (sessionError) throw sessionError;
    if (assessmentError) throw assessmentError;

    const history = (sessions ?? []).map((item) => {
      const day = one(item.workout_days as Related<RelatedDay>);
      const plan = one(item.workout_plans as Related<{ name: string }>);
      return {
        id: item.id,
        date: item.completed_at || item.started_at,
        name: day?.name || plan?.name || 'Treino',
        dayLabel: day?.day_label || '',
        durationSeconds: item.duration_seconds,
        completion: Number(item.completion_percentage ?? 0),
        volume: Number(item.total_volume ?? 0),
        status: item.status,
        rating: item.rating,
        feedback: item.feedback,
      };
    });

    const now = new Date();
    const frequency = Array.from({ length: 4 }).map((_, index) => {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      end.setDate(end.getDate() - index * 7);
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
      const count = history.filter((workout) => {
        const date = new Date(workout.date);
        return workout.status === 'completed' && date >= start && date <= end;
      }).length;
      return { label: index === 0 ? 'Atual' : `-${index} sem`, workouts: count, order: 3 - index };
    }).sort((a, b) => a.order - b.order).map(({ label, workouts }) => ({ label, workouts }));

    return json({
      history,
      progress: {
        completedWorkouts: history.filter((item) => item.status === 'completed').length,
        frequency,
        weight: (assessments ?? []).filter((item) => item.weight != null).map((item) => ({
          date: new Date(`${item.assessment_date}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }),
          weight: Number(item.weight),
        })),
        bodyFat: (assessments ?? []).filter((item) => item.body_fat_percentage != null).map((item) => ({
          date: new Date(`${item.assessment_date}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }),
          value: Number(item.body_fat_percentage),
        })),
      },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    console.error('[Workout Sessions] Get error:', error);
    return json({ error: 'Não foi possível carregar o histórico.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'student') return json({ error: 'Não autorizado.' }, 401);

    const parsed = completeWorkoutSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Treino inválido.' }, 400);

    const admin = createAdminClient();
    const { data: day, error: dayError } = await admin
      .from('workout_days')
      .select('id, plan_id, workout_plans!inner (id, name, student_id, trainer_id, status)')
      .eq('id', parsed.data.workoutDayId)
      .maybeSingle();

    if (dayError) throw dayError;
    const plan = day ? one(day.workout_plans as Related<RelatedPlan>) : null;
    if (!day || !plan || plan.student_id !== session.sub || plan.trainer_id !== session.trainer_id || plan.status !== 'active') {
      return json({ error: 'Este treino não pertence à sua ficha ativa.' }, 403);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: existing, error: existingError } = await admin
      .from('workout_sessions')
      .select('id')
      .eq('student_id', session.sub)
      .eq('workout_day_id', day.id)
      .eq('status', 'completed')
      .gte('completed_at', startOfDay.toISOString())
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return json({ success: true, session: existing, alreadyCompleted: true });

    const now = new Date().toISOString();
    const { data: workoutSession, error } = await admin
      .from('workout_sessions')
      .insert({
        student_id: session.sub,
        workout_day_id: day.id,
        workout_plan_id: plan.id,
        started_at: now,
        completed_at: now,
        completion_percentage: parsed.data.completionPercentage,
        total_volume: 0,
        status: 'completed',
        duration_seconds: parsed.data.durationSeconds ?? null,
        rating: parsed.data.rating ?? null,
        feedback: parsed.data.feedback || null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return json({ success: true, session: workoutSession }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return json({ error: 'O banco de dados ainda não está configurado.' }, 503);
    }
    console.error('[Workout Sessions] Post error:', error);
    return json({ error: 'Não foi possível concluir o treino.' }, 500);
  }
}
