import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { studentNeedsOnboarding } from '../src/lib/profile/onboarding.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('requires direct privacy and terms acceptance from the student', () => {
  assert.equal(studentNeedsOnboarding({ privacy_consent_at: null, terms_accepted_at: null }), true);
  assert.equal(studentNeedsOnboarding({ privacy_consent_at: '2026-08-08T12:00:00Z', terms_accepted_at: null }), true);
  assert.equal(studentNeedsOnboarding({ privacy_consent_at: null, terms_accepted_at: '2026-08-08T12:00:00Z' }), true);
  assert.equal(studentNeedsOnboarding({ privacy_consent_at: '2026-08-08T12:00:00Z', terms_accepted_at: '2026-08-08T12:00:00Z' }), false);
});

test('trainer attestation does not impersonate student consent', () => {
  const createRoute = read('src/app/api/students/route.ts');
  const studentLayout = read('src/app/(student)/layout.tsx');
  const session = read('src/lib/auth/session.ts');
  const workoutSessions = read('src/app/api/workout-sessions/route.ts');
  const migration = read('supabase/migrations/20260811_student_consent_attestation.sql');

  assert.match(createRoute, /privacy_consent_at: null/);
  assert.match(createRoute, /terms_accepted_at: null/);
  assert.match(createRoute, /trainer_privacy_attested_at/);
  assert.match(studentLayout, /studentNeedsOnboarding\(student\)/);
  assert.match(session, /onboarding_complete: Boolean\(student\.privacy_consent_at && student\.terms_accepted_at\)/);
  assert.match(workoutSessions, /canAccessStudentFeatures\(session\)/);
  assert.match(migration, /trainer_privacy_attested_by/);
});

test('public legal documents contain no launch placeholders', () => {
  const legal = `${read('src/app/terms/page.tsx')}\n${read('src/app/privacy/page.tsx')}`;
  assert.doesNotMatch(legal, /antes (?:da|do) (?:venda|lançamento|operação comercial)/i);
  assert.doesNotMatch(legal, /deve ser revisad[ao] por assessoria jurídica/i);
  assert.doesNotMatch(legal, /publicar aqui|preencher.*CNPJ/i);
  assert.match(legal, /Política de Privacidade/);
  assert.match(legal, /Termos de Uso/);
});
