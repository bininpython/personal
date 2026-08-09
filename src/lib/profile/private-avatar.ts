export interface PrivateAvatarReference {
  bucket: 'profile-images-private' | 'profile-images';
  path: string;
}

export function parsePrivateAvatar(value: string | null | undefined): PrivateAvatarReference | null {
  if (value?.startsWith('private:')) {
    return { bucket: 'profile-images-private', path: value.slice('private:'.length) };
  }
  if (value?.startsWith('private-legacy:')) {
    return { bucket: 'profile-images', path: value.slice('private-legacy:'.length) };
  }
  return null;
}

export function isPrivateAvatar(value: string | null | undefined) {
  return parsePrivateAvatar(value) !== null;
}
