import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePrivateBackground } from '@/lib/profile/private-background';

export async function GET() {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });

  const admin = createAdminClient();
  const table = session.role === 'trainer' ? 'trainers' : session.role === 'student' ? 'students' : 'individual_users';
  const { data } = await admin.from(table).select('background_url').eq('id', session.sub).maybeSingle();

  const privateBackground = parsePrivateBackground(data?.background_url);
  if (!privateBackground) return new Response(null, { status: 404 });
  const { data: file, error } = await admin.storage
    .from(privateBackground.bucket)
    .download(privateBackground.path);
  if (error || !file) return new Response(null, { status: 404 });

  return new Response(await file.arrayBuffer(), {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
