import assert from 'node:assert/strict';
import test from 'node:test';
import { AVATAR_COUNT, AVATAR_OPTIONS, isAvatarOption } from '../src/lib/profile/avatars.ts';

test('offers exactly 50 stable and unique avatar choices', () => {
  assert.equal(AVATAR_COUNT, 50);
  assert.equal(AVATAR_OPTIONS.length, 50);
  assert.equal(new Set(AVATAR_OPTIONS.map((avatar) => avatar.url)).size, 50);
  assert.equal(AVATAR_OPTIONS[0].url, '/avatars/01');
  assert.equal(AVATAR_OPTIONS.at(-1).url, '/avatars/50');
});

test('accepts only one of the available avatar URLs', () => {
  assert.equal(isAvatarOption('/avatars/01'), true);
  assert.equal(isAvatarOption('/avatars/50'), true);
  assert.equal(isAvatarOption('/avatars/00'), false);
  assert.equal(isAvatarOption('/avatars/51'), false);
  assert.equal(isAvatarOption('https://example.com/avatar.svg'), false);
});
