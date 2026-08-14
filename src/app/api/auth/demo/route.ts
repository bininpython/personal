import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { role } = await request.json();

    let actorId = '';
    let trainerId = '';

    if (role === 'trainer') {
      actorId = '11111111-1111-1111-1111-111111111111';
      trainerId = actorId;
    } else if (role === 'individual') {
      actorId = '22222222-2222-2222-2222-222222222222';
      trainerId = actorId;
    } else if (role === 'student') {
      actorId = '33333333-3333-3333-3333-333333333333';
      trainerId = '11111111-1111-1111-1111-111111111111';
    } else {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
    }

    await createSession({
      actorId,
      role,
      trainerId,
      request,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: actorId,
        role,
        trainer_id: trainerId,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('[Demo Login] Erro:', error);
    return NextResponse.json({ error: 'Não foi possível entrar no ambiente de teste.' }, { status: 500 });
  }
}
