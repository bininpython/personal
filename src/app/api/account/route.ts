import { z } from 'zod';
import { clearSession, getSession } from '@/lib/auth/session';
import { normalizeName } from '@/lib/auth/hash';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePrivateAvatar, type PrivateAvatarReference } from '@/lib/profile/private-avatar';

const deleteSchema = z.object({ confirmation: z.string().trim().min(2).max(160) }).strict();

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success || normalizeName(parsed.data.confirmation) !== normalizeName(session.name)) {
    return Response.json({ error: 'Digite seu nome exatamente para confirmar.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const legacyAuthIds: string[] = [];
    const avatarReferences: PrivateAvatarReference[] = [];

    if (session.role === 'trainer') {
      const { data: trainer } = await admin.from('trainers').select('auth_user_id, avatar_url').eq('id', session.sub).single();
      const { data: students } = await admin.from('students').select('id, avatar_url').eq('trainer_id', session.trainer_id);
      if (trainer?.auth_user_id) legacyAuthIds.push(trainer.auth_user_id);
      const trainerAvatar = parsePrivateAvatar(trainer?.avatar_url);
      if (trainerAvatar) avatarReferences.push(trainerAvatar);
      for (const student of students ?? []) {
        legacyAuthIds.push(student.id);
        const avatar = parsePrivateAvatar(student.avatar_url);
        if (avatar) avatarReferences.push(avatar);
      }
      const actorIds = [session.sub, ...(students ?? []).map((student) => student.id)];
      await admin.from('product_tutorial_progress').delete().in('actor_id', actorIds);
      await admin.from('messages').delete().or(`sender_id.in.(${actorIds.join(',')}),recipient_id.in.(${actorIds.join(',')})`);
      const { error } = await admin.from('trainers').delete().eq('id', session.sub);
      if (error) throw error;
      await admin.from('app_sessions').delete().in('actor_id', actorIds);
    } else if (session.role === 'student') {
      const { data: student } = await admin.from('students').select('id, avatar_url').eq('id', session.sub).single();
      const avatar = parsePrivateAvatar(student?.avatar_url);
      if (avatar) avatarReferences.push(avatar);
      legacyAuthIds.push(session.sub);
      await admin.from('product_tutorial_progress').delete().eq('actor_id', session.sub);
      await admin.from('messages').delete().or(`sender_id.eq.${session.sub},recipient_id.eq.${session.sub}`);
      const { error } = await admin.from('students').delete().eq('id', session.sub);
      if (error) throw error;
      await admin.from('app_sessions').delete().eq('actor_id', session.sub);
    } else {
      const { data: individual } = await admin.from('individual_users').select('avatar_url').eq('id', session.sub).single();
      const avatar = parsePrivateAvatar(individual?.avatar_url);
      if (avatar) avatarReferences.push(avatar);
      await admin.from('product_tutorial_progress').delete().eq('actor_id', session.sub);
      const { error } = await admin.from('individual_users').delete().eq('id', session.sub);
      if (error) throw error;
      await admin.from('app_sessions').delete().eq('actor_id', session.sub);
    }

    for (const bucket of ['profile-images-private', 'profile-images'] as const) {
      const paths = avatarReferences.filter((avatar) => avatar.bucket === bucket).map((avatar) => avatar.path);
      if (paths.length) await admin.storage.from(bucket).remove(paths);
    }
    for (const authId of [...new Set(legacyAuthIds)]) {
      await admin.auth.admin.deleteUser(authId).catch(() => undefined);
    }
    await clearSession();
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Account Delete] Error:', error);
    return Response.json({ error: 'Não foi possível excluir a conta.' }, { status: 500 });
  }
}
