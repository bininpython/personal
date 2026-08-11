import { getSession } from '@/lib/auth/session';
import { IndividualPlanError, listIndividualPlans, publishIndividualPlan } from '@/lib/workouts/individual-plan-service';
import { individualWorkoutPlanSchema } from '@/lib/validators';

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);
    return json({ plans: await listIndividualPlans(session.sub) });
  } catch (error) {
    console.error('[Individual Plans] GET error:', error);
    return json({ error: 'Não foi possível carregar suas fichas.' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);
    const parsed = individualWorkoutPlanSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Revise os dados da ficha.', details: parsed.error.flatten() }, 400);
    const plan = await publishIndividualPlan({ userId: session.sub, input: parsed.data });
    return json({ success: true, plan }, 201);
  } catch (error) {
    if (error instanceof IndividualPlanError) return json({ error: error.message }, error.status);
    console.error('[Individual Plans] POST error:', error);
    return json({ error: 'Não foi possível salvar sua ficha.' }, 500);
  }
}
