export interface PrivateBackgroundReference {
  bucket: 'background-images-private';
  path: string;
}

export function parsePrivateBackground(value: string | null | undefined): PrivateBackgroundReference | null {
  if (value?.startsWith('private:')) {
    return { bucket: 'background-images-private', path: value.slice('private:'.length) };
  }
  return null;
}

export function isPrivateBackground(value: string | null | undefined) {
  return parsePrivateBackground(value) !== null;
}
