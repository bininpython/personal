import { NextResponse } from 'next/server';
import { trainerLoginSchema } from '@/lib/validators';
import { buildSyntheticEmail } from '@/lib/auth/credentials';
import { storedAvatarUrl } from '@/lib/profile/avatar-metadata';
import { createClient } from '@/lib/supabase/server';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const result = trainerLoginSchema.safeParse(await request.json());

    if (!result.success) {
      return json({ error: 'Revise o código e a senha informados.' }, 400);
    }

    const { trainer_code, password } = result.data;
    const email = buildSyntheticEmail('trainer', trainer_code);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return json({ error: 'Código ou senha inválidos.' }, 401);
    }

    const { data: trainer, error: profileError } = await supabase
      .from('trainers')
      .select('id, name')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    if (profileError || !trainer) {
      await supabase.auth.signOut();
      return json({ error: 'Esta conta não possui um perfil de personal válido.' }, 403);
    }

    return json({
      success: true,
      user: {
        id: data.user.id,
        role: 'trainer',
        name: trainer.name,
        trainer_id: trainer.id,
        avatar_url: storedAvatarUrl(data.user.user_metadata),
      },
    }, 200);
  } catch (error) {
    console.error('[Trainer Login] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
