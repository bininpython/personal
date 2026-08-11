import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { activateIndividualPlan, IndividualPlanError } from '@/lib/workouts/individual-plan-service';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    const parsed = z.string().uuid().safeParse((await params).id);
    if (!parsed.success) return Response.json({ error: 'Ficha inválida.' }, { status: 400 });
    await activateIndividualPlan(session.sub, parsed.data);
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof IndividualPlanError) return Response.json({ error: error.message }, { status: error.status });
    console.error('[Individual Plan] Activate error:', error);
    return Response.json({ error: 'Não foi possível ativar a ficha.' }, { status: 500 });
  }
}
