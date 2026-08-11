import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getTrainerAnalytics } from '@/lib/analytics/trainer-analytics';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDateInSaoPaulo, getSaoPauloDayRange } from '@/lib/time/sao-paulo';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const analytics = await getTrainerAnalytics(session.trainer_id);
    const admin = createAdminClient();
    const { startIso, nextStartIso } = getSaoPauloDayRange();
    const studentIds = analytics.students.map((student) => student.id);

    const [todaySessions, todayAppointments, publishedPlans] = await Promise.all([
      studentIds.length > 0
        ? admin
          .from('workout_sessions')
          .select('student_id')
          .in('student_id', studentIds)
          .eq('status', 'completed')
          .gte('completed_at', startIso)
          .lt('completed_at', nextStartIso)
        : Promise.resolve({ data: [], error: null }),
      admin
        .from('appointments')
        .select('id')
        .eq('trainer_id', session.trainer_id)
        .eq('status', 'scheduled')
        .gte('start_time', startIso)
        .lt('start_time', nextStartIso),
      admin
        .from('workout_plans')
        .select('id', { count: 'exact', head: true })
        .eq('trainer_id', session.trainer_id)
        .eq('status', 'active'),
    ]);
    if (todaySessions.error) throw todaySessions.error;
    if (todayAppointments.error) throw todayAppointments.error;
    if (publishedPlans.error) throw publishedPlans.error;

    const trainedToday = new Set((todaySessions.data ?? []).map((item) => item.student_id)).size;
    const activePerformance = analytics.students.filter((student) => student.status === 'active');
    const completionRate = activePerformance.length > 0
      ? Math.round(activePerformance.reduce((sum, student) => sum + student.completionAverage, 0) / activePerformance.length)
      : 0;
    const chartColors = ['#c9ff32', '#090a08', '#7cae00', '#d68b00', '#b42318', '#557187'];

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
      activation: {
        hasStudent: analytics.summary.activeStudents > 0,
        hasWorkoutPlan: (publishedPlans.count ?? 0) > 0,
      },
      goalDistribution: analytics.goalDistribution.map((goal, index) => ({ ...goal, color: chartColors[index % chartColors.length] })),
      studentRanking: analytics.students.slice().sort((left, right) => right.consistencyScore - left.consistencyScore).slice(0, 5).map((student) => ({
        id: student.id,
        name: student.name,
        goal: student.goal,
        lastWorkout: student.lastWorkoutAt ? formatDateInSaoPaulo(student.lastWorkoutAt) : 'Sem treino registrado',
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
