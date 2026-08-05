import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getTrainerAnalytics } from '@/lib/analytics/trainer-analytics';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    return NextResponse.json(await getTrainerAnalytics(session.trainer_id), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json({ error: 'O banco de dados ainda não está configurado.' }, { status: 503 });
    }
    console.error('[Analytics] Error:', error);
    return NextResponse.json({ error: 'Não foi possível analisar os dados.' }, { status: 500 });
  }
}
