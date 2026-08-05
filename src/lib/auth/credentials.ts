export type AccountRole = 'trainer' | 'student';

const MIN_NORMALIZED_CODE_LENGTH = 4;

export function normalizeAuthCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function canonicalizeStudentAccessCode(value: string): string {
  return normalizeAuthCode(value).toUpperCase();
}

export function buildSyntheticEmail(role: AccountRole, code: string): string {
  const normalizedCode = normalizeAuthCode(code);

  if (normalizedCode.length < MIN_NORMALIZED_CODE_LENGTH) {
    throw new Error('Código de acesso inválido.');
  }

  return `${role}_${normalizedCode}@example.com`;
}

export function isDuplicateAccountError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  return error.code === 'email_exists'
    || error.code === 'user_already_exists'
    || message.includes('already registered')
    || message.includes('already been registered')
    || message.includes('duplicate');
}
