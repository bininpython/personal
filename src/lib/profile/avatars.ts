export const AVATAR_COUNT = 50;

export const AVATAR_OPTIONS = Array.from({ length: AVATAR_COUNT }, (_, index) => {
  const id = String(index + 1).padStart(2, '0');
  return {
    id,
    url: `/avatars/${id}`,
    label: `Avatar ${index + 1}`,
  };
});

export function isAvatarOption(value: string) {
  return AVATAR_OPTIONS.some((avatar) => avatar.url === value);
}
