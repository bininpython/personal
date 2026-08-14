import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { generateTrainerNotifications } from '@/lib/notifications/generate';
import { createAdminClient } from '@/lib/supabase/admin';

const updateSchema = z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() }).strict();

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);
    const admin = createAdminClient();
    try {
      await generateTrainerNotifications(session.trainer_id);
    } catch (generationError) {
      // A geração automática é complementar: alertas já existentes continuam disponíveis.
      console.warn('[Notifications] Generation warning:', generationError);
    }

    const { data, error } = await admin
      .from('notifications')
      .select('id, type, title, message, read, action_url, metadata, created_at')
      .eq('user_id', session.trainer_id)
      .eq('user_type', 'trainer')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return json({ notifications: data ?? [], unread: (data ?? []).filter((item) => !item.read).length });
  } catch (error) {
    console.error('[Notifications] Get error:', error);
    return json({ error: 'Não foi possível carregar os alertas.' }, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') return json({ error: 'Não autorizado.' }, 401);
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success || (!parsed.data.id && !parsed.data.all)) return json({ error: 'Atualização inválida.' }, 400);

    const admin = createAdminClient();
    let query = admin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.trainer_id)
      .eq('user_type', 'trainer');
    if (parsed.data.id) query = query.eq('id', parsed.data.id);
    const { error } = await query;
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    console.error('[Notifications] Patch error:', error);
    return json({ error: 'Não foi possível atualizar os alertas.' }, 500);
  }
}
