// ============================================
// POST /api/auth/trainer/register
// ============================================

import { NextResponse } from 'next/server';
import { trainerRegisterSchema } from '@/lib/validators';
import { hashPassword, generateTrainerCode } from '@/lib/auth/hash';
import { createTrainerToken } from '@/lib/auth/jwt';
import { setSessionCookie } from '@/lib/auth/session';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = trainerRegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { full_name, trainer_code, password, professional_name, cref, gym_name, city, state, phone, specialties } = result.data;

    // Supabase will handle unique code constraints via database logic if necessary,
    // or we could check existing here if we queried Supabase first.
    // For now, Supabase Auth handles unique emails.

    const supabase = await createClient();
      const safeCode = trainer_code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const mockEmail = `trainer_${safeCode}@example.com`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: mockEmail,
        password: password,
        options: {
          data: {
            name: full_name,
            code: trainer_code.toUpperCase(),
            role: 'trainer'
          }
        }
      });

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: authError?.message || 'Erro ao registrar no Supabase' },
          { status: 400 }
        );
      }

      // Insert into public.trainers table
      const { error: insertError } = await supabase.from('trainers').insert({
        auth_user_id: authData.user.id,
        name: full_name,
        code: trainer_code.toUpperCase(),
      });

      if (insertError) {
        return NextResponse.json(
          { error: 'Erro ao criar perfil de personal no banco.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          role: 'trainer',
          name: full_name,
          trainer_id: authData.user.id,
        },
      });
  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
