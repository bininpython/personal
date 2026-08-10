import { NextResponse } from 'next/server';
import { studentLoginSchema } from '@/lib/validators';
import { getCodeHint, normalizeAuthCode } from '@/lib/auth/credentials';
import { hashPassword, normalizeName, verifyPassword } from '@/lib/auth/hash';
import { clearRateLimit, consumeRateLimit } from '@/lib/auth/rate-limit';
import { createSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPrivateAvatar } from '@/lib/profile/private-avatar';
import { DATABASE_UPDATE_REQUIRED, isCommercialSchemaMissing } from '@/lib/supabase/errors';

const GENERIC_ERROR = 'Nome ou código individual inválido.';

function json(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request) {
  try {
    const result = studentLoginSchema.safeParse(await request.json());
    if (!result.success) return json({ error: 'Revise seu nome e código.' }, 400);

    const { name, access_code, remember } = result.data;
    const normalizedName = normalizeName(name);
    const privateCode = normalizeAuthCode(access_code).toUpperCase();
    const limit = await consumeRateLimit({
      request,
      scope: 'student-login',
      identifier: normalizedName,
      maxAttempts: 5,
      windowSeconds: 600,
      blockSeconds: 600,
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
      .from('students')
      .select('id, trainer_id, name, status, access_code, access_code_hash, failed_login_attempts, locked_until, avatar_url')
      .eq('login_name_normalized', normalizedName)
      .is('deleted_at', null)
      .limit(50);
    if (error) throw error;

    let student: NonNullable<typeof candidates>[number] | null = null;
    let usedLegacyCode = false;
    for (const candidate of candidates ?? []) {
      if (candidate.status !== 'active') continue;
      if (candidate.locked_until && new Date(candidate.locked_until) > new Date()) continue;
      const validHash = candidate.access_code_hash
        ? await verifyPassword(privateCode, candidate.access_code_hash).catch(() => false)
        : false;
      const validLegacy = !candidate.access_code_hash
        && normalizeAuthCode(candidate.access_code || '').toUpperCase() === privateCode;
      if (validHash || validLegacy) {
        student = candidate;
        usedLegacyCode = validLegacy;
        break;
      }
    }

    if (!student) {
      for (const candidate of candidates ?? []) {
        const attempts = Number((candidate as { failed_login_attempts?: number }).failed_login_attempts || 0) + 1;
        await admin.from('students').update({
          failed_login_attempts: attempts,
          locked_until: attempts >= 5
            ? new Date(Date.now() + 10 * 60 * 1000).toISOString()
            : null,
        }).eq('id', candidate.id);
      }
      return json({ error: GENERIC_ERROR }, 401);
    }

    await admin.from('students').update({
      access_code_hash: usedLegacyCode ? await hashPassword(privateCode) : student.access_code_hash,
      access_code_hint: usedLegacyCode ? getCodeHint(privateCode) : undefined,
      access_code: usedLegacyCode ? null : undefined,
      credential_version: usedLegacyCode ? 1 : 3,
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    }).eq('id', student.id);
    await clearRateLimit(limit.keyHash);
    await createSession({
      actorId: student.id,
      role: 'student',
      trainerId: student.trainer_id,
      request,
      remember,
    });

    return json({
      success: true,
      credential_upgrade: usedLegacyCode,
      user: {
        id: student.id,
        role: 'student',
        name: student.name,
        trainer_id: student.trainer_id,
        avatar_url: isPrivateAvatar(student.avatar_url)
          ? `/api/profile/avatar/image?user=${encodeURIComponent(student.id)}`
          : (student.avatar_url || undefined),
      },
    }, 200);
  } catch (error) {
    if (isCommercialSchemaMissing(error)) {
      console.error('[Student Login] Database migration required:', error);
      return json({ error: DATABASE_UPDATE_REQUIRED, code: 'DATABASE_UPDATE_REQUIRED' }, 503);
    }
    console.error('[Student Login] Unexpected error:', error);
    return json({ error: 'Erro interno do servidor.' }, 500);
  }
}
