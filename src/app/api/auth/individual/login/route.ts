import { NextResponse } from 'next/server';
import { normalizeAuthCode } from '@/lib/auth/credentials';
import { normalizeName, verifyPassword } from '@/lib/auth/hash';
import { clearRateLimit, consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPrivateAvatar } from '@/lib/profile/private-avatar';
import { DATABASE_UPDATE_REQUIRED, isCommercialSchemaMissing } from '@/lib/supabase/errors';
import { individualLoginSchema } from '@/lib/validators';

const GENERIC_ERROR = 'Nome ou código de acesso inválido.';

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request) {
  try {
    const parsed = individualLoginSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: 'Revise seu nome e o código informado.' }, 400);

    const { name, access_code: accessCode, remember } = parsed.data;
    const normalizedName = normalizeName(name);
    const canonicalCode = normalizeAuthCode(accessCode).toUpperCase();
    const limit = await consumeRateLimit({
      request,
      scope: 'individual-login',
      identifier: normalizedName,
      maxAttempts: 5,
      windowSeconds: 900,
      blockSeconds: 900,
    });
    if (!limit.allowed) {
      return json(
        { error: 'Acesso temporariamente bloqueado. Aguarde e tente novamente.' },
        429,
        { 'Retry-After': String(limit.retryAfter) },
      );
    }

    const admin = createAdminClient();
    const { data: candidates, error } = await admin
      .from('individual_users')
      .select('id, name, status, access_code_hash, failed_login_attempts, locked_until, avatar_url')
      .eq('login_name_normalized', normalizedName)
      .is('deleted_at', null)
      .limit(10);
    if (error) throw error;

    let user: NonNullable<typeof candidates>[number] | null = null;
    for (const candidate of candidates ?? []) {
      if (candidate.status !== 'active') continue;
      if (candidate.locked_until && new Date(candidate.locked_until) > new Date()) continue;
      const valid = candidate.access_code_hash
        ? await verifyPassword(canonicalCode, candidate.access_code_hash).catch(() => false)
        : false;
      if (valid) {
        user = candidate;
        break;
      }
    }

    if (!user) {
      for (const candidate of candidates ?? []) {
        const attempts = Number(candidate.failed_login_attempts || 0) + 1;
        await admin.from('individual_users').update({
          failed_login_attempts: attempts,
          locked_until: attempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
            : null,
        }).eq('id', candidate.id);
      }
      return json({ error: GENERIC_ERROR }, 401);
    }

    await admin.from('individual_users').update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    }).eq('id', user.id);
    await clearRateLimit(limit.keyHash);
    await createSession({
      actorId: user.id,
      role: 'individual',
      trainerId: user.id,
      request,
      remember,
    });

    return json({
      success: true,
      user: {
        id: user.id,
        role: 'individual',
        name: user.name,
        trainer_id: user.id,
        avatar_url: isPrivateAvatar(user.avatar_url)
          ? `/api/profile/avatar/image?user=${encodeURIComponent(user.id)}`
          : (user.avatar_url || undefined),
      },
    }, 200);
  } catch (error) {
    if (isCommercialSchemaMissing(error)) {
      console.error('[Individual Login] Database migration required:', error);
      return json({ error: DATABASE_UPDATE_REQUIRED, code: 'DATABASE_UPDATE_REQUIRED' }, 503);
    }
    console.error('[Individual Login] Unexpected error:', error);
    return json({ error: 'Não foi possível entrar agora.' }, 500);
  }
}
