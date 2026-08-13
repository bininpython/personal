import {
  APP_TIME_ZONE,
  addDateKeyDays,
  dateKeyInSaoPaulo,
  startOfSaoPauloDate,
} from '../time/sao-paulo.ts';

export const WORKOUT_WEEK_TIME_ZONE = APP_TIME_ZONE;

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
  const startDate = addDateKeyDays(today, -daysSinceMonday);
  const nextStartDate = addDateKeyDays(startDate, 7);
  const endDate = addDateKeyDays(nextStartDate, -1);

  return {
    startDate,
    endDate,
    nextStartDate,
    startIso: startOfSaoPauloDate(startDate).toISOString(),
    nextStartIso: startOfSaoPauloDate(nextStartDate).toISOString(),
  };
}

export function getWorkoutDayRange(now = new Date()): WorkoutDayRange {
  const date = dateKeyInSaoPaulo(now);
  const nextDate = addDateKeyDays(date, 1);
  return {
    date,
    startIso: startOfSaoPauloDate(date).toISOString(),
    nextStartIso: startOfSaoPauloDate(nextDate).toISOString(),
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

export function nextWorkoutDayIdAfterLast(
  dayIds: string[],
  lastCompletedDayId?: string | null,
) {
  if (dayIds.length === 0) return null;
  if (!lastCompletedDayId) return dayIds[0];
  const lastIndex = dayIds.indexOf(lastCompletedDayId);
  if (lastIndex < 0) return dayIds[0];
  return dayIds[(lastIndex + 1) % dayIds.length];
}
