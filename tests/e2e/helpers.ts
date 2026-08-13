import { SignJWT } from 'jose';
import type { BrowserContext } from '@playwright/test';
import { PRODUCT_TUTORIAL_VERSION, productTutorialStorageKey } from '../../src/lib/product-tutorial';

const secret = process.env.SESSION_SECRET || 'fitcontrol-e2e-session-secret-32-characters-minimum';

export async function setOptimisticSession(
  context: BrowserContext,
  role: 'trainer' | 'student',
  actorId: string,
  trainerId = actorId,
) {
  const tutorialKey = productTutorialStorageKey(role, actorId);
  await context.addInitScript(({ key, version }) => {
    window.localStorage.setItem(key, JSON.stringify({
      version,
      status: 'completed',
      updatedAt: '2026-08-12T12:00:00.000Z',
    }));
  }, { key: tutorialKey, version: PRODUCT_TUTORIAL_VERSION });

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
