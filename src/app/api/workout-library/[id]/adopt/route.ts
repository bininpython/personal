import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getWorkoutLibraryTemplate, workoutLibraryToIndividualInput } from '@/lib/workout-library';
import { IndividualPlanError, publishIndividualPlan } from '@/lib/workouts/individual-plan-service';

const templateIdSchema = z.string().regex(/^[a-z0-9-]{3,100}$/);

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const parsed = templateIdSchema.safeParse((await params).id);
    if (!parsed.success) return Response.json({ error: 'Modelo inválido.' }, { status: 400 });
    const template = getWorkoutLibraryTemplate(parsed.data);
    if (!template) return Response.json({ error: 'Modelo não encontrado.' }, { status: 404 });
    const plan = await publishIndividualPlan({
      userId: session.sub,
      input: workoutLibraryToIndividualInput(template),
      libraryTemplateId: template.id,
    });
    return Response.json({ success: true, plan, message: `“${template.title}” agora é sua ficha ativa.` }, { status: 201 });
  } catch (error) {
    if (error instanceof IndividualPlanError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error('[Workout Library] adopt error:', error);
    return Response.json({ error: 'Não foi possível usar esta ficha.' }, { status: 500 });
  }
}
