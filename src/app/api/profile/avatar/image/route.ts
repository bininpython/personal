import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePrivateAvatar } from '@/lib/profile/private-avatar';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  const requestedId = new URL(request.url).searchParams.get('user') || session.sub;
  const admin = createAdminClient();

  let avatarUrl: string | null = null;
  if (requestedId === session.sub) {
    const table = session.role === 'trainer' ? 'trainers' : session.role === 'student' ? 'students' : 'individual_users';
    const { data } = await admin.from(table).select('avatar_url').eq('id', requestedId).maybeSingle();
    avatarUrl = data?.avatar_url || null;
  } else if (session.role === 'trainer') {
    const { data } = await admin
      .from('students')
      .select('avatar_url')
      .eq('id', requestedId)
      .eq('trainer_id', session.trainer_id)
      .maybeSingle();
    avatarUrl = data?.avatar_url || null;
  }

  const privateAvatar = parsePrivateAvatar(avatarUrl);
  if (!privateAvatar) return new Response(null, { status: 404 });
  const { data: file, error } = await admin.storage
    .from(privateAvatar.bucket)
    .download(privateAvatar.path);
  if (error || !file) return new Response(null, { status: 404 });

  return new Response(await file.arrayBuffer(), {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
