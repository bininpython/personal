export function storedAvatarUrl(metadata: Record<string, unknown> | null | undefined) {
  return typeof metadata?.avatar_url === 'string' ? metadata.avatar_url : '';
}

export function mergeUserMetadata(
  current: Record<string, unknown> | null | undefined,
  updates: Record<string, unknown>,
) {
  return { ...(current ?? {}), ...updates };
}
