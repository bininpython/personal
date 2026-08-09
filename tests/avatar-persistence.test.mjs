import assert from 'node:assert/strict';
import test from 'node:test';
import { isPrivateAvatar, parsePrivateAvatar } from '../src/lib/profile/private-avatar.ts';

test('resolve fotos novas no bucket privado', () => {
  assert.deepEqual(parsePrivateAvatar('private:student/id/photo.webp'), {
    bucket: 'profile-images-private',
    path: 'student/id/photo.webp',
  });
});

test('mantém fotos legadas privadas sem mover o objeto', () => {
  assert.deepEqual(parsePrivateAvatar('private-legacy:trainer/id/photo.jpg'), {
    bucket: 'profile-images',
    path: 'trainer/id/photo.jpg',
  });
});

test('não trata avatares embutidos ou URLs externas como fotos privadas', () => {
  assert.equal(isPrivateAvatar('/avatars/71'), false);
  assert.equal(parsePrivateAvatar('https://example.com/photo.webp'), null);
  assert.equal(parsePrivateAvatar(null), null);
});
