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
  assert.doesNotMatch(jwt, /dev-secret|change-in-production|fallback/i);
  assert.match(jwt, /SESSION_SECRET/);
  assert.match(jwt, /algorithms: \['HS256'\]/);
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
