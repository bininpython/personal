export type AccountRole = 'trainer' | 'student';

const MIN_NORMALIZED_CODE_LENGTH = 4;
const MAX_NUMERIC_CODE_LENGTH = 8;

export function normalizeAuthCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function canonicalizeStudentAccessCode(value: string): string {
  return value.trim();
}

export function generateNumericAccessCode(length: number): string {
  if (!Number.isInteger(length) || length < 1 || length > MAX_NUMERIC_CODE_LENGTH) {
    throw new Error('Tamanho de código inválido.');
  }

  const codeSpace = 10 ** length;
  const randomRange = 2 ** 32;
  const unbiasedLimit = Math.floor(randomRange / codeSpace) * codeSpace;
  const randomValue = new Uint32Array(1);

  do {
    crypto.getRandomValues(randomValue);
  } while (randomValue[0] >= unbiasedLimit);

  return String(randomValue[0] % codeSpace).padStart(length, '0');
}

export function buildSyntheticEmail(role: AccountRole, code: string): string {
  const normalizedCode = normalizeAuthCode(code);

  if (normalizedCode.length < MIN_NORMALIZED_CODE_LENGTH) {
    throw new Error('Código de acesso inválido.');
  }

  return `${role}_${normalizedCode}@example.com`;
}

export function buildStudentAuthPassword(code: string): string {
  const canonicalCode = canonicalizeStudentAccessCode(code);

  if (!/^\d{4}$/.test(canonicalCode)) {
    throw new Error('Código de acesso do aluno inválido.');
  }

  return `FitAluno!${canonicalCode}#`;
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
