import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getWorkoutDayRange,
  getWorkoutWeekRange,
  nextWorkoutDayId,
  nextWorkoutDayIdAfterLast,
  weeklyWorkoutAllowance,
} from '../src/lib/workouts/week-cycle.ts';

test('uses Monday through Sunday as the workout cycle in São Paulo', () => {
  const range = getWorkoutWeekRange(new Date('2026-08-05T18:00:00Z'));
  assert.equal(range.startDate, '2026-08-03');
  assert.equal(range.endDate, '2026-08-09');
  assert.equal(range.nextStartDate, '2026-08-10');
  assert.equal(range.startIso, '2026-08-03T03:00:00.000Z');
});

test('keeps Sunday in the week that started on the previous Monday', () => {
  const range = getWorkoutWeekRange(new Date('2026-08-09T22:30:00Z'));
  assert.equal(range.startDate, '2026-08-03');
  assert.equal(range.endDate, '2026-08-09');
});

test('starts a new cycle at Monday midnight in São Paulo', () => {
  const before = getWorkoutWeekRange(new Date('2026-08-10T02:59:59Z'));
  const after = getWorkoutWeekRange(new Date('2026-08-10T03:00:00Z'));
  assert.equal(before.startDate, '2026-08-03');
  assert.equal(after.startDate, '2026-08-10');
});

test('calculates the current day in São Paulo', () => {
  const range = getWorkoutDayRange(new Date('2026-08-10T02:59:59Z'));
  assert.equal(range.date, '2026-08-09');
  assert.equal(range.startIso, '2026-08-09T03:00:00.000Z');
});

test('supports every workout added by the trainer and distributes repeated sessions', () => {
  assert.equal(weeklyWorkoutAllowance(3, 3, 0), 1);
  assert.equal(weeklyWorkoutAllowance(1, 3, 0), 3);
  assert.equal(weeklyWorkoutAllowance(2, 3, 0), 2);
  assert.equal(weeklyWorkoutAllowance(2, 3, 1), 1);
  assert.equal(weeklyWorkoutAllowance(8, 3, 7), 1);
});

test('suggests the next workout in round-robin order', () => {
  const ids = ['A', 'B', 'C'];
  assert.equal(nextWorkoutDayId(ids, 3, new Map()), 'A');
  assert.equal(nextWorkoutDayId(ids, 3, new Map([['A', 1]])), 'B');
  assert.equal(nextWorkoutDayId(ids, 3, new Map([['A', 1], ['B', 1], ['C', 1]])), null);
  assert.equal(nextWorkoutDayId(['A', 'B'], 3, new Map([['A', 1], ['B', 1]])), 'A');
});

test('keeps the A B rotation across week boundaries', () => {
  assert.equal(nextWorkoutDayIdAfterLast(['A', 'B'], null), 'A');
  assert.equal(nextWorkoutDayIdAfterLast(['A', 'B'], 'A'), 'B');
  assert.equal(nextWorkoutDayIdAfterLast(['A', 'B'], 'B'), 'A');
  assert.equal(nextWorkoutDayIdAfterLast(['A', 'B'], 'removed-day'), 'A');
});
