import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  EXERCISE_CATALOG,
  MUSCLE_REGIONS,
  getExercisesForMuscle,
} from '../src/lib/exercises/catalog.ts';

test('catalog covers every interactive muscle with a large exercise library', () => {
  const muscles = Object.keys(MUSCLE_REGIONS);

  assert.equal(muscles.length, 18);
  assert.ok(EXERCISE_CATALOG.length >= 250);
  for (const muscle of muscles) {
    assert.ok(
      getExercisesForMuscle(muscle).length > 0,
      `Expected exercises for ${muscle}`,
    );
  }
});

test('exercise catalog keys are stable and unique', () => {
  const keys = EXERCISE_CATALOG.map((exercise) => exercise.key);
  assert.equal(new Set(keys).size, keys.length);
});

test('all associated workout videos exist in public storage', () => {
  const videos = EXERCISE_CATALOG.filter((exercise) => exercise.videoUrl);
  assert.equal(videos.length, 17);
  assert.equal(new Set(videos.map((exercise) => exercise.videoUrl)).size, 17);

  for (const exercise of videos) {
    const relativePath = exercise.videoUrl.slice(1).replaceAll('/', '\\');
    assert.ok(
      existsSync(join(process.cwd(), 'public', relativePath.replace(/^public\\/, ''))),
      `Missing video for ${exercise.name}: ${exercise.videoUrl}`,
    );
  }
});
