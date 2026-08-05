import { NextResponse } from 'next/server';
import { trainerLoginSchema } from '@/lib/validators';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = trainerLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { trainer_code, password, remember_me } = result.data;

    const supabase = await createClient();
    const safeCode = trainer_code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mockEmail = `trainer_${safeCode}@example.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: mockEmail,
      password: password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Código ou senha inválidos.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        role: 'trainer',
        name: data.user.user_metadata?.name || 'Personal',
        trainer_id: data.user.id,
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
