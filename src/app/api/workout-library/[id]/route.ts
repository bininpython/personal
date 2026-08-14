import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getWorkoutLibraryTemplate } from '@/lib/workout-library';

const templateIdSchema = z.string().regex(/^[a-z0-9-]{3,100}$/);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !['trainer', 'individual'].includes(session.role)) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }
  const parsed = templateIdSchema.safeParse((await params).id);
  if (!parsed.success) return Response.json({ error: 'Modelo inválido.' }, { status: 400 });
  const template = getWorkoutLibraryTemplate(parsed.data);
  if (!template) return Response.json({ error: 'Modelo não encontrado.' }, { status: 404 });
  return Response.json({ template }, { headers: { 'Cache-Control': 'private, max-age=300' } });
}
