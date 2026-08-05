// ============================================
// POST /api/auth/student/login
// ============================================

import { NextResponse } from 'next/server';
import { studentLoginSchema } from '@/lib/validators';
import { normalizeName } from '@/lib/auth/hash';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = studentLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { name, access_code } = result.data;

    // Generic error message — never reveal if name or code is wrong
    const genericError = 'Nome ou código de acesso inválido.';

    const supabase = await createClient();
    
    const safeCode = access_code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mockEmail = `student_${safeCode}@example.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: mockEmail,
      password: access_code,
    });

    if (error) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    const studentName = data.user.user_metadata?.name || '';
    
    if (normalizeName(studentName) !== normalizeName(name)) {
       await supabase.auth.signOut();
       return NextResponse.json({ error: genericError }, { status: 401 });
    }

    // Supabase auto-sets session cookies via createServerClient setAll()
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        role: 'student',
        name: studentName,
        trainer_id: data.user.user_metadata?.trainer_id || data.user.id, // Fallback, session.ts fixes this
      },
    });

  } catch (error) {
    console.error('[Student Login] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
