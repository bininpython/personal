// ============================================
// FitControl Pro — Password & Code Hashing
// ============================================

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password or access code using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password or access code against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random access code for students
 * Format: AL-XXXXXX (6 alphanumeric characters)
 */
export function generateAccessCode(prefix: string = 'AL-'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${code}`;
}

/**
 * Generate a trainer code
 * Format: #PRO-XXXXXX (6 alphanumeric characters)
 */
export function generateTrainerCode(): string {
  return generateAccessCode('#PRO-');
}

/**
 * Get a hint for the access code (show last 3 chars)
 * Example: AL-•••K9M → shows only the last 3 characters
 */
export function getCodeHint(code: string): string {
  if (code.length <= 3) return '•'.repeat(code.length);
  const prefix = code.includes('-') ? code.split('-')[0] + '-' : '';
  const rest = code.includes('-') ? code.split('-')[1] : code;
  const hidden = '•'.repeat(Math.max(0, rest.length - 3));
  const visible = rest.slice(-3);
  return `${prefix}${hidden}${visible}`;
}

/**
 * Normalize a name for comparison (lowercase, trim, remove accents, collapse spaces)
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}
