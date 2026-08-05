import 'server-only';
import { buildWeeklyWorkoutSeries, calculateStudentPerformance } from '@/lib/analytics/performance';
import { createAdminClient } from '@/lib/supabase/admin';
import type { StudentProgressData } from '@/types/student-progress';

type Related<T> = T | T[] | null;

interface RelatedWorkoutDay { name: string; day_label: string | null }
interface RelatedWorkoutPlan { name: string }

function one<T>(value: Related<T>) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function numeric(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function change(values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null);
  if (present.length < 2) return null;
  return Number((present.at(-1)! - present[0]).toFixed(1));
}

function dateLabel(date: string) {
  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export async function getStudentProgress(studentId: string): Promise<StudentProgressData | null> {
  const admin = createAdminClient();
  const [studentResult, sessionResult, assessmentResult, planResult, authResult] = await Promise.all([
    admin.from('students').select('id, trainer_id, name, goal, status, weight, height, start_date, created_at').eq('id', studentId).maybeSingle(),
    admin.from('workout_sessions').select(`
      id, student_id, started_at, completed_at, duration_seconds, completion_percentage,
      status, rating, feedback, workout_days (name, day_label), workout_plans (name)
    `).eq('student_id', studentId).order('started_at', { ascending: true }),
    admin.from('physical_assessments').select(`
      id, student_id, assessment_date, weight, height, body_fat_percentage, muscle_mass,
      blood_pressure_systolic, blood_pressure_diastolic, resting_heart_rate,
      chest, waist, abdomen, hips, right_arm, left_arm, right_thigh, left_thigh,
      right_calf, left_calf, notes, created_at
    `).eq('student_id', studentId).order('assessment_date', { ascending: true }),
    admin.from('workout_plans').select('student_id, days_per_week, status').eq('student_id', studentId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.auth.admin.getUserById(studentId),
  ]);

  if (studentResult.error) throw studentResult.error;
  if (!studentResult.data) return null;
  if (sessionResult.error) throw sessionResult.error;
  if (assessmentResult.error) throw assessmentResult.error;
  if (planResult.error) throw planResult.error;

  const student = studentResult.data;
  const { data: trainer, error: trainerError } = await admin
    .from('trainers')
    .select('name')
    .eq('id', student.trainer_id)
    .maybeSingle();
  if (trainerError) throw trainerError;

  const rawSessions = sessionResult.data ?? [];
  const completedSessions = rawSessions.filter((item) => item.status === 'completed');
  const rawAssessments = assessmentResult.data ?? [];
  const performance = calculateStudentPerformance({
    student: {
      id: student.id,
      name: student.name,
      goal: student.goal,
      status: student.status,
      created_at: student.created_at,
    },
    sessions: rawSessions,
    assessments: rawAssessments,
    plan: planResult.data,
  });

  const assessments = rawAssessments.map((assessment) => {
    const weight = numeric(assessment.weight);
    const height = numeric(assessment.height) ?? numeric(student.height);
    const heightInMeters = height && height > 3 ? height / 100 : height;
    const systolic = numeric(assessment.blood_pressure_systolic);
    const diastolic = numeric(assessment.blood_pressure_diastolic);
    return {
      id: assessment.id,
      date: assessment.assessment_date,
      dateLabel: dateLabel(assessment.assessment_date),
      weight,
      height,
      bmi: weight && heightInMeters ? Number((weight / (heightInMeters * heightInMeters)).toFixed(1)) : null,
      bodyFat: numeric(assessment.body_fat_percentage),
      muscleMass: numeric(assessment.muscle_mass),
      bloodPressure: systolic && diastolic ? `${systolic}/${diastolic}` : null,
      restingHeartRate: numeric(assessment.resting_heart_rate),
      measurements: {
        chest: numeric(assessment.chest),
        waist: numeric(assessment.waist),
        abdomen: numeric(assessment.abdomen),
        hips: numeric(assessment.hips),
        rightArm: numeric(assessment.right_arm),
        leftArm: numeric(assessment.left_arm),
        rightThigh: numeric(assessment.right_thigh),
        leftThigh: numeric(assessment.left_thigh),
        rightCalf: numeric(assessment.right_calf),
        leftCalf: numeric(assessment.left_calf),
      },
      notes: assessment.notes || '',
    };
  });

  const workouts = completedSessions.map((session) => {
    const day = one(session.workout_days as Related<RelatedWorkoutDay>);
    const plan = one(session.workout_plans as Related<RelatedWorkoutPlan>);
    return {
      id: session.id,
      date: session.completed_at || session.started_at,
      name: day?.name || (day?.day_label ? `Treino ${day.day_label}` : 'Treino concluído'),
      planName: plan?.name || 'Ficha de treino',
      completion: Number(session.completion_percentage ?? 0),
      durationMinutes: session.duration_seconds == null ? null : Math.round(Number(session.duration_seconds) / 60),
      rating: session.rating,
      feedback: session.feedback || '',
    };
  });

  const timeline = [
    ...assessments.map((assessment) => ({
      id: `assessment-${assessment.id}`,
      type: 'assessment' as const,
      date: assessment.date,
      title: 'Avaliação física',
      description: [
        assessment.weight === null ? '' : `${assessment.weight} kg`,
        assessment.bodyFat === null ? '' : `${assessment.bodyFat}% de gordura`,
        assessment.muscleMass === null ? '' : `${assessment.muscleMass} kg de massa muscular`,
      ].filter(Boolean).join(' · ') || 'Medidas e observações atualizadas.',
    })),
    ...workouts.map((workout) => ({
      id: `workout-${workout.id}`,
      type: 'workout' as const,
      date: workout.date,
      title: workout.name,
      description: `${workout.completion}% concluído${workout.durationMinutes ? ` · ${workout.durationMinutes} min` : ''}`,
    })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()).slice(0, 40);

  return {
    generatedAt: new Date().toISOString(),
    student: {
      id: student.id,
      name: student.name,
      goal: student.goal || 'Objetivo geral',
      status: student.status,
      avatarUrl: typeof authResult.data.user?.user_metadata?.avatar_url === 'string' ? authResult.data.user.user_metadata.avatar_url : '',
      startDate: student.start_date || student.created_at,
      currentWeight: numeric(student.weight),
      height: numeric(student.height),
    },
    trainer: { name: trainer?.name || 'Personal trainer' },
    performance: {
      plannedFrequency: performance.plannedFrequency,
      workouts7d: performance.workouts7d,
      workouts30d: performance.workouts30d,
      completedWorkouts: completedSessions.length,
      completionAverage: performance.completionAverage,
      consistencyScore: performance.consistencyScore,
      daysSinceLastWorkout: performance.daysSinceLastWorkout,
      weightChange: performance.weightChange,
      bodyFatChange: performance.bodyFatChange,
      muscleMassChange: change(assessments.map((assessment) => assessment.muscleMass)),
      risk: performance.risk,
      recommendation: performance.recommendation,
    },
    assessments,
    workouts: workouts.slice().reverse(),
    weeklyWorkouts: buildWeeklyWorkoutSeries(rawSessions),
    timeline,
  };
}
