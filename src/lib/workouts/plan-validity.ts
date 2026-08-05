export type PlanValidityUnit = 'days' | 'weeks' | 'months';

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function brazilToday(reference = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reference);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addPlanValidity(
  startDate: string,
  amount: number,
  unit: PlanValidityUnit,
) {
  const date = parseDateOnly(startDate);
  const safeAmount = Math.max(1, Math.round(amount));

  if (unit === 'months') {
    const originalDay = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + safeAmount);
    const lastDayOfTargetMonth = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      0,
    )).getUTCDate();
    date.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  } else {
    date.setUTCDate(date.getUTCDate() + safeAmount * (unit === 'weeks' ? 7 : 1));
  }

  return toDateOnly(date);
}

export function inferPlanValidity(startDate: string, endDate: string | null | undefined) {
  if (!endDate) return { amount: 4, unit: 'weeks' as PlanValidityUnit };

  for (let months = 1; months <= 24; months += 1) {
    if (addPlanValidity(startDate, months, 'months') === endDate) {
      return { amount: months, unit: 'months' as PlanValidityUnit };
    }
  }

  const difference = Math.max(
    1,
    Math.round((parseDateOnly(endDate).getTime() - parseDateOnly(startDate).getTime()) / 86_400_000),
  );
  if (difference % 7 === 0) {
    return { amount: difference / 7, unit: 'weeks' as PlanValidityUnit };
  }
  return { amount: difference, unit: 'days' as PlanValidityUnit };
}

export function isPlanExpired(endDate: string | null | undefined, today = brazilToday()) {
  return Boolean(endDate && endDate < today);
}

export function formatPlanDate(date: string | null | undefined) {
  if (!date) return 'Sem prazo';
  return parseDateOnly(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
