import 'server-only';

import { createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { SESSION_EXPIRY_DAYS } from '@/constants';
import { createSessionToken, verifyToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE_NAME, type AuthSession, type SessionRole } from '@/lib/auth/session-types';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPrivateAvatar } from '@/lib/profile/private-avatar';

export type { AuthSession, SessionRole } from '@/lib/auth/session-types';

export { SESSION_COOKIE_NAME } from '@/lib/auth/session-types';

function displayedAvatar(value: string | null | undefined, actorId: string) {
  if (!value) return undefined;
  return isPrivateAvatar(value)
    ? `/api/profile/avatar/image?user=${encodeURIComponent(actorId)}`
    : value;
}

export async function createSession(input: {
  actorId: string;
  role: SessionRole;
  trainerId: string;
  request?: Request;
  remember?: boolean;
}) {
  const admin = createAdminClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.remember ? 30 : SESSION_EXPIRY_DAYS));

  const forwardedFor = input.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const rawIp = forwardedFor || input.request?.headers.get('x-real-ip') || 'unknown';
  const ipPepper = process.env.RATE_LIMIT_SECRET
    || process.env.SESSION_SECRET
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || 'local-development-session-pepper';
  const encodedIpHash = createHmac('sha256', ipPepper).update(rawIp).digest('hex');
  const userAgent = input.request?.headers.get('user-agent')?.slice(0, 500) || null;

  const { data: row, error } = await admin
    .from('app_sessions')
    .insert({
      actor_id: input.actorId,
      role: input.role,
      trainer_id: input.trainerId,
      expires_at: expiresAt.toISOString(),
      ip_hash: encodedIpHash,
      user_agent: userAgent,
    })
    .select('id')
    .single();

  if (error || !row) throw error || new Error('Não foi possível criar a sessão.');

  const token = await createSessionToken({
    id: row.id,
    actorId: input.actorId,
    role: input.role,
    trainerId: input.trainerId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
    priority: 'high',
  });

  return row.id as string;
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;

    const admin = createAdminClient();
    const { data: databaseSession, error: sessionError } = await admin
      .from('app_sessions')
      .select('id, actor_id, role, trainer_id, expires_at, revoked_at')
      .eq('id', payload.sid)
      .eq('actor_id', payload.sub)
      .eq('role', payload.role)
      .maybeSingle();

    if (
      sessionError
      || !databaseSession
      || databaseSession.revoked_at
      || new Date(databaseSession.expires_at) <= new Date()
    ) return null;

    if (payload.role === 'trainer') {
      const { data: trainer } = await admin
        .from('trainers')
        .select('id, name, avatar_url, deleted_at')
        .eq('id', payload.sub)
        .maybeSingle();
      if (!trainer || trainer.deleted_at) return null;

      return {
        sub: trainer.id,
        session_id: payload.sid,
        role: 'trainer',
        name: trainer.name,
        trainer_id: trainer.id,
        avatar_url: displayedAvatar(trainer.avatar_url, trainer.id),
      };
    }

    const { data: student } = await admin
      .from('students')
      .select('id, trainer_id, name, status, avatar_url, deleted_at')
      .eq('id', payload.sub)
      .maybeSingle();
    if (!student || student.status !== 'active' || student.deleted_at) return null;

    return {
      sub: student.id,
      session_id: payload.sid,
      role: 'student',
      name: student.name,
      trainer_id: student.trainer_id,
      avatar_url: displayedAvatar(student.avatar_url, student.id),
    };
  } catch (error) {
    console.error('[Auth] Failed to resolve session:', error);
    return null;
  }
}

export async function revokeActorSessions(actorId: string, role: SessionRole) {
  const admin = createAdminClient();
  await admin
    .from('app_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('actor_id', actorId)
    .eq('role', role)
    .is('revoked_at', null);
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (payload) {
    const admin = createAdminClient();
    await admin
      .from('app_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', payload.sid);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
