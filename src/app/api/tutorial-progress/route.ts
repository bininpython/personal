import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import {
  PRODUCT_TUTORIAL_VERSION,
  isProductTutorialStatus,
  resolveProductTutorialStatus,
} from '@/lib/product-tutorial';
import { createAdminClient } from '@/lib/supabase/admin';

const updateSchema = z.object({
  status: z.enum(['started', 'dismissed', 'completed']),
}).strict();

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  });
}

export async function GET() {
  const session = await getSession();
  if (!session) return json({ error: 'Não autorizado.' }, 401);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('product_tutorial_progress')
      .select('status')
      .eq('actor_id', session.sub)
      .eq('actor_role', session.role)
      .eq('tutorial_version', PRODUCT_TUTORIAL_VERSION)
      .maybeSingle();

    if (error) throw error;
    return json({ status: isProductTutorialStatus(data?.status) ? data.status : null });
  } catch (error) {
    console.error('[Tutorial Progress] Read error:', error);
    return json({ error: 'Não foi possível sincronizar o tutorial.' }, 500);
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return json({ error: 'Não autorizado.' }, 401);

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Progresso inválido.' }, 400);

  try {
    const admin = createAdminClient();
    const lookup = await admin
      .from('product_tutorial_progress')
      .select('status')
      .eq('actor_id', session.sub)
      .eq('actor_role', session.role)
      .eq('tutorial_version', PRODUCT_TUTORIAL_VERSION)
      .maybeSingle();

    if (lookup.error) throw lookup.error;
    const currentStatus = isProductTutorialStatus(lookup.data?.status) ? lookup.data.status : null;
    const status = resolveProductTutorialStatus(currentStatus, parsed.data.status);
    const { error } = await admin.from('product_tutorial_progress').upsert({
      actor_id: session.sub,
      actor_role: session.role,
      tutorial_version: PRODUCT_TUTORIAL_VERSION,
      status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'actor_id,actor_role,tutorial_version' });

    if (error) throw error;
    return json({ success: true, status });
  } catch (error) {
    console.error('[Tutorial Progress] Write error:', error);
    return json({ error: 'Não foi possível salvar o progresso do tutorial.' }, 500);
  }
}
