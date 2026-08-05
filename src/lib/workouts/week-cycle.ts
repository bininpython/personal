export const WORKOUT_WEEK_TIME_ZONE = 'America/Sao_Paulo';

function dateKeyInSaoPaulo(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WORKOUT_WEEK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDateDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export interface WorkoutWeekRange {
  startDate: string;
  endDate: string;
  nextStartDate: string;
  startIso: string;
  nextStartIso: string;
}

export interface WorkoutDayRange {
  date: string;
  startIso: string;
  nextStartIso: string;
}

export function getWorkoutWeekRange(now = new Date()): WorkoutWeekRange {
  const today = dateKeyInSaoPaulo(now);
  const dayOfWeek = new Date(`${today}T12:00:00Z`).getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startDate = addDateDays(today, -daysSinceMonday);
  const nextStartDate = addDateDays(startDate, 7);
  const endDate = addDateDays(nextStartDate, -1);

  return {
    startDate,
    endDate,
    nextStartDate,
    startIso: new Date(`${startDate}T00:00:00-03:00`).toISOString(),
    nextStartIso: new Date(`${nextStartDate}T00:00:00-03:00`).toISOString(),
  };
}

export function getWorkoutDayRange(now = new Date()): WorkoutDayRange {
  const date = dateKeyInSaoPaulo(now);
  const nextDate = addDateDays(date, 1);
  return {
    date,
    startIso: new Date(`${date}T00:00:00-03:00`).toISOString(),
    nextStartIso: new Date(`${nextDate}T00:00:00-03:00`).toISOString(),
  };
}

export function weeklyWorkoutAllowance(totalDays: number, prescribedFrequency: number, dayIndex: number) {
  if (totalDays <= 0 || dayIndex < 0 || dayIndex >= totalDays) return 0;
  const target = Math.max(totalDays, prescribedFrequency);
  return Math.floor(target / totalDays) + (dayIndex < target % totalDays ? 1 : 0);
}

export function nextWorkoutDayId(
  dayIds: string[],
  prescribedFrequency: number,
  completedByDay: ReadonlyMap<string, number>,
) {
  if (dayIds.length === 0) return null;
  const target = Math.max(dayIds.length, prescribedFrequency);
  const remainingCompleted = new Map(completedByDay);
  for (let index = 0; index < target; index += 1) {
    const dayId = dayIds[index % dayIds.length];
    const completed = remainingCompleted.get(dayId) ?? 0;
    if (completed > 0) remainingCompleted.set(dayId, completed - 1);
    else return dayId;
  }
  return null;
}
