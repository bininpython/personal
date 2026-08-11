import 'server-only';
import { getTrainerAnalytics } from '@/lib/analytics/trainer-analytics';
import { createAdminClient } from '@/lib/supabase/admin';
import { brazilToday, formatPlanDate } from '@/lib/workouts/plan-validity';
import { getTrailingSaoPauloDayRange } from '@/lib/time/sao-paulo';

export async function generateTrainerNotifications(trainerId: string) {
  const admin = createAdminClient();
  const analytics = await getTrainerAnalytics(trainerId);
  const today = brazilToday();
  const thirtyDaysAgo = getTrailingSaoPauloDayRange(new Date(), 30).startIso;

  const { data: existing, error: existingError } = await admin
    .from('notifications')
    .select('metadata')
    .eq('user_id', trainerId)
    .eq('user_type', 'trainer')
    .gte('created_at', thirtyDaysAgo);
  if (existingError) throw existingError;

  const existingKeys = new Set((existing ?? []).map((item) => {
    const metadata = item.metadata as { key?: string } | null;
    return metadata?.key;
  }).filter((key): key is string => Boolean(key)));

  const { data: previousExpirationAlerts, error: expirationAlertError } = await admin
    .from('notifications')
    .select('metadata')
    .eq('user_id', trainerId)
    .eq('user_type', 'trainer')
    .eq('type', 'plan_expired');
  if (expirationAlertError) throw expirationAlertError;
  for (const item of previousExpirationAlerts ?? []) {
    const metadata = item.metadata as { key?: string } | null;
    if (metadata?.key) existingKeys.add(metadata.key);
  }

  const riskNotifications = analytics.students.flatMap((student) => {
    if (student.status !== 'active' || student.risk === 'low') return [];
    const key = `${today}:risk:${student.id}:${student.risk}`;
    if (existingKeys.has(key)) return [];
    return [{
      user_id: trainerId,
      user_type: 'trainer',
      type: student.risk === 'high' ? 'risk_high' : 'risk_medium',
      title: student.risk === 'high' ? 'Aluno precisa de contato' : 'Atenção à constância',
      message: `${student.name}: ${student.daysSinceLastWorkout === null ? 'nenhum treino registrado' : `${student.daysSinceLastWorkout} dia(s) sem treino`}. Constância em ${student.consistencyScore}%.`,
      read: false,
      action_url: `/students/${student.id}`,
      metadata: { key, studentId: student.id, risk: student.risk },
    }];
  });

  const studentIds = analytics.students.map((student) => student.id);
  const { data: recentSessions, error: recentSessionError } = studentIds.length > 0
    ? await admin
      .from('workout_sessions')
      .select('id, student_id, rating, feedback, completed_at')
      .in('student_id', studentIds)
      .eq('status', 'completed')
      .gte('completed_at', thirtyDaysAgo)
    : { data: [], error: null };
  if (recentSessionError) throw recentSessionError;

  const feedbackNotifications = (recentSessions ?? []).flatMap((workout) => {
    const feedback = String(workout.feedback || '');
    const concerningText = /\b(dor|les[aã]o|machuc|desconfort|tontura)\b/i.test(feedback);
    if (!concerningText && !(workout.rating != null && Number(workout.rating) <= 2)) return [];
    const key = `feedback:${workout.id}`;
    if (existingKeys.has(key)) return [];
    const student = analytics.students.find((item) => item.id === workout.student_id);
    return [{
      user_id: trainerId,
      user_type: 'trainer',
      type: 'workout_feedback',
      title: 'Feedback de treino precisa de atenção',
      message: `${student?.name || 'Aluno'} registrou ${concerningText ? 'relato de desconforto' : `avaliação ${workout.rating}/5`}. Revise antes do próximo treino.`,
      read: false,
      action_url: student ? `/students/${student.id}` : '/students',
      metadata: { key, studentId: workout.student_id, workoutSessionId: workout.id },
    }];
  });

  const { data: expiredPlans, error: expiredPlanError } = await admin
    .from('workout_plans')
    .select('id, student_id, name, end_date')
    .eq('trainer_id', trainerId)
    .eq('status', 'active')
    .lt('end_date', today);
  if (expiredPlanError) throw expiredPlanError;

  const expirationNotifications = (expiredPlans ?? []).flatMap((plan) => {
    const key = `plan-expired:${plan.id}:${plan.end_date}`;
    if (existingKeys.has(key)) return [];
    const student = analytics.students.find((item) => item.id === plan.student_id);
    return [{
      user_id: trainerId,
      user_type: 'trainer',
      type: 'plan_expired',
      title: 'Ficha de treino com prazo encerrado',
      message: `A ficha “${plan.name}” de ${student?.name || 'Aluno'} venceu em ${formatPlanDate(plan.end_date)}. Ela continua visível para o aluno até ser revisada ou substituída.`,
      read: false,
      action_url: `/exercises?planId=${plan.id}`,
      metadata: { key, studentId: plan.student_id, workoutPlanId: plan.id, endDate: plan.end_date },
    }];
  });

  const generated = [...riskNotifications, ...feedbackNotifications, ...expirationNotifications];
  if (generated.length === 0) return 0;

  const { error } = await admin.from('notifications').insert(generated);
  if (error && error.code !== '23505') throw error;
  return error ? 0 : generated.length;
}
