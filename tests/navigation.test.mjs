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

test('navigation never depends on browser history being available', () => {
  const files = filesBelow(join(projectRoot, 'src'));
  const offenders = files.filter((path) => /router\.back\(|history\.back\(|window\.history\.back\(/.test(readFileSync(path, 'utf8')));
  assert.deepEqual(offenders, []);
});
