import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('conta individual registra treinos em tabelas privadas e impede duplicidade diária', () => {
  const migration = read('supabase/migrations/20260813210000_individual_workout_tracking.sql');
  const indexMigration = read('supabase/migrations/20260813213000_index_individual_workout_foreign_keys.sql');
  for (const table of [
    'individual_workout_sessions',
    'individual_exercise_sessions',
    'individual_set_records',
  ]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(migration, new RegExp(`revoke all privileges on table public\\.${table} from anon, authenticated`));
  }
  assert.match(migration, /unique \(user_id, workout_plan_id, workout_date\)/);
  assert.match(migration, /grant select, insert, update, delete on table public\.individual_workout_sessions to service_role/);
  assert.match(indexMigration, /individual_workout_sessions \(workout_day_id\)/);
  assert.match(indexMigration, /individual_exercise_sessions \(workout_exercise_id\)/);
});

test('execução individual valida propriedade, séries, limite diário e rotação', () => {
  const route = read('src/app/api/individual/workout-sessions/route.ts');
  const service = read('src/lib/workouts/individual-workout-service.ts');
  const page = read('src/app/(individual)/my-workout/page.tsx');

  assert.match(route, /session\.role !== 'individual'/);
  assert.match(route, /completeWorkoutSchema\.safeParse/);
  assert.match(route, /plan\.user_id !== session\.sub/);
  assert.match(route, /alreadyCompletedToday/);
  assert.match(route, /workout_date: dayRange\.date/);
  assert.match(route, /Siga a sequência semanal/);
  assert.match(service, /nextWorkoutDayId/);
  assert.match(page, /Iniciar ficha/);
  assert.match(page, /Tempo de descanso/);
  assert.match(page, /Concluir e salvar ficha/);
  assert.match(page, /disponível amanhã/);
});

test('histórico individual entra na exportação integral da conta', () => {
  const exportRoute = read('src/app/api/account/export/route.ts');
  for (const dataSet of ['workoutSessions', 'exerciseSessions', 'setRecords']) {
    assert.match(exportRoute, new RegExp(dataSet));
  }
});
