const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Aa980271500%40@db.ozhcruzkrfldqylitgbr.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log('Inserting into auth.users...');
    const authRes = await client.query(`
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'trainer_123chris@example.com',
        crypt('senha123', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Chris", "code": "#123-CHRIS", "role": "trainer"}',
        now(),
        now(),
        '', '', '', ''
      ) RETURNING id;
    `);

    const authUserId = authRes.rows[0].id;
    console.log('Auth User ID:', authUserId);

    console.log('Inserting into public.trainers...');
    await client.query(`
      INSERT INTO public.trainers (auth_user_id, name, code)
      VALUES ($1, 'Chris', '#123-CHRIS')
      ON CONFLICT (code) DO NOTHING;
    `, [authUserId]);

    console.log('Trainer inserted successfully!');

    console.log('Verifying auth.users...');
    const users = await client.query('SELECT email FROM auth.users');
    console.log(users.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
