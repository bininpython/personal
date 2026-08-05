import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';

const appRoot = join(process.cwd(), 'src', 'app');
const srcRoot = join(process.cwd(), 'src');

function filesBelow(directory, predicate) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path, predicate) : predicate(path) ? [path] : [];
  });
}

function routeFromFile(path, filename) {
  const directory = relative(appRoot, path.slice(0, -filename.length - 1));
  const parts = directory.split(sep).filter((part) => part && !/^\(.+\)$/.test(part));
  return `/${parts.join('/')}`.replace(/\/$/, '') || '/';
}

const pageRoutes = filesBelow(appRoot, (path) => path.endsWith(`${sep}page.tsx`))
  .map((path) => routeFromFile(path, 'page.tsx'));
const apiRoutes = filesBelow(appRoot, (path) => path.endsWith(`${sep}route.ts`))
  .map((path) => routeFromFile(path, 'route.ts'));

function routeExists(target, routes) {
  return routes.some((route) => {
    const pattern = `^${route.replace(/\[\.{3}[^\]]+\]|\[[^\]]+\]/g, '[^/]+')}$`;
    return new RegExp(pattern).test(target);
  });
}

test('every literal internal navigation target has a page', () => {
  const sourceFiles = filesBelow(srcRoot, (path) => /\.(ts|tsx)$/.test(path));
  const targets = new Set();
  const patterns = [
    /href\s*[:=]\s*["'](\/[^"'#?]*)["']/g,
    /router\.(?:push|replace)\(\s*["'](\/[^"'#?]*)["']/g,
    /redirect\(\s*["'](\/[^"'#?]*)["']/g,
  ];

  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) targets.add(match[1]);
    }
  }

  const missing = [...targets].filter((target) => !target.startsWith('/api/') && !routeExists(target, pageRoutes));
  assert.deepEqual(missing, [], `Missing pages: ${missing.join(', ')}`);
});

test('every literal API request has a route handler', () => {
  const sourceFiles = filesBelow(srcRoot, (path) => /\.(ts|tsx)$/.test(path));
  const targets = new Set();
  const literalPattern = /fetch\(\s*["'](\/api\/[^"'?]*)/g;
  const templatePattern = /fetch\(\s*`(\/api\/[^`]*)`/g;

  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(literalPattern)) targets.add(match[1]);
    for (const match of source.matchAll(templatePattern)) {
      targets.add(match[1].replace(/\$\{[^}]+\}/g, '__dynamic__').split('?')[0]);
    }
  }

  const missing = [...targets].filter((target) => !routeExists(target, apiRoutes));
  assert.deepEqual(missing, [], `Missing APIs: ${missing.join(', ')}`);
});
