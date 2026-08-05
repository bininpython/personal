import { NextResponse } from 'next/server';
import { generateTrainerNotifications } from '@/lib/notifications/generate';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Agendamento automático não configurado.' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data: trainers, error } = await admin
      .from('trainers')
      .select('id')
      .eq('status', 'active')
      .order('created_at');
    if (error) throw error;

    let generated = 0;
    let processed = 0;
    for (const trainer of trainers ?? []) {
      generated += await generateTrainerNotifications(trainer.id);
      processed += 1;
    }

    return NextResponse.json({ success: true, processed, generated }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Cron Alerts] Error:', error);
    return NextResponse.json({ error: 'Falha ao gerar alertas automáticos.' }, { status: 500 });
  }
}
