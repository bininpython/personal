import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addPlanValidity,
  inferPlanValidity,
  isPlanExpired,
} from '../src/lib/workouts/plan-validity.ts';

test('calculates plan deadlines in days, weeks and calendar months', () => {
  assert.equal(addPlanValidity('2026-08-05', 2, 'weeks'), '2026-08-19');
  assert.equal(addPlanValidity('2026-08-05', 30, 'days'), '2026-09-04');
  assert.equal(addPlanValidity('2026-08-05', 1, 'months'), '2026-09-05');
});

test('clamps a monthly deadline to the final day of shorter months', () => {
  assert.equal(addPlanValidity('2026-01-31', 1, 'months'), '2026-02-28');
  assert.equal(addPlanValidity('2028-01-31', 1, 'months'), '2028-02-29');
});

test('infers the original period when editing an existing plan', () => {
  assert.deepEqual(inferPlanValidity('2026-08-05', '2026-10-05'), { amount: 2, unit: 'months' });
  assert.deepEqual(inferPlanValidity('2026-08-05', '2026-08-19'), { amount: 2, unit: 'weeks' });
});

test('expires only after the end date so the plan remains valid through its final day', () => {
  assert.equal(isPlanExpired('2026-08-05', '2026-08-05'), false);
  assert.equal(isPlanExpired('2026-08-05', '2026-08-06'), true);
  assert.equal(isPlanExpired(null, '2026-08-06'), false);
});
