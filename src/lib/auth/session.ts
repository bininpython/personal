// ============================================
// FitControl Pro — Session Management
// ============================================

import { verifyToken, type TokenPayload } from './jwt';
import { createClient } from '@/lib/supabase/server';

const SESSION_COOKIE_NAME = 'fitcontrol-session';

export async function setSessionCookie(token: string, rememberMe: boolean = false) {
  // Controlled by Supabase SSR now
}

export async function getSession(): Promise<TokenPayload | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const role = (user.user_metadata?.role as 'trainer' | 'student') || 'trainer';
        let trainerId = '';

        if (role === 'trainer') {
          // Look up the real trainers.id (PK) from the trainers table
          const { data: trainerData } = await supabase
            .from('trainers')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

          trainerId = trainerData?.id || user.id;
        } else {
          // For students, fetch the trainer_id from the students table
          const { data: studentData } = await supabase
            .from('students')
            .select('trainer_id')
            .eq('mock_email', user.email)
            .single();

          trainerId = studentData?.trainer_id || '';
        }

        return {
          sub: user.id,
          role,
          name: user.user_metadata?.name || '',
          trainer_id: trainerId,
        };
      }
      return null;
    }
  } catch (error) {
    console.error('Session error:', error);
  }
  return null;
}

export async function clearSession() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
}

export async function getSessionToken(): Promise<string | null> {
  return null;
}
