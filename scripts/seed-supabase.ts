import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Starting Supabase Database Seed...');
  
  // Create Demo Trainer Auth Account
  console.log('Creating demo trainer...');
  const trainerEmail = `trainer_demo@example.com`;
  const { data: trainerAuth, error: trainerAuthError } = await supabase.auth.admin.createUser({
    email: trainerEmail,
    password: 'password123',
    email_confirm: true,
    user_metadata: { name: 'João Silva', role: 'trainer', code: 'JOAO123' }
  });

  if (trainerAuthError && trainerAuthError.status !== 422) { // 422 usually means user already exists
     console.error('Error creating trainer auth:', trainerAuthError);
  } else if (trainerAuth?.user) {
    const { error: trainerInsertError } = await supabase.from('trainers').upsert({
      auth_user_id: trainerAuth.user.id,
      name: 'João Silva',
      code: 'JOAO123',
    });
    if (trainerInsertError) console.error('Error inserting trainer:', trainerInsertError);
    else console.log('✅ Demo Trainer created!');
  }

  // Create Demo Exercises
  console.log('Inserting default exercises...');
  const exercises = [
    { name: 'Supino Reto', category: 'Peito', target_muscle: 'Peitoral Maior', equipment: 'Barra', difficulty: 'intermediate' },
    { name: 'Agachamento Livre', category: 'Pernas', target_muscle: 'Quadríceps', equipment: 'Barra', difficulty: 'advanced' },
    { name: 'Puxada Frontal', category: 'Costas', target_muscle: 'Latíssimo do Dorso', equipment: 'Máquina', difficulty: 'beginner' },
    { name: 'Desenvolvimento', category: 'Ombros', target_muscle: 'Deltóides', equipment: 'Halteres', difficulty: 'intermediate' },
    { name: 'Rosca Direta', category: 'Braços', target_muscle: 'Bíceps', equipment: 'Barra W', difficulty: 'beginner' }
  ];

  const { error: exercisesError } = await supabase.from('exercises').upsert(
    exercises.map(ex => ({ ...ex, description: 'Exercício padrão do sistema', video_url: '' })),
    { onConflict: 'name' }
  );

  if (exercisesError) {
    console.error('Error inserting exercises:', exercisesError);
  } else {
    console.log(`✅ Inserted ${exercises.length} exercises!`);
  }

  console.log('Seed completed.');
}

seed().catch(console.error);
