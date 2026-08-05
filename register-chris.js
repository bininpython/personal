require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createChris() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Registering CHRIS...");
  
  const { data, error } = await supabase.auth.signUp({
    email: 'trainer_ptchris@example.com',
    password: 'senha123',
    options: {
      data: {
        name: 'Chris',
        code: 'PT-CHRIS'
      }
    }
  });

  if (error) {
    console.error("Error creating auth user:", error.message);
  } else {
    console.log("User created successfully in Auth:", data.user?.id);
    
    // We also need to insert into the trainers table
    const { error: insertError } = await supabase.from('trainers').insert({
      id: data.user.id,
      full_name: 'Chris',
      trainer_code: 'PT-CHRIS',
      password_hash: 'senha123', // Just a placeholder, login uses Auth anyway for Supabase
      professional_name: 'Chris Personal',
      cref: '000000-G/SP',
      status: 'active'
    });

    if (insertError) {
      console.error("Error inserting into trainers table:", insertError.message);
    } else {
      console.log("Trainer profile created successfully in trainers table!");
    }
  }
}

createChris();
