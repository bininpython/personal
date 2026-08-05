import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getTrainerAnalytics } from '@/lib/analytics/trainer-analytics';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const analytics = await getTrainerAnalytics(session.trainer_id);
    const admin = createAdminClient();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const studentIds = analytics.students.map((student) => student.id);

    const [todaySessions, todayAppointments] = await Promise.all([
      studentIds.length > 0
        ? admin
          .from('workout_sessions')
          .select('student_id')
          .in('student_id', studentIds)
          .eq('status', 'completed')
          .gte('completed_at', start.toISOString())
          .lt('completed_at', end.toISOString())
        : Promise.resolve({ data: [], error: null }),
      admin
        .from('appointments')
        .select('id')
        .eq('trainer_id', session.trainer_id)
        .eq('status', 'scheduled')
        .gte('start_time', start.toISOString())
        .lt('start_time', end.toISOString()),
    ]);
    if (todaySessions.error) throw todaySessions.error;
    if (todayAppointments.error) throw todayAppointments.error;

    const trainedToday = new Set((todaySessions.data ?? []).map((item) => item.student_id)).size;
    const activePerformance = analytics.students.filter((student) => student.status === 'active');
    const completionRate = activePerformance.length > 0
      ? Math.round(activePerformance.reduce((sum, student) => sum + student.completionAverage, 0) / activePerformance.length)
      : 0;
    const chartColors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

    return NextResponse.json({
      stats: {
        activeStudents: analytics.summary.activeStudents,
        trainedToday,
        completionRate,
        averageConsistency: analytics.summary.averageConsistency,
        atRisk: analytics.summary.atRisk,
        alerts: analytics.summary.atRisk + analytics.summary.attention,
        appointmentsToday: (todayAppointments.data ?? []).length,
      },
      goalDistribution: analytics.goalDistribution.map((goal, index) => ({ ...goal, color: chartColors[index % chartColors.length] })),
      studentRanking: analytics.students.slice().sort((left, right) => right.consistencyScore - left.consistencyScore).slice(0, 5).map((student) => ({
        id: student.id,
        name: student.name,
        goal: student.goal,
        lastWorkout: student.lastWorkoutAt ? new Date(student.lastWorkoutAt).toLocaleDateString('pt-BR') : 'Sem treino registrado',
        completion: student.completionAverage,
        consistency: student.consistencyScore,
        workouts: student.workouts30d,
        risk: student.risk,
        trend: student.trend,
      })),
      priorities: analytics.students.filter((student) => student.risk !== 'low').slice(0, 3).map((student) => ({
        id: student.id,
        name: student.name,
        risk: student.risk,
        recommendation: student.recommendation,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    return NextResponse.json({ error: 'Não foi possível carregar o dashboard.' }, { status: 500 });
  }
}
