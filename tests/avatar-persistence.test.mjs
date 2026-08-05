import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeUserMetadata, storedAvatarUrl } from '../src/lib/profile/avatar-metadata.ts';

test('reads the avatar stored in authentication metadata', () => {
  assert.equal(storedAvatarUrl({ avatar_url: '/avatars/71' }), '/avatars/71');
  assert.equal(storedAvatarUrl({ avatar_url: 'https://storage.example/photo.webp' }), 'https://storage.example/photo.webp');
  assert.equal(storedAvatarUrl({ avatar_url: 71 }), '');
  assert.equal(storedAvatarUrl(null), '');
});

test('keeps the avatar when another profile field changes', () => {
  const metadata = mergeUserMetadata(
    { avatar_url: '/avatars/71', city: 'Timóteo' },
    { name: 'Novo nome' },
  );
  assert.deepEqual(metadata, {
    avatar_url: '/avatars/71',
    city: 'Timóteo',
    name: 'Novo nome',
  });
});

test('changes the avatar without discarding the remaining profile metadata', () => {
  const metadata = mergeUserMetadata(
    { name: 'Abner', city: 'Timóteo' },
    { avatar_url: '/avatars/100' },
  );
  assert.deepEqual(metadata, {
    name: 'Abner',
    city: 'Timóteo',
    avatar_url: '/avatars/100',
  });
});
