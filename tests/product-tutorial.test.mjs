import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  isProductTutorialPath,
  PRODUCT_TUTORIALS,
  productTutorialStorageKey,
  readProductTutorialStatus,
  resolveProductTutorialStatus,
  writeProductTutorialStatus,
} from '../src/lib/product-tutorial.ts';

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function source(path) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('offers a complete tutorial for every account role', () => {
  assert.deepEqual(Object.keys(PRODUCT_TUTORIALS).sort(), ['individual', 'student', 'trainer']);

  for (const [role, tutorial] of Object.entries(PRODUCT_TUTORIALS)) {
    assert.ok(tutorial.steps.length >= 4, `${role} should have at least four useful steps`);
    assert.ok(tutorial.startHref.startsWith('/'));
    assert.equal(new Set(tutorial.steps.map((step) => step.id)).size, tutorial.steps.length);
    for (const step of tutorial.steps) {
      assert.ok(step.href.startsWith('/'));
      assert.ok(step.title.length > 0);
      assert.ok(step.description.length > 0);
      assert.ok(step.tip.length > 0);
    }
  }
});

test('scopes tutorial progress by version, role and user', () => {
  assert.notEqual(productTutorialStorageKey('trainer', 'user-a'), productTutorialStorageKey('student', 'user-a'));
  assert.notEqual(productTutorialStorageKey('trainer', 'user-a'), productTutorialStorageKey('trainer', 'user-b'));
});

test('stores a valid state and safely ignores corrupt browser data', () => {
  const storage = memoryStorage();
  assert.equal(readProductTutorialStatus(storage, 'student', 'student-a'), null);

  writeProductTutorialStatus(storage, 'student', 'student-a', 'completed', '2026-08-12T12:00:00.000Z');
  assert.equal(readProductTutorialStatus(storage, 'student', 'student-a'), 'completed');

  storage.setItem(productTutorialStorageKey('student', 'student-b'), '{broken');
  assert.equal(readProductTutorialStatus(storage, 'student', 'student-b'), null);
});

test('never downgrades tutorial progress synchronized by another device', () => {
  assert.equal(resolveProductTutorialStatus(null, 'started'), 'started');
  assert.equal(resolveProductTutorialStatus('started', 'dismissed'), 'dismissed');
  assert.equal(resolveProductTutorialStatus('dismissed', 'completed'), 'completed');
  assert.equal(resolveProductTutorialStatus('completed', 'started'), 'completed');
});

test('opens automatically only inside the matching product area', () => {
  assert.equal(isProductTutorialPath('student', '/home'), true);
  assert.equal(isProductTutorialPath('student', '/onboarding'), false);
  assert.equal(isProductTutorialPath('trainer', '/students/new'), true);
  assert.equal(isProductTutorialPath('trainer', '/my'), false);
  assert.equal(isProductTutorialPath('individual', '/my-exercises'), true);
  assert.equal(isProductTutorialPath('individual', '/dashboard'), false);
  assert.equal(isProductTutorialPath('trainer', '/help'), true);
});

test('syncs progress through the authenticated backend and a service-only table', () => {
  const route = source('src/app/api/tutorial-progress/route.ts');
  const migration = source('supabase/migrations/20260812_product_tutorial_progress.sql');

  assert.match(route, /const session = await getSession\(\)/);
  assert.match(route, /\.eq\('actor_id', session\.sub\)/);
  assert.match(route, /\.eq\('actor_role', session\.role\)/);
  assert.match(migration, /create table if not exists public\.product_tutorial_progress/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.product_tutorial_progress from anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.product_tutorial_progress to service_role/);
});
