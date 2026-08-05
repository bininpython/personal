import assert from 'node:assert/strict';
import test from 'node:test';
import { AVATAR_COUNT, AVATAR_OPTIONS, isAvatarOption } from '../src/lib/profile/avatars.ts';

test('offers exactly 100 stable and unique avatar choices', () => {
  assert.equal(AVATAR_COUNT, 100);
  assert.equal(AVATAR_OPTIONS.length, 100);
  assert.equal(new Set(AVATAR_OPTIONS.map((avatar) => avatar.url)).size, 100);
  assert.equal(AVATAR_OPTIONS[0].url, '/avatars/01');
  assert.equal(AVATAR_OPTIONS.at(-1).url, '/avatars/100');
  assert.equal(AVATAR_OPTIONS[50].label, 'Halter azul');
  assert.equal(AVATAR_OPTIONS.at(-1).label, 'Selo de campeão');
});

test('accepts only one of the available avatar URLs', () => {
  assert.equal(isAvatarOption('/avatars/01'), true);
  assert.equal(isAvatarOption('/avatars/50'), true);
  assert.equal(isAvatarOption('/avatars/51'), true);
  assert.equal(isAvatarOption('/avatars/100'), true);
  assert.equal(isAvatarOption('/avatars/00'), false);
  assert.equal(isAvatarOption('/avatars/101'), false);
  assert.equal(isAvatarOption('https://example.com/avatar.svg'), false);
});

test('organizes the expanded gallery into useful categories', () => {
  const categories = new Set(AVATAR_OPTIONS.map((avatar) => avatar.category));
  assert.deepEqual(categories, new Set(['people', 'weights', 'gear', 'movement', 'achievements']));
  assert.equal(AVATAR_OPTIONS.filter((avatar) => avatar.category === 'weights').length, 10);
  assert.equal(AVATAR_OPTIONS.filter((avatar) => avatar.category === 'gear').length, 10);
  assert.equal(AVATAR_OPTIONS.filter((avatar) => avatar.category === 'movement').length, 10);
  assert.equal(AVATAR_OPTIONS.filter((avatar) => avatar.category === 'achievements').length, 10);
});
