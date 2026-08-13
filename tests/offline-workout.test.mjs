import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completedSetKeysFromQueue,
  decodeWorkoutQueue,
  enqueueWorkoutCompletion,
  queuedWorkoutDayIds,
  recordWorkoutQueueAttempt,
  removeWorkoutCompletion,
} from '../src/lib/workouts/offline-queue.ts';
import { resolveWorkoutCompletionTiming } from '../src/lib/workouts/completion-time.ts';
import { getWorkoutDayRange, getWorkoutWeekRange } from '../src/lib/workouts/week-cycle.ts';

function queuedWorkout(overrides = {}) {
  return {
    planId: 'plan-a',
    workoutDayId: 'day-a',
    queuedAt: '2026-08-12T12:00:00.000Z',
    attempts: 0,
    payload: {
      clientSessionId: '11111111-1111-4111-8111-111111111111',
      workoutDayId: 'day-a',
      startedAt: '2026-08-12T10:00:00.000Z',
      completedAt: '2026-08-12T11:00:00.000Z',
      durationSeconds: 3600,
      exercises: [{
        workoutExerciseId: 'exercise-a',
        sets: [
          { setNumber: 1, completed: true, performedRepetitions: 10, performedLoad: 20 },
          { setNumber: 2, completed: false },
        ],
      }],
    },
    ...overrides,
  };
}

test('keeps one queued workout per idempotent client session', () => {
  const original = queuedWorkout();
  const replacement = queuedWorkout({ queuedAt: '2026-08-12T12:05:00.000Z' });
  const queue = enqueueWorkoutCompletion([original], replacement);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].queuedAt, replacement.queuedAt);
});

test('recovers valid queued workouts and ignores corrupt local data', () => {
  assert.deepEqual(decodeWorkoutQueue('not-json'), []);
  const queue = decodeWorkoutQueue(JSON.stringify([queuedWorkout(), { broken: true }]));
  assert.equal(queue.length, 1);
  assert.equal(queue[0].workoutDayId, 'day-a');
});

test('tracks pending days, completed sets, retries and successful removal', () => {
  const original = queuedWorkout();
  const attempted = recordWorkoutQueueAttempt([original], original.payload.clientSessionId, 'Sem conexão', '2026-08-12T12:01:00.000Z');
  assert.equal(attempted[0].attempts, 1);
  assert.equal(attempted[0].lastError, 'Sem conexão');
  assert.deepEqual([...queuedWorkoutDayIds(attempted, 'plan-a')], ['day-a']);
  assert.deepEqual(completedSetKeysFromQueue(attempted, 'plan-a'), ['exercise-a:0']);
  assert.deepEqual(removeWorkoutCompletion(attempted, original.payload.clientSessionId), []);
});

test('preserves the real completion time when an offline workout syncs later', () => {
  const receivedAt = new Date('2026-08-13T15:00:00.000Z');
  const timing = resolveWorkoutCompletionTiming({
    startedAt: '2026-08-12T22:30:00.000Z',
    completedAt: '2026-08-12T23:30:00.000Z',
    durationSeconds: 3600,
  }, receivedAt);

  assert.equal(timing.success, true);
  if (!timing.success) return;
  assert.equal(timing.completedAt.toISOString(), '2026-08-12T23:30:00.000Z');
  assert.equal(timing.durationSeconds, 3600);
  assert.equal(getWorkoutDayRange(timing.completedAt).date, '2026-08-12');
  assert.equal(getWorkoutWeekRange(timing.completedAt).startDate, '2026-08-10');
});

test('rejects implausible or stale offline completion times', () => {
  const receivedAt = new Date('2026-08-20T12:00:00.000Z');
  assert.equal(resolveWorkoutCompletionTiming({
    startedAt: '2026-08-20T13:00:00.000Z',
    completedAt: '2026-08-20T12:00:00.000Z',
    durationSeconds: 0,
  }, receivedAt).success, false);
  assert.equal(resolveWorkoutCompletionTiming({
    startedAt: '2026-07-01T10:00:00.000Z',
    completedAt: '2026-07-01T11:00:00.000Z',
    durationSeconds: 3600,
  }, receivedAt).success, false);
});
