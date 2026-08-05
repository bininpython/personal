import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getAdminSupabaseConfig } from './config';

export function createAdminClient() {
  const { url, key } = getAdminSupabaseConfig();

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
