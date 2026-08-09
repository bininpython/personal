import { SignJWT } from 'jose';
import type { BrowserContext } from '@playwright/test';

const secret = process.env.SESSION_SECRET || 'fitcontrol-e2e-session-secret-32-characters-minimum';

export async function setOptimisticSession(
  context: BrowserContext,
  role: 'trainer' | 'student',
  actorId: string,
  trainerId = actorId,
) {
  const sessionId = crypto.randomUUID();
  const token = await new SignJWT({ sid: sessionId, role, trainer_id: trainerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(actorId)
    .setIssuedAt()
    .setJti(sessionId)
    .setIssuer('fitcontrol-pro')
    .setAudience('fitcontrol-pro-app')
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));
  await context.addCookies([{
    name: 'fitcontrol_session',
    value: token,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: false,
  }]);
}
