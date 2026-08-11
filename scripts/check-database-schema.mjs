import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('FALHA: configure a URL e a chave secreta do Supabase para verificar o banco.');
  process.exitCode = 1;
} else {
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const checks = [
    ['trainers', 'id, login_name_normalized, access_code_hash, recovery_password_hash, terms_accepted_at, privacy_policy_version, deleted_at'],
    ['students', 'id, trainer_id, login_name_normalized, access_code_hash, privacy_consent_at, terms_accepted_at, trainer_privacy_attested_at, trainer_privacy_attested_by, trainer_privacy_policy_version, deleted_at'],
    ['app_sessions', 'id, actor_id, role, trainer_id, expires_at, revoked_at'],
    ['auth_rate_limits', 'key_hash, attempts, window_started_at, blocked_until'],
    ['workout_plans', 'id, student_id, trainer_id, end_date'],
    ['workout_sessions', 'id, student_id, client_session_id, completed_at'],
    ['exercise_sessions', 'id, workout_session_id, workout_exercise_id'],
    ['set_records', 'id, exercise_session_id, set_number'],
    ['messages', 'id, sender_id, recipient_id, created_at'],
    ['notifications', 'id, user_id, user_type, created_at'],
    ['appointments', 'id, trainer_id, student_id, start_time'],
    ['individual_users', 'id, name, email_normalized, password_hash, goal, level, terms_accepted_at, deleted_at'],
    ['individual_workout_plans', 'id, user_id, name, status, start_date, end_date'],
    ['individual_workout_days', 'id, plan_id, name, day_label, order_index'],
    ['individual_workout_exercises', 'id, workout_day_id, exercise_key, name, video_url, sets, reps, rest_time'],
  ];

  let failed = false;
  for (const [table, columns] of checks) {
    const { error } = await admin.from(table).select(columns, { head: true, count: 'exact' });
    if (error) {
      failed = true;
      console.error(`FALHA: estrutura pendente em ${table} (${error.code || 'erro do banco'}).`);
    } else {
      console.log(`OK: ${table}`);
    }
  }

  const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
  const privateBucket = buckets?.find((bucket) => bucket.name === 'profile-images-private');
  if (bucketError || !privateBucket || privateBucket.public) {
    failed = true;
    console.error('FALHA: o bucket profile-images-private não existe ou não está privado.');
  } else {
    console.log('OK: armazenamento privado de fotos');
  }

  if (failed) process.exitCode = 1;
  else console.log('Banco compatível com a versão atual da G KONG.');
}
