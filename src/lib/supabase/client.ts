import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[FitControl] Supabase client: Missing environment variables. Falling back to demo mode.');
  }

  // createBrowserClient uses a singleton pattern natively so we can call it freely in client components
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
