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

    const [todaySessions, todayAppointments, firstPlan, signedInStudent] = await Promise.all([
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
        .select('id')
        .eq('trainer_id', session.trainer_id)
        .limit(1),
      admin
        .from('students')
        .select('id')
        .eq('trainer_id', session.trainer_id)
        .not('last_login_at', 'is', null)
        .limit(1),
    ]);
    if (todaySessions.error) throw todaySessions.error;
    if (todayAppointments.error) throw todayAppointments.error;
    if (firstPlan.error) throw firstPlan.error;
    if (signedInStudent.error) throw signedInStudent.error;

    const trainedToday = new Set((todaySessions.data ?? []).map((item) => item.student_id)).size;
    const activePerformance = analytics.students.filter((student) => student.status === 'active');
    const completionRate = activePerformance.length > 0
      ? Math.round(activePerformance.reduce((sum, student) => sum + student.completionAverage, 0) / activePerformance.length)
      : 0;

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
      // Estado dos três passos que tiram o personal do painel zerado.
      // O terceiro é considerado concluído quando algum aluno de fato entrou,
      // que é a única prova de que o código chegou até ele.
      onboarding: {
        hasStudent: analytics.students.length > 0,
        hasPlan: (firstPlan.data ?? []).length > 0,
        studentSignedIn: (signedInStudent.data ?? []).length > 0,
        firstStudentId: analytics.students[0]?.id ?? null,
      },
      // A cor é decidida na interface, que é quem conhece o tema em uso.
      goalDistribution: analytics.goalDistribution,
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
