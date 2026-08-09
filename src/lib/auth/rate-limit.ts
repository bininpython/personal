import 'server-only';

import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
  keyHash: string;
}

function requestIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export function rateLimitKey(request: Request, scope: string, identifier = '') {
  const pepper = process.env.RATE_LIMIT_SECRET
    || process.env.SESSION_SECRET
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || 'development-only-rate-limit-pepper';
  return createHash('sha256')
    .update(`${pepper}|${scope}|${requestIp(request)}|${identifier}`)
    .digest('hex');
}

export async function consumeRateLimit(input: {
  request: Request;
  scope: string;
  identifier?: string;
  maxAttempts?: number;
  windowSeconds?: number;
  blockSeconds?: number;
}): Promise<RateLimitResult> {
  const keyHash = rateLimitKey(input.request, input.scope, input.identifier);
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('consume_auth_rate_limit', {
    p_key_hash: keyHash,
    p_max_attempts: input.maxAttempts ?? 5,
    p_window_seconds: input.windowSeconds ?? 900,
    p_block_seconds: input.blockSeconds ?? 900,
  });

  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(result?.allowed),
    retryAfter: Number(result?.retry_after_seconds || 0),
    keyHash,
  };
}

export async function clearRateLimit(keyHash: string) {
  const admin = createAdminClient();
  await admin.rpc('clear_auth_rate_limit', { p_key_hash: keyHash });
}
