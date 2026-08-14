import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getWorkoutLibraryTemplate, workoutLibraryToTrainerInput } from '@/lib/workout-library';
import { publishWorkoutPlanRevision, WorkoutPlanPublishError } from '@/lib/workouts/plan-service';

const paramsSchema = z.string().regex(/^[a-z0-9-]{3,100}$/);
const bodySchema = z.object({ studentId: z.string().uuid('Aluno inválido.') }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const parsedId = paramsSchema.safeParse((await params).id);
    const parsedBody = bodySchema.safeParse(await request.json());
    if (!parsedId.success || !parsedBody.success) {
      return Response.json({ error: 'Revise o modelo e o aluno selecionado.' }, { status: 400 });
    }
    const template = getWorkoutLibraryTemplate(parsedId.data);
    if (!template) return Response.json({ error: 'Modelo não encontrado.' }, { status: 404 });
    const plan = await publishWorkoutPlanRevision({
      trainerId: session.trainer_id,
      input: workoutLibraryToTrainerInput(template, parsedBody.data.studentId),
      libraryTemplateId: template.id,
    });
    return Response.json({ success: true, plan, message: `“${template.title}” foi enviada e já está ativa para o aluno.` }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkoutPlanPublishError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error('[Workout Library] assign error:', error);
    return Response.json({ error: 'Não foi possível enviar esta ficha.' }, { status: 500 });
  }
}
