// ============================================
// FitControl Pro — JWT Token Management
// ============================================

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { SessionRole } from '@/lib/auth/session-types';

const JWT_ISSUER = 'fitcontrol-pro';
const JWT_AUDIENCE = 'fitcontrol-pro-app';

export interface TokenPayload extends JWTPayload {
  sub: string;
  sid: string;
  role: SessionRole;
  trainer_id: string;
}

function signingKey() {
  const secret = process.env.SESSION_SECRET
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || secret.length < 32) {
    throw new Error('Configure SESSION_SECRET com pelo menos 32 caracteres.');
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: {
  id: string;
  actorId: string;
  role: SessionRole;
  trainerId: string;
  expiresAt: Date;
}): Promise<string> {
  const payload: TokenPayload = {
    sub: session.actorId,
    sid: session.id,
    role: session.role,
    trainer_id: session.trainerId,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setJti(session.id)
    .setExpirationTime(Math.floor(session.expiresAt.getTime() / 1000))
    .sign(signingKey());
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ['HS256'],
    });
    if (
      typeof payload.sub !== 'string'
      || typeof payload.sid !== 'string'
      || (payload.role !== 'trainer' && payload.role !== 'student')
      || typeof payload.trainer_id !== 'string'
    ) return null;

    return payload as TokenPayload;
  } catch {
    return null;
  }
}
