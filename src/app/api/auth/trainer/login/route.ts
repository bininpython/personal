// ============================================
// POST /api/auth/trainer/login
// ============================================

import { NextResponse } from 'next/server';
import { trainerLoginSchema } from '@/lib/validators';
import { verifyPassword } from '@/lib/auth/hash';
import { createTrainerToken } from '@/lib/auth/jwt';
import { setSessionCookie } from '@/lib/auth/session';
import { initDemoData, getTrainerByCode } from '@/lib/demo-data';
import { MAX_LOGIN_ATTEMPTS, TRAINER_LOCKOUT_MINUTES } from '@/constants';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    await initDemoData();

    const body = await request.json();
    const result = trainerLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { trainer_code, password, remember_me } = result.data;

    // Supabase Auth Path (If configured)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // --- BYPASS FOR CHRIS USER (Due to Supabase Email Rate Limit) ---
    if (trainer_code.toUpperCase() === 'PT-CHRIS' && password === 'senha123') {
      const user = {
        id: 'chris-uuid',
        role: 'trainer' as const,
        name: 'Chris',
        trainer_id: 'chris-uuid',
      };
      const token = await createTrainerToken({
        id: 'chris-uuid',
        full_name: 'Chris'
      });
      await setSessionCookie(token, remember_me);

      return NextResponse.json({
        success: true,
        user,
      });
    }
    // ----------------------------------------------------------------

    if (supabaseUrl) {
      const supabase = await createClient();
      const safeCode = trainer_code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const mockEmail = `trainer_${safeCode}@example.com`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: mockEmail,
        password: password,
      });

      if (error) {
        return NextResponse.json(
          { error: 'Código ou senha inválidos no Supabase.' },
          { status: 401 }
        );
      }

      // Supabase automatically sets the cookies in createServerClient setAll()
      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          role: 'trainer',
          name: data.user.user_metadata?.name || 'Personal',
          trainer_id: data.user.id,
        },
      });
    }

    // Demo Data Path (Fallback)
    const trainer = getTrainerByCode(trainer_code);

    if (!trainer) {
      return NextResponse.json(
        { error: 'Código ou senha inválidos.' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (trainer.locked_until && new Date(trainer.locked_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(trainer.locked_until).getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        { error: `Conta bloqueada temporariamente. Tente novamente em ${minutesLeft} minutos.` },
        { status: 423 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, trainer.password_hash);

    if (!isValid) {
      // Increment failed attempts
      trainer.failed_login_attempts += 1;

      if (trainer.failed_login_attempts >= MAX_LOGIN_ATTEMPTS) {
        trainer.locked_until = new Date(
          Date.now() + TRAINER_LOCKOUT_MINUTES * 60 * 1000
        ).toISOString();
        return NextResponse.json(
          { error: `Muitas tentativas incorretas. Conta bloqueada por ${TRAINER_LOCKOUT_MINUTES} minutos.` },
          { status: 423 }
        );
      }

      return NextResponse.json(
        { error: 'Código ou senha inválidos.' },
        { status: 401 }
      );
    }

    // Reset failed attempts on success
    trainer.failed_login_attempts = 0;
    trainer.locked_until = undefined;
    trainer.last_login_at = new Date().toISOString();

    // Create session token
    const token = await createTrainerToken(
      {
        id: trainer.id,
        full_name: trainer.full_name,
        avatar_url: trainer.avatar_url,
      },
      remember_me ? 30 : 7
    );

    await setSessionCookie(token, remember_me ?? false);

    return NextResponse.json({
      success: true,
      user: {
        id: trainer.id,
        role: 'trainer',
        name: trainer.full_name,
        trainer_id: trainer.id,
        avatar_url: trainer.avatar_url,
      },
    });
  } catch (error) {
    console.error('[Login] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
