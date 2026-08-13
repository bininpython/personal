import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TRAINING_METHOD_GROUPS,
  TRAINING_METHOD_IDS,
  TRAINING_METHODS,
  isTrainingMethodId,
  normalizeTrainingMethod,
  trainingMethodDetails,
} from '../src/lib/workouts/training-methods.ts';

test('offers a professional catalog of structured training methods', () => {
  assert.ok(TRAINING_METHOD_IDS.length >= 20);
  assert.equal(new Set(TRAINING_METHOD_IDS).size, TRAINING_METHOD_IDS.length);
  assert.ok(TRAINING_METHOD_GROUPS.length >= 5);

  for (const id of TRAINING_METHOD_IDS) {
    const method = TRAINING_METHODS[id];
    assert.ok(method.label.length > 0);
    assert.ok(method.summary.length > 20);
    assert.ok(method.instruction.length > 30);
    assert.ok(method.notePlaceholder.startsWith('Ex.:'));
    assert.ok(TRAINING_METHOD_GROUPS.includes(method.group));
  }
});

test('includes common methods requested by personal trainers', () => {
  for (const id of ['standard', 'dropset', 'rest_pause', 'biset', 'triset', 'superset', 'pyramid_ascending', 'pyramid_descending', 'circuit', 'to_failure']) {
    assert.equal(isTrainingMethodId(id), true, `${id} should be available`);
  }
  assert.equal(trainingMethodDetails('dropset').label, 'Drop-set');
});

test('keeps legacy free-text prescriptions as personal notes', () => {
  assert.deepEqual(normalizeTrainingMethod('10 minutos', null), {
    method: 'standard',
    methodNotes: '10 minutos',
  });
  assert.deepEqual(normalizeTrainingMethod('rest_pause', '15s entre blocos'), {
    method: 'rest_pause',
    methodNotes: '15s entre blocos',
  });
});
