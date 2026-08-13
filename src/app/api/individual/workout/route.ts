import { getSession } from '@/lib/auth/session';
import { getActiveIndividualWorkout } from '@/lib/workouts/individual-workout-service';

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return json({ error: 'Não autorizado.' }, 401);
    return json({ plan: await getActiveIndividualWorkout(session.sub) });
  } catch (error) {
    console.error('[Individual Workout] GET error:', error);
    return json({ error: 'Não foi possível carregar seu próximo treino.' }, 500);
  }
}
