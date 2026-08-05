import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
    
    const supabase = await createClient();
    let query = supabase.from('exercises').select('*');
    
    if (category) {
      // Depending on schema, it might be category or target_muscle
      query = query.eq('category', category);
    }
    
    const { data: exercises, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ exercises: exercises || [] });
  } catch (error) {
    console.error('[Get Exercises] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
