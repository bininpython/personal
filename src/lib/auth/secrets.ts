import 'server-only';

const MIN_SECRET_LENGTH = 32;

function validSecret(value: string | undefined) {
  return value && value.length >= MIN_SECRET_LENGTH ? value : null;
}

function configurationError(name: string) {
  return new Error(`Configure ${name} com pelo menos ${MIN_SECRET_LENGTH} caracteres.`);
}

export function getSessionSecret() {
  const dedicated = validSecret(process.env.SESSION_SECRET);
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === 'production') throw configurationError('SESSION_SECRET');

  const developmentFallback = validSecret(process.env.SUPABASE_SECRET_KEY)
    || validSecret(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!developmentFallback) throw configurationError('SESSION_SECRET');
  return developmentFallback;
}

export function getRateLimitSecret() {
  const dedicated = validSecret(process.env.RATE_LIMIT_SECRET);
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === 'production') throw configurationError('RATE_LIMIT_SECRET');
  return getSessionSecret();
}
