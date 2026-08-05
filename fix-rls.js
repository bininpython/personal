const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Aa980271500%40@db.ozhcruzkrfldqylitgbr.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log('Adding RLS policy to exercises table...');
    await client.query(`
      CREATE POLICY "Allow public read on exercises" ON public.exercises FOR SELECT USING (true);
    `);
    console.log('Policy added.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
