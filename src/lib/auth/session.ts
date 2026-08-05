import { createClient } from '@/lib/supabase/server';

export type SessionRole = 'trainer' | 'student';

export interface AuthSession {
  sub: string;
  role: SessionRole;
  name: string;
  trainer_id: string;
  trainer_code?: string;
  avatar_url?: string;
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data: trainer } = await supabase
      .from('trainers')
      .select('id, name, code')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (trainer) {
      return {
        sub: user.id,
        role: 'trainer',
        name: trainer.name,
        trainer_id: trainer.id,
        trainer_code: trainer.code,
        avatar_url: typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : undefined,
      };
    }

    const { data: student } = await supabase
      .from('students')
      .select('id, trainer_id, name, status')
      .eq('id', user.id)
      .maybeSingle();

    if (!student || student.status !== 'active') return null;

    return {
      sub: student.id,
      role: 'student',
      name: student.name,
      trainer_id: student.trainer_id,
      avatar_url: typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : undefined,
    };
  } catch (error) {
    console.error('[Auth] Failed to resolve session:', error);
    return null;
  }
}

export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
