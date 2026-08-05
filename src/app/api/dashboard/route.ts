import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const trainerId = session.trainer_id;
    const supabase = createAdminClient();
    
    const { data: students, error } = await supabase
      .from('students')
      .select('id, name, goal, status')
      .eq('trainer_id', trainerId);

    if (error) throw error;

    const activeStudents = students.filter((student) => student.status === 'active').length;
    const studentIds = students.map((student) => student.id);
    const { data: sessions, error: sessionError } = studentIds.length > 0
      ? await supabase
        .from('workout_sessions')
        .select('student_id, started_at, completed_at, completion_percentage, status')
        .in('student_id', studentIds)
        .order('started_at', { ascending: false })
      : { data: [], error: null };

    if (sessionError) throw sessionError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const trainedToday = new Set(
      (sessions ?? [])
        .filter((workout) => new Date(workout.started_at) >= today)
        .map((workout) => workout.student_id),
    ).size;
    const completedSessions = (sessions ?? []).filter((workout) => workout.status === 'completed');
    const completionRate = completedSessions.length > 0
      ? Math.round(completedSessions.reduce(
        (total, workout) => total + Number(workout.completion_percentage ?? 0),
        0,
      ) / completedSessions.length)
      : 0;

    const stats = {
      activeStudents,
      trainedToday,
      completionRate,
      alerts: 0,
    };

    // Calculate goal distribution
    const goalCounts: Record<string, number> = {};
    students.forEach(s => {
      const goal = s.goal || 'Geral';
      goalCounts[goal] = (goalCounts[goal] || 0) + 1;
    });

    const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    const goalDistribution = Object.entries(goalCounts).map(([name, value], index) => ({
      name,
      value,
      color: chartColors[index % chartColors.length],
    }));

    const studentRanking = students.map((student) => {
      const studentSessions = (sessions ?? []).filter((workout) => workout.student_id === student.id);
      const completed = studentSessions.filter((workout) => workout.status === 'completed');
      const completion = completed.length > 0
        ? Math.round(completed.reduce(
          (total, workout) => total + Number(workout.completion_percentage ?? 0),
          0,
        ) / completed.length)
        : 0;
      const lastWorkout = studentSessions[0]?.completed_at || studentSessions[0]?.started_at;

      return {
      id: student.id,
      name: student.name,
      goal: student.goal || 'Geral',
      lastWorkout: lastWorkout
        ? new Date(lastWorkout).toLocaleDateString('pt-BR')
        : 'Sem treino registrado',
      avatar_url: '',
      completion,
      workouts: completed.length,
      trend: 'stable' as const,
      };
    }).sort((a, b) => b.completion - a.completion || b.workouts - a.workouts).slice(0, 5);

    return NextResponse.json({ stats, goalDistribution, studentRanking });
  } catch (error) {
    console.error('[Get Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
