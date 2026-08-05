const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Aa980271500%40@db.ozhcruzkrfldqylitgbr.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(`SELECT id, email, confirmed_at FROM auth.users`);
    console.log('Users:', res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
