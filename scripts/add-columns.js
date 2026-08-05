const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Aa980271500%40@db.ozhcruzkrfldqylitgbr.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log('Adding missing columns to students table...');
    
    // Add gender column
    await client.query(`
      ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender text DEFAULT 'other';
    `);
    console.log('✓ gender column added');

    // Add restrictions column
    await client.query(`
      ALTER TABLE public.students ADD COLUMN IF NOT EXISTS restrictions text;
    `);
    console.log('✓ restrictions column added');

    // Verify columns
    const res = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'students' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    console.log('\nStudents table columns:');
    res.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
