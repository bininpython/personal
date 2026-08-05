import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createChris() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@test.com',
    password: 'password123',
  });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data.user);
  }
}

createChris().catch(console.error);
