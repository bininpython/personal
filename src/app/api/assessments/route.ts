import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const trainerId = session.trainer_id;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (supabaseUrl) {
      const supabase = await createClient();
      
      const { data: assessments, error } = await supabase
        .from('physical_assessments')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('assessment_date', { ascending: false });
        
      if (error) {
         console.error('Error fetching assessments', error);
         return NextResponse.json({ assessments: [] });
      }

      return NextResponse.json({ assessments: assessments || [] });
    }

    return NextResponse.json({ assessments: [] });
  } catch (error) {
    console.error('[Get Assessments] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
