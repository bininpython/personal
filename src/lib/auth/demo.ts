export const DEMO_IDS = {
  TRAINER: '11111111-1111-1111-1111-111111111111',
  INDIVIDUAL: '22222222-2222-2222-2222-222222222222',
  STUDENT: '33333333-3333-3333-3333-333333333333',
} as const;

export const DEMO_IDS_ARRAY = Object.values(DEMO_IDS);

export function isDemoUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return DEMO_IDS_ARRAY.includes(userId as any);
}

