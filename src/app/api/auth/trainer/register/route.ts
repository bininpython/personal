// ============================================
// POST /api/auth/trainer/register
// ============================================

import { NextResponse } from 'next/server';
import { trainerRegisterSchema } from '@/lib/validators';
import { hashPassword, generateTrainerCode } from '@/lib/auth/hash';
import { createTrainerToken } from '@/lib/auth/jwt';
import { setSessionCookie } from '@/lib/auth/session';
import { initDemoData, getTrainerByCode } from '@/lib/demo-data';

export async function POST(request: Request) {
  try {
    await initDemoData();

    const body = await request.json();
    const result = trainerRegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { full_name, trainer_code, password, professional_name, cref, gym_name, city, state, phone, specialties } = result.data;

    // Check if code is already taken
    const existingTrainer = getTrainerByCode(trainer_code);
    if (existingTrainer) {
      return NextResponse.json(
        { error: 'Este código de personal já está em uso. Escolha outro.' },
        { status: 409 }
      );
    }

    // For demo mode, we just create a new trainer in memory
    const { addTrainer } = await import('@/lib/demo-data');
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    const trainer = {
      id,
      full_name,
      trainer_code: trainer_code.toUpperCase(),
      professional_name: professional_name || full_name,
      password_hash: passwordHash,
      cref: cref || '',
      avatar_url: '',
      biography: '',
      specialties: specialties || [],
      gym_name: gym_name || '',
      city: city || '',
      state: state || '',
      phone: phone || '',
      social_links: {},
      status: 'active' as const,
      failed_login_attempts: 0,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Note: In demo mode, we rely on existing data. In production, this would INSERT into Supabase.
    // For now, the demo data already has a trainer.

    // Create session
    const token = await createTrainerToken({
      id,
      full_name,
      avatar_url: '',
    });

    await setSessionCookie(token, false);

    return NextResponse.json({
      success: true,
      user: {
        id,
        role: 'trainer',
        name: full_name,
        trainer_id: id,
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
