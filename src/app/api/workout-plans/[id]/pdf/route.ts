import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { canAccessStudentFeatures } from '@/lib/auth/session-types';
import { isDemoUser } from '@/lib/auth/demo';
import { createWorkoutPlanPdf, workoutPlanPdfFilename } from '@/lib/pdf/workout-plan';
import { SupabaseConfigurationError } from '@/lib/supabase/config';
import { getManagedWorkoutPlan } from '@/lib/workouts/managed-plan-service';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'trainer' && session.role !== 'student')) {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    if (isDemoUser(session.sub)) {
      return Response.json({ error: 'Download restrito na conta de demonstração.' }, { status: 403 });
    }
    if (!canAccessStudentFeatures(session)) {
      return Response.json({ error: 'Conclua o primeiro acesso para continuar.' }, { status: 403 });
    }

    const parsed = z.string().uuid().safeParse((await params).id);
    if (!parsed.success) return Response.json({ error: 'Ficha inválida.' }, { status: 400 });

    const plan = await getManagedWorkoutPlan({
      planId: parsed.data,
      trainerId: session.trainer_id,
      studentId: session.role === 'student' ? session.sub : undefined,
      activeOnly: session.role === 'student',
    });
    if (!plan) return Response.json({ error: 'Ficha não encontrada.' }, { status: 404 });

    const bytes = await createWorkoutPlanPdf({
      plan,
      userName: plan.studentName,
      professionalName: plan.trainerName,
      baseUrl: new URL(request.url).origin,
      planPath: '/workout',
    });

    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${workoutPlanPdfFilename(`${plan.studentName}-${plan.name}`)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return Response.json({ error: 'O banco de dados ainda não está configurado.' }, { status: 503 });
    }
    console.error('[Managed Plan PDF] Error:', error);
    return Response.json({ error: 'Não foi possível gerar o PDF da ficha.' }, { status: 500 });
  }
}
