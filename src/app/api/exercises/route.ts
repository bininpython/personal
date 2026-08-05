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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // --- Supabase Path ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const supabase = await createClient();
      let query = supabase.from('exercises').select('*');
      
      if (category) {
        query = query.eq('target_muscle', category);
      }
      
      const { data: exercises, error } = await query;
      if (error) throw error;
      
      return NextResponse.json({ exercises });
    }
    // -----------------------

    // Demo Data
    const { getAllExercises } = await import('@/lib/demo-data');
    let allExercises = getAllExercises();
    
    if (category) {
      allExercises = allExercises.filter(e => e.category === category || e.primary_muscle === category);
    }

    return NextResponse.json({ exercises: allExercises });
  } catch (error) {
    console.error('[Get Exercises] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
