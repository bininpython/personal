const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeAuthCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function randomCharacters(length: number) {
  const result: string[] = [];
  const values = new Uint8Array(length);
  const unbiasedLimit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;

  while (result.length < length) {
    crypto.getRandomValues(values);
    for (const value of values) {
      if (value >= unbiasedLimit) continue;
      result.push(CODE_ALPHABET[value % CODE_ALPHABET.length]);
      if (result.length === length) break;
    }
  }

  return result.join('');
}

function groupCode(value: string, groupSize = 4) {
  return value.match(new RegExp(`.{1,${groupSize}}`, 'g'))?.join('-') ?? value;
}

export function generateTrainerPrivateCode() {
  return groupCode(randomCharacters(16));
}

export function generateTrainerPublicCode() {
  return `FC-${randomCharacters(8)}`;
}

export function generateStudentPrivateCode() {
  return groupCode(randomCharacters(12));
}

export function generateRecoveryCode() {
  return groupCode(randomCharacters(24));
}

export function getCodeHint(code: string) {
  const normalized = normalizeAuthCode(code).toUpperCase();
  return normalized.length <= 4
    ? '•'.repeat(normalized.length)
    : `${'•'.repeat(normalized.length - 4)}${normalized.slice(-4)}`;
}
