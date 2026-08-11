export const APP_TIME_ZONE = 'America/Sao_Paulo';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function formatterValues(formatter: Intl.DateTimeFormat, date: Date) {
  return Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
}

export function dateKeyInSaoPaulo(date = new Date()) {
  const values = formatterValues(dateFormatter, date);
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDateKeyDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function startOfSaoPauloDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const nominalUtc = Date.UTC(year, month - 1, day);
  let instant = nominalUtc;

  // Resolve the UTC instant that represents midnight in São Paulo. Iterating
  // also keeps this correct if Brazil changes its daylight-saving rules.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const values = formatterValues(dateTimeFormatter, new Date(instant));
    const representedUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    const correction = nominalUtc - representedUtc;
    instant += correction;
    if (correction === 0) break;
  }

  return new Date(instant);
}

export function saoPauloDateTimeToIso(dateKey: string, timeKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}(?::\d{2})?$/.test(timeKey)) {
    throw new Error('Data ou horário inválido.');
  }
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute, second = 0] = timeKey.split(':').map(Number);
  const nominalUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = nominalUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const values = formatterValues(dateTimeFormatter, new Date(instant));
    const representedUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    const correction = nominalUtc - representedUtc;
    instant += correction;
    if (correction === 0) break;
  }

  return new Date(instant).toISOString();
}

export function getSaoPauloDayRange(now = new Date()) {
  const date = dateKeyInSaoPaulo(now);
  const nextDate = addDateKeyDays(date, 1);
  return {
    date,
    startIso: startOfSaoPauloDate(date).toISOString(),
    nextStartIso: startOfSaoPauloDate(nextDate).toISOString(),
  };
}

export function getSaoPauloMonthRange(monthKey: string) {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;
  const startDate = `${monthKey}-01`;
  const [year, month] = monthKey.split('-').map(Number);
  if (month < 1 || month > 12) return null;
  const nextMonth = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7);
  return {
    startIso: startOfSaoPauloDate(startDate).toISOString(),
    nextStartIso: startOfSaoPauloDate(`${nextMonth}-01`).toISOString(),
  };
}

export function getTrailingSaoPauloWeekRange(now = new Date(), offset = 0) {
  return getTrailingSaoPauloDayRange(now, 7, offset * 7);
}

export function getTrailingSaoPauloDayRange(now = new Date(), dayCount = 7, offsetDays = 0) {
  const today = dateKeyInSaoPaulo(now);
  const safeDayCount = Math.max(1, Math.trunc(dayCount));
  const endDate = addDateKeyDays(today, -Math.max(0, Math.trunc(offsetDays)));
  const startDate = addDateKeyDays(endDate, -(safeDayCount - 1));
  const nextDate = addDateKeyDays(endDate, 1);
  return {
    startDate,
    endDate,
    startIso: startOfSaoPauloDate(startDate).toISOString(),
    nextStartIso: startOfSaoPauloDate(nextDate).toISOString(),
  };
}

export function hourInSaoPaulo(now = new Date()) {
  return Number(formatterValues(dateTimeFormatter, now).hour);
}

export function calendarDaysBetweenInSaoPaulo(later: Date, earlier: Date) {
  const laterKey = dateKeyInSaoPaulo(later);
  const earlierKey = dateKeyInSaoPaulo(earlier);
  const laterNoon = new Date(`${laterKey}T12:00:00Z`).getTime();
  const earlierNoon = new Date(`${earlierKey}T12:00:00Z`).getTime();
  return Math.round((laterNoon - earlierNoon) / 86_400_000);
}

export function formatDateInSaoPaulo(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('pt-BR', { timeZone: APP_TIME_ZONE, ...options });
}
