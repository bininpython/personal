import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ozhcruzkrfldqylitgbr.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96aGNydXprcmZsZHF5bGl0Z2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Njg4MDgsImV4cCI6MjEwMTQ0NDgwOH0.JWYGMhbBfMmWlkk9UbwXujXghgrznjrcGeyS_yyKzyc';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[FitControl] Supabase server: Missing environment variables.');
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
