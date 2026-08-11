import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = process.cwd();

function source(path) {
  return readFileSync(join(projectRoot, path), 'utf8');
}

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
}

test('public return links stay above overlapping page content', () => {
  const component = source('src/components/navigation/public-back-link.tsx');
  assert.match(component, /z-30/, 'The public return control must remain above the centered page layer.');
  assert.match(component, /href=\{href\}/, 'The return control must always have an explicit fallback destination.');
});

test('every public authentication page uses the protected return control', () => {
  const expected = new Map([
    ['src/app/login/page.tsx', '/'],
    ['src/app/login/trainer/page.tsx', '/login'],
    ['src/app/login/student/page.tsx', '/login'],
    ['src/app/register/page.tsx', '/login'],
  ]);

  for (const [path, destination] of expected) {
    assert.match(
      source(path),
      new RegExp(`<PublicBackLink\\s+href=["']${destination.replace('/', '\\/')}["']\\s*/>`),
      `${path} must return to ${destination}.`,
    );
  }
});

test('public metadata routes bypass the authentication proxy', () => {
  const proxy = source('src/proxy.ts');
  const publicMetadataRoutes = ['/icon', '/opengraph-image', '/robots.txt', '/sitemap.xml'];

  for (const route of publicMetadataRoutes) {
    assert.match(proxy, new RegExp(`['"]${route.replace('.', '\\.')}['"]`), `${route} must remain publicly accessible.`);
  }
});

test('navigation never depends on browser history being available', () => {
  const files = filesBelow(join(projectRoot, 'src'));
  const offenders = files.filter((path) => /router\.back\(|history\.back\(|window\.history\.back\(/.test(readFileSync(path, 'utf8')));
  assert.deepEqual(offenders, []);
});

test('trainer navigation exposes the primary task with clear hierarchy', () => {
  const layout = source('src/app/(trainer)/layout.tsx');
  assert.match(layout, /label: 'Operação'/);
  assert.match(layout, /label: 'Treinos'/);
  assert.match(layout, /label: 'Gestão'/);
  assert.match(layout, /href: '\/exercises', label: 'Montar ficha'/);
});

test('trainer sidebar keeps its navigation scrollable at short viewport heights', () => {
  const layout = source('src/app/(trainer)/layout.tsx');
  assert.match(layout, /flex h-full min-h-0 flex-col overflow-hidden/);
  assert.match(layout, /ScrollArea className="min-h-0 flex-1 overscroll-contain/);
  assert.match(layout, /shrink-0 space-y-1 px-3 py-3/);
});

test('workout builder becomes a three-step flow below desktop width', () => {
  const builder = source('src/app/(trainer)/exercises/page.tsx');
  assert.match(builder, /MOBILE_STEPS/);
  assert.match(builder, /aria-label="Etapas do montador"/);
  assert.match(builder, /dk-step-bar/);
  assert.match(builder, /xl:hidden/);
});
