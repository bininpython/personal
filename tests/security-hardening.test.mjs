import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('autenticação comercial não cria e-mail, telefone ou senha sintética', () => {
  const routes = [
    read('src/app/api/auth/trainer/register/route.ts'),
    read('src/app/api/auth/trainer/login/route.ts'),
    read('src/app/api/auth/student/login/route.ts'),
    read('src/app/api/students/route.ts'),
  ].join('\n');
  assert.doesNotMatch(routes, /signInWithPassword|auth\.admin\.createUser|buildSyntheticEmail|mockEmail|@example\.com/);
});

test('migração inclui sessões revogáveis, bloqueio, consentimento e idempotência', () => {
  const migration = read('supabase/migrations/20260808_commercial_security.sql');
  for (const required of [
    'app_sessions',
    'auth_rate_limits',
    'consume_auth_rate_limit',
    'privacy_consent_at',
    'client_session_id',
    'profile-images-private',
    "status = 'active'",
  ]) assert.match(migration, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(migration, /v_now timestamp with time zone := now\(\)/);
  assert.doesNotMatch(migration, /current_time timestamp with time zone/);
});

test('credenciais não têm fallback secreto fixo', () => {
  const jwt = read('src/lib/auth/jwt.ts');
  const secrets = read('src/lib/auth/secrets.ts');
  assert.doesNotMatch(jwt, /dev-secret|change-in-production|SUPABASE_SECRET_KEY/i);
  assert.match(jwt, /getSessionSecret/);
  assert.match(secrets, /NODE_ENV === 'production'/);
  assert.match(secrets, /configurationError\('SESSION_SECRET'\)/);
  assert.match(secrets, /configurationError\('RATE_LIMIT_SECRET'\)/);
  assert.match(jwt, /algorithms: \['HS256'\]/);
});

test('exportação inclui toda a cadeia de dados e pagina resultados', () => {
  const route = read('src/app/api/account/export/route.ts');
  for (const required of [
    'workoutDays', 'workoutExercises', 'exercises', 'exerciseSessions', 'setRecords',
    'messages', 'notifications', 'studentAchievements', 'achievements', 'PAGE_SIZE', '.range(from, to)',
  ]) assert.match(route, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(route, /access_code_hash|recovery_password_hash/);
});

test('falha de migração recebe resposta operacional sem expor detalhes internos', () => {
  const register = read('src/app/api/auth/trainer/register/route.ts');
  const errors = read('src/lib/supabase/errors.ts');
  assert.match(register, /DATABASE_UPDATE_REQUIRED/);
  assert.match(errors, /PGRST202/);
  assert.match(errors, /Atualização segura do sistema pendente/);
});

test('cabeçalhos impedem framing e sniffing', () => {
  const config = read('next.config.ts');
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /poweredByHeader: false/);
});

test('falha transitória ao gerar alertas não derruba as notificações existentes', () => {
  const route = read('src/app/api/notifications/route.ts');
  assert.match(route, /try \{\s*await generateTrainerNotifications/);
  assert.match(route, /Generation warning/);
  assert.match(route, /notifications: data \?\? \[\]/);
});

test('conta individual usa tabelas isoladas e não recebe recursos profissionais', () => {
  const migration = read('supabase/migrations/20260811_individual_training.sql');
  const proxy = read('src/proxy.ts');
  const exercises = read('src/app/api/exercises/route.ts');
  const sessionTypes = read('src/lib/auth/session-types.ts');
  const studentProfile = read('src/app/api/students/[id]/route.ts');
  for (const table of ['individual_users', 'individual_workout_plans', 'individual_workout_days', 'individual_workout_exercises']) {
    assert.match(migration, new RegExp(table));
  }
  assert.match(migration, /role in \('trainer', 'student', 'individual'\)/);
  assert.match(proxy, /INDIVIDUAL_PATHS/);
  assert.match(exercises, /session\.role !== 'individual'/);
  assert.match(sessionTypes, /session\.role === 'trainer'/);
  assert.match(sessionTypes, /session\.role === 'student' && session\.onboarding_complete === true/);
  assert.match(studentProfile, /session\.role !== 'trainer' && session\.role !== 'student'/);
});

test('PDF da ficha é privado, identificado e usa a marca G KONG', () => {
  const route = read('src/app/api/individual/workout-plans/[id]/pdf/route.ts');
  const managedRoute = read('src/app/api/workout-plans/[id]/pdf/route.ts');
  const generator = read('src/lib/pdf/workout-plan.ts');
  assert.match(route, /session\.role !== 'individual'/);
  assert.match(route, /Content-Type': 'application\/pdf'/);
  assert.match(route, /workoutPlanPdfFilename\(`\$\{user\.name\}-\$\{plan\.name\}`\)/);
  assert.match(managedRoute, /session\.role !== 'trainer' && session\.role !== 'student'/);
  assert.match(managedRoute, /studentId: session\.role === 'student' \? session\.sub : undefined/);
  assert.match(managedRoute, /activeOnly: session\.role === 'student'/);
  assert.match(managedRoute, /Content-Type': 'application\/pdf'/);
  assert.match(managedRoute, /workoutPlanPdfFilename\(`\$\{plan\.studentName\}-\$\{plan\.name\}`\)/);
  assert.match(generator, /gkong-logo\.jpg/);
  assert.match(generator, /PERFORMANCE SYSTEM/);
  assert.match(generator, /PERSONAL RESPONSÁVEL/);
  assert.match(generator, /FICHA \$\{args\.userName\.toLocaleUpperCase/);
  assert.match(generator, /workoutDayCount} fichas/);
  assert.match(generator, /exercise-thumbnails/);
});

test('cópia de ficha respeita propriedade, troca o aluno e preserva a validade', () => {
  const route = read('src/app/api/workout-plans/[id]/copy/route.ts');
  assert.match(route, /session\.role !== 'trainer'/);
  assert.match(route, /trainerId: session\.trainer_id/);
  assert.match(route, /source\.studentId === parsed\.data\.studentId/);
  assert.match(route, /studentId: parsed\.data\.studentId/);
  assert.match(route, /inferPlanValidity/);
  assert.match(route, /publishWorkoutPlanRevision/);
});

test('migração restringe funções privilegiadas e cobre chaves estrangeiras', () => {
  const migration = read('supabase/migrations/20260813132126_harden_database_functions_and_indexes.sql');
  assert.match(migration, /revoke execute on function public\.consume_auth_rate_limit.*public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.consume_auth_rate_limit.*service_role/);
  assert.match(migration, /workout_plans_student_id_idx/);
  assert.match(migration, /exercise_sessions_workout_session_id_idx/);
  assert.match(migration, /Students and trainers can read authorized profiles/);
});

test('alertas automáticos filtram personais existentes sem depender de coluna ausente', () => {
  const route = read('src/app/api/cron/alerts/route.ts');
  assert.match(route, /\.is\('deleted_at', null\)/);
  assert.doesNotMatch(route, /\.eq\('status', 'active'\)/);
});
