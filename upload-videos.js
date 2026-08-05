const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Aa980271500%40@db.ozhcruzkrfldqylitgbr.supabase.co:5432/postgres';
const supabaseUrl = 'https://ozhcruzkrfldqylitgbr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96aGNydXprcmZsZHF5bGl0Z2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4Njg4MDgsImV4cCI6MjEwMTQ0NDgwOH0.JWYGMhbBfMmWlkk9UbwXujXghgrznjrcGeyS_yyKzyc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('Connected to DB. Creating bucket...');
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('exercises', 'exercises', true) 
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('Configuring RLS for storage.objects...');
    try {
      await client.query(`
        CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'exercises');
      `);
    } catch (e) { console.log('Policy insert may already exist'); }
    try {
      await client.query(`
        CREATE POLICY "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'exercises');
      `);
    } catch (e) { console.log('Policy select may already exist'); }
    try {
      await client.query(`
        CREATE POLICY "Allow public update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'exercises');
      `);
    } catch (e) { console.log('Policy update may already exist'); }

    // Upload videos
    const videosPath = 'C:\\Users\\abner\\OneDrive\\Desktop\\personal\\PEITO';
    const files = fs.readdirSync(videosPath).filter(f => f.endsWith('.mp4'));
    
    for (const file of files) {
      console.log(`Uploading ${file}...`);
      const filePath = path.join(videosPath, file);
      const fileBuffer = fs.readFileSync(filePath);
      
      const { data, error } = await supabase.storage.from('exercises').upload(file, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

      if (error) {
        console.error('Error uploading:', file, error);
        continue;
      }

      const { data: publicData } = supabase.storage.from('exercises').getPublicUrl(file);
      const publicUrl = publicData.publicUrl;
      console.log(`Uploaded ${file} -> ${publicUrl}`);

      // Map file name to exercise name
      let exerciseName = file.replace('.mp4', '').trim();
      
      // Attempt to update existing exercise or insert if not exists?
      // Wait, let's just insert them if they don't exist, or update if they do.
      console.log(`Updating DB for ${exerciseName}...`);
      const res = await client.query(`UPDATE exercises SET video_url = $1 WHERE name ILIKE $2 RETURNING id`, [publicUrl, `%${exerciseName}%`]);
      if (res.rowCount === 0) {
        console.log(`Exercise ${exerciseName} not found in DB. Inserting...`);
        await client.query(`
          INSERT INTO exercises (name, target_muscle, video_url) 
          VALUES ($1, 'chest', $2)
        `, [exerciseName, publicUrl]);
      } else {
        console.log(`Updated existing exercise ${exerciseName}.`);
      }
    }
    console.log('All done!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
