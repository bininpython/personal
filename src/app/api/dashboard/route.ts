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

      const goalDistribution = [] as any[];
      const studentRanking = [] as any[];

      return NextResponse.json({ stats, goalDistribution, studentRanking });
    }
    // -----------------------

    // Demo Data
    const { getDashboardStats } = await import('@/lib/demo-data');
    const demoStats = getDashboardStats(trainerId);

    const stats = {
      activeStudents: demoStats.total_active_students,
      trainedToday: demoStats.trained_today,
      completionRate: demoStats.avg_completion_rate,
      alerts: demoStats.pain_alerts + demoStats.unread_messages,
    };

    return NextResponse.json({ 
      stats, 
      goalDistribution: demoStats.goalDistribution, 
      studentRanking: demoStats.studentRanking 
    });
  } catch (error) {
    console.error('[Get Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
