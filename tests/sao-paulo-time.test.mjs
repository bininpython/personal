import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calendarDaysBetweenInSaoPaulo,
  dateKeyInSaoPaulo,
  getSaoPauloMonthRange,
  getTrailingSaoPauloDayRange,
  saoPauloDateTimeToIso,
} from '../src/lib/time/sao-paulo.ts';
import { calculateStudentPerformance } from '../src/lib/analytics/performance.ts';

test('keeps UTC midnight on the previous São Paulo calendar date', () => {
  assert.equal(dateKeyInSaoPaulo(new Date('2026-08-01T02:59:59Z')), '2026-07-31');
  assert.equal(dateKeyInSaoPaulo(new Date('2026-08-01T03:00:00Z')), '2026-08-01');
  assert.equal(saoPauloDateTimeToIso('2026-08-01', '09:30:00'), '2026-08-01T12:30:00.000Z');
});

test('builds São Paulo month and trailing-day boundaries', () => {
  assert.deepEqual(getSaoPauloMonthRange('2026-08'), {
    startIso: '2026-08-01T03:00:00.000Z',
    nextStartIso: '2026-09-01T03:00:00.000Z',
  });
  const range = getTrailingSaoPauloDayRange(new Date('2026-08-01T02:30:00Z'), 7);
  assert.equal(range.startDate, '2026-07-25');
  assert.equal(range.endDate, '2026-07-31');
  assert.equal(range.nextStartIso, '2026-08-01T03:00:00.000Z');
});

test('calculates calendar days and analytics in São Paulo, independent of server timezone', () => {
  assert.equal(calendarDaysBetweenInSaoPaulo(
    new Date('2026-08-01T02:30:00Z'),
    new Date('2026-07-31T02:30:00Z'),
  ), 1);

  const student = { id: 'student-1', name: 'Teste', goal: null, status: 'active', created_at: '2026-01-01T00:00:00Z' };
  const makeSession = (completed_at) => ({
    student_id: student.id,
    started_at: completed_at,
    completed_at,
    completion_percentage: 100,
    status: 'completed',
  });
  const result = calculateStudentPerformance({
    student,
    now: new Date('2026-08-01T02:30:00Z'),
    sessions: [makeSession('2026-07-25T03:00:00Z'), makeSession('2026-07-25T02:59:59Z')],
    assessments: [],
    plan: { student_id: student.id, days_per_week: 2, status: 'active' },
  });
  assert.equal(result.workouts7d, 1);
  assert.equal(result.workoutsPrevious7d, 1);
  assert.equal(result.daysSinceLastWorkout, 6);
});
