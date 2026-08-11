export const ACTIVATION_SHARE_KEY = 'dkong-activation-code-shared-v1';
export const ACTIVATION_SHARE_EVENT = 'dkong:access-shared';

export function markAccessShared() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVATION_SHARE_KEY, 'true');
  window.dispatchEvent(new Event(ACTIVATION_SHARE_EVENT));
}

export function hasSharedAccess() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ACTIVATION_SHARE_KEY) === 'true';
}
