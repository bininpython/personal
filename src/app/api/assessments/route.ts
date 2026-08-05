import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { initDemoData } from '@/lib/demo-data';

export async function GET(request: Request) {
  try {
    await initDemoData();

    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const trainerId = session.trainer_id;

    // --- Supabase Path ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const supabase = await createClient();
      
      // We don't have assessments table fully fleshed out in mock/Supabase yet,
      // so we just return empty array for now.
      return NextResponse.json({ assessments: [] });
    }
    // -----------------------

    // Demo Data
    // We don't have assessments in demo-data yet, so return empty
    return NextResponse.json({ assessments: [] });
  } catch (error) {
    console.error('[Get Assessments] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
