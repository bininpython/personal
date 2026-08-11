import 'server-only';
import { workoutHistoryStart } from '@/constants';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  buildWeeklyWorkoutSeries,
  calculateStudentPerformance,
  type PerformanceAssessment,
  type PerformancePlan,
  type PerformanceSession,
  type PerformanceStudent,
} from './performance';

export async function getTrainerAnalytics(trainerId: string) {
  const admin = createAdminClient();
  const { data: students, error: studentError } = await admin
    .from('students')
    .select('id, name, goal, status, created_at')
    .eq('trainer_id', trainerId)
    .order('name');
  if (studentError) throw studentError;

  const studentIds = (students ?? []).map((student) => student.id);
  const empty = { data: [], error: null };
  const [sessionResult, assessmentResult, planResult] = studentIds.length > 0
    ? await Promise.all([
      admin
        .from('workout_sessions')
        .select('student_id, started_at, completed_at, completion_percentage, status, rating')
        .in('student_id', studentIds)
        .gte('started_at', workoutHistoryStart())
        .order('started_at'),
      admin
        .from('physical_assessments')
        .select('student_id, assessment_date, weight, body_fat_percentage')
        .in('student_id', studentIds)
        .order('assessment_date'),
      admin
        .from('workout_plans')
        .select('student_id, days_per_week, status')
        .in('student_id', studentIds)
        .eq('status', 'active'),
    ])
    : [empty, empty, empty];

  if (sessionResult.error) throw sessionResult.error;
  if (assessmentResult.error) throw assessmentResult.error;
  if (planResult.error) throw planResult.error;

  const sessionRows = (sessionResult.data ?? []) as PerformanceSession[];
  const assessmentRows = (assessmentResult.data ?? []) as PerformanceAssessment[];
  const planRows = (planResult.data ?? []) as PerformancePlan[];
  const performance = ((students ?? []) as PerformanceStudent[]).map((student) => (
    calculateStudentPerformance({
      student,
      sessions: sessionRows.filter((item) => item.student_id === student.id),
      assessments: assessmentRows.filter((item) => item.student_id === student.id),
      plan: planRows.find((item) => item.student_id === student.id),
    })
  ));

  const active = performance.filter((student) => student.status === 'active');
  const summary = {
    activeStudents: active.length,
    atRisk: active.filter((student) => student.risk === 'high').length,
    attention: active.filter((student) => student.risk === 'medium').length,
    averageConsistency: active.length > 0
      ? Math.round(active.reduce((sum, student) => sum + student.consistencyScore, 0) / active.length)
      : 0,
    workouts7d: active.reduce((sum, student) => sum + student.workouts7d, 0),
    workouts30d: active.reduce((sum, student) => sum + student.workouts30d, 0),
  };

  const goalCounts = performance.reduce<Record<string, number>>((counts, student) => {
    counts[student.goal] = (counts[student.goal] || 0) + 1;
    return counts;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    summary,
    students: performance.sort((left, right) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[left.risk] - riskOrder[right.risk] || left.consistencyScore - right.consistencyScore;
    }),
    weeklyWorkouts: buildWeeklyWorkoutSeries(sessionRows),
    goalDistribution: Object.entries(goalCounts).map(([name, value]) => ({ name, value })),
  };
}
