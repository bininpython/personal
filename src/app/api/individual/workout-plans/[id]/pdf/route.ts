import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { createWorkoutPlanPdf } from '@/lib/pdf/workout-plan';
import { createAdminClient } from '@/lib/supabase/admin';
import { getIndividualPlan } from '@/lib/workouts/individual-plan-service';

function filename(value: string) {
  const slug = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `g-kong-ficha-${slug || 'treino'}.pdf`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    const parsed = z.string().uuid().safeParse((await params).id);
    if (!parsed.success) return Response.json({ error: 'Ficha inválida.' }, { status: 400 });
    const plan = await getIndividualPlan(session.sub, parsed.data);
    if (!plan) return Response.json({ error: 'Ficha não encontrada.' }, { status: 404 });

    const admin = createAdminClient();
    const { data: user, error } = await admin.from('individual_users').select('name').eq('id', session.sub).single();
    if (error || !user) throw error || new Error('Conta não encontrada.');

    const bytes = await createWorkoutPlanPdf({ plan, userName: user.name, baseUrl: new URL(request.url).origin });
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename(plan.name)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Individual Plan PDF] Error:', error);
    return Response.json({ error: 'Não foi possível gerar o PDF da ficha.' }, { status: 500 });
  }
}
