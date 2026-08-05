/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY
  || process.env.SUPABASE_SERVICE_ROLE_KEY;
const videosPath = process.env.EXERCISE_VIDEOS_PATH
  || path.resolve(__dirname, '..', 'PEITO');

if (!connectionString || !supabaseUrl || !supabaseKey) {
  throw new Error(
    'Configure DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY antes de enviar vídeos.',
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      insert into storage.buckets (id, name, public)
      values ('exercises', 'exercises', true)
      on conflict (id) do update set public = true;
    `);

    await client.query(`
      drop policy if exists "Allow public uploads" on storage.objects;
      drop policy if exists "Allow public update" on storage.objects;
      drop policy if exists "Allow public read" on storage.objects;
      create policy "Allow public read"
      on storage.objects for select
      to public
      using (bucket_id = 'exercises');
    `);

    const files = fs.readdirSync(videosPath).filter((file) => file.endsWith('.mp4'));

    for (const file of files) {
      const filePath = path.join(videosPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      const { error } = await supabase.storage.from('exercises').upload(file, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

      if (error) {
        console.error('Erro ao enviar:', file, error.message);
        continue;
      }

      const { data: publicData } = supabase.storage.from('exercises').getPublicUrl(file);
      const exerciseName = file.replace('.mp4', '').trim();
      const result = await client.query(
        'update exercises set video_url = $1 where name ilike $2 returning id',
        [publicData.publicUrl, `%${exerciseName}%`],
      );

      if (result.rowCount === 0) {
        await client.query(
          'insert into exercises (name, target_muscle, video_url) values ($1, $2, $3)',
          [exerciseName, 'chest', publicData.publicUrl],
        );
      }
    }
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
