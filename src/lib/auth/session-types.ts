export type SessionRole = 'trainer' | 'student';
export const SESSION_COOKIE_NAME = 'fitcontrol_session';

export interface AuthSession {
  sub: string;
  session_id: string;
  role: SessionRole;
  name: string;
  trainer_id: string;
  avatar_url?: string;
  onboarding_complete?: boolean;
}

export function canAccessStudentFeatures(session: AuthSession) {
  return session.role !== 'student' || session.onboarding_complete === true;
}
