import { NextResponse } from 'next/server';
import { trainerRegisterSchema } from '@/lib/validators';
import {
  buildSyntheticEmail,
  isDuplicateAccountError,
} from '@/lib/auth/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const result = trainerRegisterSchema.safeParse(await request.json());

    if (!result.success) {
      return json({
        error: 'Revise os dados informados.',
        details: result.error.flatten(),
      }, 400);
    }

    const {
      full_name,
      trainer_code,
      password,
      professional_name,
      cref,
      gym_name,
      city,
      state,
      phone,
      specialties,
    } = result.data;
    const normalizedTrainerCode = trainer_code.trim().toUpperCase();
    const email = buildSyntheticEmail('trainer', normalizedTrainerCode);
    const admin = createAdminClient();

    const { data: existingTrainer } = await admin
      .from('trainers')
      .select('id')
      .eq('code', normalizedTrainerCode)
      .maybeSingle();

    if (existingTrainer) {
      return json({ error: 'Este código de personal já está em uso.' }, 409);
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: full_name,
          code: normalizedTrainerCode,
          role: 'trainer',
        },
      },
    });

    if (
      authError
      || !authData.user
      || authData.user.identities?.length === 0
    ) {
      if (isDuplicateAccountError(authError) || authData.user?.identities?.length === 0) {
        return json({ error: 'Este código de personal já está em uso.' }, 409);
      }
      return json({ error: 'Não foi possível criar a conta do personal.' }, 400);
    }

    const userId = authData.user.id;
    const { error: metadataError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'trainer' },
      email_confirm: true,
    });

    if (metadataError) {
      await admin.auth.admin.deleteUser(userId);
      await supabase.auth.signOut();
      console.error('[Trainer Register] Metadata error:', metadataError);
      return json({ error: 'Não foi possível finalizar a conta do personal.' }, 500);
    }

    const { data: trainer, error: profileError } = await admin
      .from('trainers')
      .insert({
        auth_user_id: userId,
        name: full_name,
        code: normalizedTrainerCode,
        professional_name: professional_name || null,
        cref: cref || null,
        gym_name: gym_name || null,
        city: city || null,
        state: state || null,
        phone: phone || null,
        specialties: specialties || [],
      })
      .select('id, name')
      .single();

    if (profileError || !trainer) {
      await admin.auth.admin.deleteUser(userId);
      await supabase.auth.signOut();
      console.error('[Trainer Register] Profile error:', profileError);
      return json({ error: 'Não foi possível criar o perfil do personal.' }, 500);
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return json({
        success: true,
        requires_login: true,
        message: 'Conta criada. Faça login para continuar.',
      }, 201);
    }

    return json({
      success: true,
      user: {
        id: userId,
        role: 'trainer',
        name: trainer.name,
        trainer_id: trainer.id,
      },
    }, 201);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      console.error('[Trainer Register] Configuration error:', error.message);
      return json({ error: 'O serviço de cadastro ainda não está configurado.' }, 503);
    }

    console.error('[Trainer Register] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
