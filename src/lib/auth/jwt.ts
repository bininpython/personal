// ============================================
// FitControl Pro — JWT Token Management
// ============================================

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { UserRole } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fitcontrol-pro-dev-secret-key-change-in-production'
);

const JWT_ISSUER = 'fitcontrol-pro';
const JWT_AUDIENCE = 'fitcontrol-pro-app';

export interface TokenPayload extends JWTPayload {
  sub: string;
  role: UserRole;
  trainer_id: string;
  name: string;
  avatar_url?: string;
}

/**
 * Create a signed JWT for a trainer
 */
export async function createTrainerToken(trainer: {
  id: string;
  full_name: string;
  avatar_url?: string;
}, expiresInDays: number = 7): Promise<string> {
  const payload: TokenPayload = {
    sub: trainer.id,
    role: 'trainer',
    trainer_id: trainer.id,
    name: trainer.full_name,
    avatar_url: trainer.avatar_url || undefined,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${expiresInDays}d`)
    .sign(JWT_SECRET);
}

/**
 * Create a signed JWT for a student
 */
export async function createStudentToken(student: {
  id: string;
  trainer_id: string;
  full_name: string;
  avatar_url?: string;
}, expiresInDays: number = 7): Promise<string> {
  const payload: TokenPayload = {
    sub: student.id,
    role: 'student',
    trainer_id: student.trainer_id,
    name: student.full_name,
    avatar_url: student.avatar_url || undefined,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${expiresInDays}d`)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as TokenPayload;
  } catch {
    return null;
  }
}
