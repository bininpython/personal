import { z } from 'zod';
import { hashPassword, verifyPassword } from '@/lib/auth/hash';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { getSession, revokeActorSessions, createSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  current_password: z.string().min(8).max(72),
  new_password: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres').max(72),
}).strict();

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'individual') return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Revise as senhas informadas.' }, { status: 400 });

    const limit = await consumeRateLimit({ request, scope: 'individual-password', identifier: session.sub, maxAttempts: 5, windowSeconds: 900, blockSeconds: 900 });
    if (!limit.allowed) return Response.json({ error: 'Muitas tentativas. Aguarde e tente novamente.' }, { status: 429 });

    const admin = createAdminClient();
    const { data: user, error } = await admin.from('individual_users').select('password_hash').eq('id', session.sub).single();
    if (error || !user) throw error || new Error('Conta não encontrada.');
    if (!await verifyPassword(parsed.data.current_password, user.password_hash)) {
      return Response.json({ error: 'A senha atual está incorreta.' }, { status: 401 });
    }

    const { error: updateError } = await admin.from('individual_users').update({
      password_hash: await hashPassword(parsed.data.new_password),
      updated_at: new Date().toISOString(),
    }).eq('id', session.sub);
    if (updateError) throw updateError;

    await revokeActorSessions(session.sub, 'individual');
    await createSession({ actorId: session.sub, role: 'individual', trainerId: session.sub, request });
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Individual Password] Error:', error);
    return Response.json({ error: 'Não foi possível alterar a senha.' }, { status: 500 });
  }
}
