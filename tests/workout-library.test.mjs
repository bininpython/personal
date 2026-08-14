import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import templates from '../src/lib/workout-library/templates.generated.json' with { type: 'json' };
import { EXERCISE_CATALOG } from '../src/lib/exercises/catalog.ts';

const catalogByKey = new Map(EXERCISE_CATALOG.map((exercise) => [exercise.key, exercise]));
const allDays = templates.flatMap((template) => template.days);
const allExercises = allDays.flatMap((day) => day.exercises);

test('library consolidates all source programs into 22 professional templates', () => {
  assert.equal(templates.length, 22);
  assert.equal(new Set(templates.map((template) => template.id)).size, 22);
  assert.equal(templates.filter((template) => template.audience === 'male').length, 12);
  assert.equal(templates.filter((template) => template.audience === 'female').length, 10);
  assert.equal(templates.filter((template) => template.goal === 'hypertrophy').length, 12);
  assert.equal(templates.filter((template) => template.goal === 'definition').length, 6);
  assert.equal(templates.filter((template) => template.goal === 'general').length, 4);
});

test('every template is complete, rotational and valid for eight weeks', () => {
  for (const template of templates) {
    assert.equal(template.durationWeeks, 8, template.id);
    assert.ok(template.daysPerWeek >= 3 && template.daysPerWeek <= 5, template.id);
    assert.ok(template.days.length >= 1 && template.days.length <= 5, template.id);
    assert.equal(new Set(template.days.map((day) => day.label)).size, template.days.length, template.id);
    for (const day of template.days) {
      assert.ok(day.exercises.length > 0, `${template.id}/${day.label}`);
    }
  }
});

test('every library prescription resolves to a catalog exercise with a local photo', () => {
  assert.equal(allDays.length, 64);
  assert.equal(allExercises.length, 514);
  for (const prescription of allExercises) {
    const exercise = catalogByKey.get(prescription.exerciseKey);
    assert.ok(exercise, `Missing catalog key ${prescription.exerciseKey}`);
    assert.ok(exercise.videoUrl?.startsWith('/exercise-media/'), `Missing visual media for ${prescription.sourceName}`);
    const thumbnail = exercise.videoUrl.replace(/^\/exercise-media\//, '').replace(/\.mp4$/i, '.jpg');
    assert.ok(existsSync(join(process.cwd(), 'public', 'exercise-thumbnails', ...thumbnail.split('/'))), `Missing thumbnail for ${prescription.sourceName}`);
    assert.ok(prescription.sets >= 1 && prescription.sets <= 20);
    assert.ok(prescription.reps.length >= 1 && prescription.reps.length <= 50);
    assert.ok(prescription.restTime >= 0 && prescription.restTime <= 900);
  }
});

test('source methods are represented as structured workout methods', () => {
  const methods = new Set(allExercises.map((exercise) => exercise.method));
  for (const expected of ['standard', 'biset', 'dropset', 'to_failure', 'partial_reps', 'circuit', 'pyramid_ascending']) {
    assert.ok(methods.has(expected), `Expected method ${expected}`);
  }
});

test('student API never exposes the global template catalog', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'app', 'api', 'workout-library', 'route.ts'), 'utf8');
  const studentBranch = source.slice(source.indexOf("session.role === 'student'"), source.indexOf('return json({ templates:'));
  assert.match(studentBranch, /library_template_id/);
  assert.match(studentBranch, /\.eq\('student_id', session\.sub\)/);
  assert.match(studentBranch, /\.eq\('trainer_id', session\.trainer_id\)/);
  assert.doesNotMatch(studentBranch, /listWorkoutLibraryTemplates\(\)/);
});
