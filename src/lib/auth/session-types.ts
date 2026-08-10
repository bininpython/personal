export type SessionRole = 'trainer' | 'student';
export const SESSION_COOKIE_NAME = 'fitcontrol_session';

export interface AuthSession {
  sub: string;
  session_id: string;
  role: SessionRole;
  name: string;
  trainer_id: string;
  avatar_url?: string;
}
