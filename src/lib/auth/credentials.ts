const INTERNAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const ACCESS_CODE_LENGTH = 6;

export function normalizeAuthCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function randomDigits(length: number) {
  const result: string[] = [];
  const values = new Uint8Array(length);
  const unbiasedLimit = 250;

  while (result.length < length) {
    crypto.getRandomValues(values);
    for (const value of values) {
      if (value >= unbiasedLimit) continue;
      result.push(String(value % 10));
      if (result.length === length) break;
    }
  }

  return result.join('');
}

function randomInternalCharacters(length: number) {
  const result: string[] = [];
  const values = new Uint8Array(length);
  const unbiasedLimit = Math.floor(256 / INTERNAL_CODE_ALPHABET.length) * INTERNAL_CODE_ALPHABET.length;

  while (result.length < length) {
    crypto.getRandomValues(values);
    for (const value of values) {
      if (value >= unbiasedLimit) continue;
      result.push(INTERNAL_CODE_ALPHABET[value % INTERNAL_CODE_ALPHABET.length]);
      if (result.length === length) break;
    }
  }

  return result.join('');
}

function generateAccessCode() {
  const digits = randomDigits(ACCESS_CODE_LENGTH);
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

export function formatAccessCodeInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, ACCESS_CODE_LENGTH);
  return digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
}

export function generateTrainerPrivateCode() {
  return generateAccessCode();
}

export function generateStudentPrivateCode() {
  return generateAccessCode();
}

export function generateIndividualPrivateCode() {
  return generateAccessCode();
}

// Mantido apenas como identificador interno para compatibilidade com contas
// anteriores. Este valor nunca é exibido como uma credencial ao usuário.
export function generateTrainerPublicCode() {
  return `DK-${randomInternalCharacters(8)}`;
}

export function getCodeHint(code: string) {
  const normalized = normalizeAuthCode(code).toUpperCase();
  return normalized.length <= 2
    ? '•'.repeat(normalized.length)
    : `${'•'.repeat(normalized.length - 2)}${normalized.slice(-2)}`;
}
