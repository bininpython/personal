import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWeeklyWorkoutSeries,
  calculateStudentPerformance,
} from '../src/lib/analytics/performance.ts';

const student = {
  id: 'student-1',
  name: 'Aluno Teste',
  goal: 'Hipertrofia',
  status: 'active',
  created_at: '2026-01-01T00:00:00.000Z',
};

function session(day, completion = 100) {
  return {
    student_id: student.id,
    started_at: `${day}T12:00:00.000Z`,
    completed_at: `${day}T13:00:00.000Z`,
    completion_percentage: completion,
    status: 'completed',
  };
}

test('calculates seven-day adherence without including an eighth calendar day', () => {
  const result = calculateStudentPerformance({
    student,
    now: new Date('2026-08-05T18:00:00.000Z'),
    sessions: [
      session('2026-08-05'),
      session('2026-08-02'),
      session('2026-07-30'),
      session('2026-07-29'),
    ],
    assessments: [],
    plan: { student_id: student.id, days_per_week: 3, status: 'active' },
  });

  assert.equal(result.workouts7d, 3);
  assert.equal(result.workoutsPrevious7d, 1);
  assert.equal(result.consistencyScore, 100);
  assert.equal(result.risk, 'low');
  assert.equal(result.trend, 'up');
});

test('raises high risk for an inactive student and calculates physical changes', () => {
  const result = calculateStudentPerformance({
    student,
    now: new Date('2026-08-05T18:00:00.000Z'),
    sessions: [session('2026-07-10', 80)],
    assessments: [
      { student_id: student.id, assessment_date: '2026-06-01', weight: 80, body_fat_percentage: 20 },
      { student_id: student.id, assessment_date: '2026-08-01', weight: 78.5, body_fat_percentage: 18.2 },
    ],
    plan: null,
  });

  assert.equal(result.daysSinceLastWorkout, 26);
  assert.equal(result.risk, 'high');
  assert.equal(result.weightChange, -1.5);
  assert.equal(result.bodyFatChange, -1.8);
});

test('weekly series returns eight chronological buckets', () => {
  const series = buildWeeklyWorkoutSeries(
    [session('2026-08-05'), session('2026-07-30'), session('2026-07-20')],
    new Date('2026-08-05T18:00:00.000Z'),
  );

  assert.equal(series.length, 8);
  assert.deepEqual(series.at(-1), { label: 'Atual', workouts: 2 });
  assert.equal(series.reduce((sum, item) => sum + item.workouts, 0), 3);
});
