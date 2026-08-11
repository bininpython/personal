import {
  calendarDaysBetweenInSaoPaulo,
  getTrailingSaoPauloDayRange,
  getTrailingSaoPauloWeekRange,
} from '../time/sao-paulo.ts';

export interface PerformanceStudent {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  created_at: string;
}

export interface PerformanceSession {
  student_id: string;
  started_at: string;
  completed_at: string | null;
  completion_percentage: number | string | null;
  status: string;
  rating?: number | null;
}

export interface PerformanceAssessment {
  student_id: string;
  assessment_date: string;
  weight: number | string | null;
  body_fat_percentage: number | string | null;
}

export interface PerformancePlan {
  student_id: string;
  days_per_week: number | null;
  status: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface StudentPerformance {
  id: string;
  name: string;
  goal: string;
  status: string;
  plannedFrequency: number;
  workouts7d: number;
  workoutsPrevious7d: number;
  workouts30d: number;
  completionAverage: number;
  consistencyScore: number;
  daysSinceLastWorkout: number | null;
  lastWorkoutAt: string | null;
  weightChange: number | null;
  bodyFatChange: number | null;
  trend: 'up' | 'down' | 'stable';
  risk: RiskLevel;
  recommendation: string;
}

function completedDate(session: PerformanceSession) {
  return new Date(session.completed_at || session.started_at);
}

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function metricChange(
  assessments: PerformanceAssessment[],
  select: (item: PerformanceAssessment) => number | string | null,
) {
  const values = assessments
    .map((item) => numeric(select(item)))
    .filter((value): value is number => value !== null);
  if (values.length < 2) return null;
  return Number((values.at(-1)! - values[0]).toFixed(1));
}

export function calculateStudentPerformance(args: {
  student: PerformanceStudent;
  sessions: PerformanceSession[];
  assessments: PerformanceAssessment[];
  plan?: PerformancePlan | null;
  now?: Date;
}): StudentPerformance {
  const now = args.now ?? new Date();
  const currentWeek = getTrailingSaoPauloWeekRange(now);
  const previousWeek = getTrailingSaoPauloWeekRange(now, 1);
  const thirtyDays = getTrailingSaoPauloDayRange(now, 30);
  const sevenDayWindowStart = new Date(currentWeek.startIso);
  const sevenDayWindowEnd = new Date(currentWeek.nextStartIso);
  const previousSevenDayWindowStart = new Date(previousWeek.startIso);
  const previousSevenDayWindowEnd = new Date(previousWeek.nextStartIso);
  const thirtyDayWindowStart = new Date(thirtyDays.startIso);
  const thirtyDayWindowEnd = new Date(thirtyDays.nextStartIso);
  const completed = args.sessions
    .filter((item) => item.status === 'completed')
    .sort((left, right) => completedDate(left).getTime() - completedDate(right).getTime());

  const workouts7d = completed.filter((item) => {
    const date = completedDate(item);
    return date >= sevenDayWindowStart && date < sevenDayWindowEnd;
  }).length;
  const workoutsPrevious7d = completed.filter((item) => {
    const date = completedDate(item);
    return date >= previousSevenDayWindowStart && date < previousSevenDayWindowEnd;
  }).length;
  const workouts30d = completed.filter((item) => {
    const date = completedDate(item);
    return date >= thirtyDayWindowStart && date < thirtyDayWindowEnd;
  }).length;
  const plannedFrequency = Math.max(1, args.plan?.days_per_week || 3);
  const completionAverage = completed.length > 0
    ? Math.round(completed.reduce((sum, item) => sum + (numeric(item.completion_percentage) ?? 0), 0) / completed.length)
    : 0;

  const latestSession = completed.at(-1) ?? null;
  const lastWorkoutAt = latestSession?.completed_at || latestSession?.started_at || null;
  const daysSinceLastWorkout = lastWorkoutAt
    ? Math.max(0, calendarDaysBetweenInSaoPaulo(now, new Date(lastWorkoutAt)))
    : null;

  const adherence = Math.min(100, Math.round((workouts7d / plannedFrequency) * 100));
  const recencyScore = daysSinceLastWorkout === null
    ? 0
    : daysSinceLastWorkout <= 3
      ? 100
      : daysSinceLastWorkout <= 7
        ? 70
        : daysSinceLastWorkout <= 14
          ? 35
          : 0;
  const consistencyScore = Math.round(adherence * 0.5 + completionAverage * 0.3 + recencyScore * 0.2);
  const risk: RiskLevel = daysSinceLastWorkout === null || daysSinceLastWorkout >= 14 || consistencyScore < 35
    ? 'high'
    : daysSinceLastWorkout >= 7 || consistencyScore < 60
      ? 'medium'
      : 'low';

  const recommendation = risk === 'high'
    ? 'Entre em contato e ajuste a ficha para facilitar a retomada.'
    : risk === 'medium'
      ? 'Acompanhe nesta semana e reforce a meta de frequência.'
      : workouts7d >= plannedFrequency
        ? 'Boa constância. Considere progressão gradual quando a execução estiver segura.'
        : 'Aluno está ativo; acompanhe o fechamento da meta semanal.';

  const studentAssessments = [...args.assessments]
    .sort((left, right) => left.assessment_date.localeCompare(right.assessment_date));

  return {
    id: args.student.id,
    name: args.student.name,
    goal: args.student.goal || 'Geral',
    status: args.student.status,
    plannedFrequency,
    workouts7d,
    workoutsPrevious7d,
    workouts30d,
    completionAverage,
    consistencyScore,
    daysSinceLastWorkout,
    lastWorkoutAt,
    weightChange: metricChange(studentAssessments, (item) => item.weight),
    bodyFatChange: metricChange(studentAssessments, (item) => item.body_fat_percentage),
    trend: workouts7d > workoutsPrevious7d ? 'up' : workouts7d < workoutsPrevious7d ? 'down' : 'stable',
    risk,
    recommendation,
  };
}

export function buildWeeklyWorkoutSeries(sessions: PerformanceSession[], now = new Date()) {
  return Array.from({ length: 8 }, (_, offset) => {
    const range = getTrailingSaoPauloWeekRange(now, offset);
    const start = new Date(range.startIso);
    const end = new Date(range.nextStartIso);
    const workouts = sessions.filter((item) => {
      const date = completedDate(item);
      return item.status === 'completed' && date >= start && date < end;
    }).length;
    return {
      label: offset === 0 ? 'Atual' : `-${offset} sem`,
      workouts,
      order: 7 - offset,
    };
  }).sort((left, right) => left.order - right.order).map(({ label, workouts }) => ({ label, workouts }));
}
