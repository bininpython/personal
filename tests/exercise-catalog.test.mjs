import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  EXERCISE_CATALOG,
  MUSCLE_REGIONS,
  getExercisesForMuscle,
} from '../src/lib/exercises/catalog.ts';
import {
  IMPORTED_EXERCISES,
  IMPORTED_EXERCISE_ASSET_COUNT,
  IMPORTED_EXERCISE_SOURCE_COUNT,
} from '../src/lib/exercises/imported-media.ts';

test('catalog covers every interactive muscle with a large exercise library', () => {
  const muscles = Object.keys(MUSCLE_REGIONS);

  assert.equal(muscles.length, 19);
  assert.ok(EXERCISE_CATALOG.length >= 700);
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

test('the imported exercise pack is complete and deduplicated by content', () => {
  assert.equal(IMPORTED_EXERCISE_SOURCE_COUNT, 480);
  assert.equal(IMPORTED_EXERCISES.length, IMPORTED_EXERCISE_SOURCE_COUNT);
  assert.equal(IMPORTED_EXERCISE_ASSET_COUNT, 475);
  assert.equal(
    new Set(IMPORTED_EXERCISES.map((exercise) => exercise.videoUrl)).size,
    IMPORTED_EXERCISE_ASSET_COUNT,
  );
  assert.equal(
    new Set(IMPORTED_EXERCISES.map((exercise) => exercise.key)).size,
    IMPORTED_EXERCISE_SOURCE_COUNT,
  );
});

test('all associated workout demonstrations exist in public storage', () => {
  const videos = EXERCISE_CATALOG.filter((exercise) => exercise.videoUrl);
  assert.ok(videos.length >= IMPORTED_EXERCISE_SOURCE_COUNT);

  for (const exercise of videos) {
    assert.ok(!exercise.videoUrl.startsWith('/public/'));
    const relativePath = exercise.videoUrl.slice(1).replaceAll('/', '\\');
    assert.ok(
      existsSync(join(process.cwd(), 'public', relativePath.replace(/^public\\/, ''))),
      `Missing video for ${exercise.name}: ${exercise.videoUrl}`,
    );
  }
});
