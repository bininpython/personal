import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { deleteIndividualPlan, getIndividualPlan, IndividualPlanError, publishIndividualPlan } from '@/lib/workouts/individual-plan-service';
import { individualWorkoutPlanSchema } from '@/lib/validators';

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function resolveId(params: Promise<{ id: string }>) {
  const parsed = z.string().uuid().safeParse((await params).id);
  return parsed.success ? parsed.data : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);
    const id = await resolveId(params);
    if (!id) return json({ error: 'Ficha inválida.' }, 400);
    const plan = await getIndividualPlan(session.sub, id);
    if (!plan) return json({ error: 'Ficha não encontrada.' }, 404);
    return json({ plan });
  } catch (error) {
    console.error('[Individual Plan] GET error:', error);
    return json({ error: 'Não foi possível carregar a ficha.' }, 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);
    const id = await resolveId(params);
    if (!id) return json({ error: 'Ficha inválida.' }, 400);
    if (!await getIndividualPlan(session.sub, id)) return json({ error: 'Ficha não encontrada.' }, 404);
    const parsed = individualWorkoutPlanSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Revise os dados da ficha.', details: parsed.error.flatten() }, 400);
    const plan = await publishIndividualPlan({ userId: session.sub, input: parsed.data });
    return json({ success: true, plan, replacedPlanId: id });
  } catch (error) {
    if (error instanceof IndividualPlanError) return json({ error: error.message }, error.status);
    console.error('[Individual Plan] PATCH error:', error);
    return json({ error: 'Não foi possível atualizar a ficha.' }, 500);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);
    const id = await resolveId(params);
    if (!id) return json({ error: 'Ficha inválida.' }, 400);
    await deleteIndividualPlan(session.sub, id);
    return json({ success: true });
  } catch (error) {
    if (error instanceof IndividualPlanError) return json({ error: error.message }, error.status);
    console.error('[Individual Plan] DELETE error:', error);
    return json({ error: 'Não foi possível excluir a ficha.' }, 500);
  }
}
