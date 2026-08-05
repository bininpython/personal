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
      
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .eq('trainer_id', trainerId);

      if (error) throw error;

      const activeStudents = students.filter(s => s.status === 'active').length;
      
      const stats = {
        activeStudents: activeStudents,
        trainedToday: 0,
        completionRate: 0,
        alerts: 0,
      };

      const recentStudents = students
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(s => ({
          name: s.name,
          goal: s.goal || 'Não definido',
          lastWorkout: 'Sem dados',
          completion: 0,
          trend: 'stable'
        }));

      return NextResponse.json({ stats, recentStudents });
    }
    // -----------------------

    // Demo Data
    const { getStudentsByTrainerId } = await import('@/lib/demo-data');
    const demoStudents = getStudentsByTrainerId(trainerId);

    const activeStudents = demoStudents.filter(s => s.status === 'active').length;
    
    // For Chris (or any trainer with 0 students), this will naturally be 0
    const stats = {
      activeStudents: activeStudents,
      trainedToday: activeStudents > 0 ? 3 : 0,
      completionRate: activeStudents > 0 ? 83 : 0,
      alerts: activeStudents > 0 ? 3 : 0,
    };

    const recentStudents = demoStudents
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(s => ({
        name: s.full_name,
        goal: s.goal || 'Não definido',
        lastWorkout: 'Sem dados',
        completion: 0,
        trend: 'stable'
      }));

    return NextResponse.json({ stats, recentStudents });
  } catch (error) {
    console.error('[Get Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
