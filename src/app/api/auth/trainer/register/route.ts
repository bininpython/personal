import { NextResponse } from 'next/server';
import { TRAINER_ACCESS_CODE_LENGTH } from '@/constants';
import { trainerRegisterSchema } from '@/lib/validators';
import {
  buildSyntheticEmail,
  generateNumericAccessCode,
  isDuplicateAccountError,
} from '@/lib/auth/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

const CODE_GENERATION_ATTEMPTS = 40;

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

    const { full_name, city, state, password } = result.data;
    const admin = createAdminClient();
    let createdAccount: {
      authUserId: string;
      trainerId: string;
      trainerCode: string;
      email: string;
    } | null = null;

    for (let attempt = 0; attempt < CODE_GENERATION_ATTEMPTS; attempt += 1) {
      const trainerCode = generateNumericAccessCode(TRAINER_ACCESS_CODE_LENGTH);
      const email = buildSyntheticEmail('trainer', trainerCode);

      const { data: existingTrainer, error: lookupError } = await admin
        .from('trainers')
        .select('id')
        .eq('code', trainerCode)
        .maybeSingle();

      if (lookupError) {
        console.error('[Trainer Register] Code lookup error:', lookupError);
        return json({ error: 'Não foi possível verificar o código de acesso.' }, 500);
      }

      if (existingTrainer) continue;

      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: full_name,
          code: trainerCode,
          city,
          state,
        },
        app_metadata: { role: 'trainer' },
      });

      if (authError || !authData.user) {
        if (isDuplicateAccountError(authError)) continue;

        console.error('[Trainer Register] Auth error:', authError);
        return json({ error: 'Não foi possível criar a conta. Verifique sua senha.' }, 400);
      }

      const userId = authData.user.id;
      const { data: trainer, error: profileError } = await admin
        .from('trainers')
        .insert({
          auth_user_id: userId,
          name: full_name,
          code: trainerCode,
          city,
          state,
        })
        .select('id')
        .single();

      if (profileError || !trainer) {
        await admin.auth.admin.deleteUser(userId);

        if (profileError?.code === '23505') continue;

        console.error('[Trainer Register] Profile error:', profileError);
        return json({ error: 'Não foi possível criar o perfil do personal.' }, 500);
      }

      createdAccount = {
        authUserId: userId,
        trainerId: trainer.id,
        trainerCode,
        email,
      };
      break;
    }

    if (!createdAccount) {
      return json({ error: 'Não foi possível gerar um código exclusivo. Tente novamente.' }, 503);
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: createdAccount.email,
      password,
    });

    if (signInError) {
      return json({
        success: true,
        requires_login: true,
        trainer_code: createdAccount.trainerCode,
        message: 'Conta criada. Guarde seu código e faça login para continuar.',
      }, 201);
    }

    return json({
      success: true,
      trainer_code: createdAccount.trainerCode,
      user: {
        id: createdAccount.authUserId,
        role: 'trainer',
        name: full_name,
        trainer_id: createdAccount.trainerId,
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
