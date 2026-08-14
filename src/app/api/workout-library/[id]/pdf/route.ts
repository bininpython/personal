import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { isDemoUser } from '@/lib/auth/demo';
import { createWorkoutPlanPdf, workoutPlanPdfFilename } from '@/lib/pdf/workout-plan';
import { getWorkoutLibraryTemplate, workoutLibraryToPrintablePlan } from '@/lib/workout-library';

const templateIdSchema = z.string().regex(/^[a-z0-9-]{3,100}$/);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !['trainer', 'individual'].includes(session.role)) {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const parsed = templateIdSchema.safeParse((await params).id);
    if (!parsed.success) return Response.json({ error: 'Modelo inválido.' }, { status: 400 });
    
    if (isDemoUser(session.sub)) {
      return Response.json({ error: 'Download restrito na conta de demonstração.' }, { status: 403 });
    }
    const template = getWorkoutLibraryTemplate(parsed.data);
    if (!template) return Response.json({ error: 'Modelo não encontrado.' }, { status: 404 });
    const athleteName = session.role === 'individual' ? session.name : 'MODELO PROFISSIONAL';
    const bytes = await createWorkoutPlanPdf({
      plan: workoutLibraryToPrintablePlan(template),
      userName: athleteName,
      professionalName: session.role === 'trainer' ? session.name : undefined,
      baseUrl: new URL(request.url).origin,
      planPath: session.role === 'individual' ? '/my-library' : '/library',
    });
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${workoutPlanPdfFilename(`${athleteName}-${template.title}`)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Workout Library] PDF error:', error);
    return Response.json({ error: 'Não foi possível gerar o PDF deste modelo.' }, { status: 500 });
  }
}
