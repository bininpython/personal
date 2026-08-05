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
    const supabase = await createClient();
    
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('trainer_id', trainerId);

    if (error) throw error;

    const activeStudents = students.filter(s => s.status === 'active').length;
    
    // In a real application, you would query 'workout_sessions' for trainedToday/completionRate
    // and 'notifications' or 'exercise_sessions' for alerts.
    // For now, we return zeroed metrics.
    const stats = {
      activeStudents: activeStudents,
      trainedToday: 0,
      completionRate: 0,
      alerts: 0,
    };

    // Calculate goal distribution
    const goalCounts: Record<string, number> = {};
    students.forEach(s => {
      const goal = s.goal || 'Geral';
      goalCounts[goal] = (goalCounts[goal] || 0) + 1;
    });

    const goalDistribution = Object.entries(goalCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Generate basic student ranking based on dummy completion data for now
    // until we have real workout_sessions data linked up.
    const studentRanking = students.slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      avatar_url: '',
      completion: 0,
      workouts: 0,
      trend: 'stable'
    }));

    return NextResponse.json({ stats, goalDistribution, studentRanking });
  } catch (error) {
    console.error('[Get Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
