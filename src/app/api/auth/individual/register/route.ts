import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/hash';
import { consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_UPDATE_REQUIRED, isCommercialSchemaMissing } from '@/lib/supabase/errors';
import { individualRegisterSchema } from '@/lib/validators';

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request) {
  try {
    const limit = await consumeRateLimit({
      request,
      scope: 'individual-register',
      maxAttempts: 4,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });
    if (!limit.allowed) {
      return json(
        { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' },
        429,
        { 'Retry-After': String(limit.retryAfter) },
      );
    }

    const parsed = individualRegisterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ error: 'Revise os dados informados.', details: parsed.error.flatten() }, 400);
    }

    const admin = createAdminClient();
    const email = parsed.data.email.trim().toLocaleLowerCase('pt-BR');
    const { data: existing, error: existingError } = await admin
      .from('individual_users')
      .select('id')
      .eq('email_normalized', email)
      .is('deleted_at', null)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return json({ error: 'Este e-mail já possui uma conta individual.' }, 409);

    const userId = crypto.randomUUID();
    const { data: user, error } = await admin
      .from('individual_users')
      .insert({
        id: userId,
        name: parsed.data.full_name,
        email,
        email_normalized: email,
        password_hash: await hashPassword(parsed.data.password),
        goal: parsed.data.goal || null,
        level: parsed.data.level,
        terms_accepted_at: new Date().toISOString(),
        terms_version: '2026-08-11',
        privacy_policy_version: '2026-08-11',
      })
      .select('id, name')
      .single();
    if (error || !user) throw error || new Error('Conta individual não criada.');

    await createSession({
      actorId: user.id,
      role: 'individual',
      trainerId: user.id,
      request,
    });

    return json({
      success: true,
      user: {
        id: user.id,
        role: 'individual',
        name: user.name,
        trainer_id: user.id,
      },
    }, 201);
  } catch (error) {
    if (isCommercialSchemaMissing(error)) {
      console.error('[Individual Register] Database migration required:', error);
      return json({ error: DATABASE_UPDATE_REQUIRED, code: 'DATABASE_UPDATE_REQUIRED' }, 503);
    }
    console.error('[Individual Register] Unexpected error:', error);
    return json({ error: 'Não foi possível criar a conta agora.' }, 500);
  }
}
