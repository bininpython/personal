function normalizeSiteUrl(value: string | undefined) {
  if (!value) return 'http://localhost:3000';
  return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL
  || process.env.VERCEL_PROJECT_PRODUCTION_URL
  || process.env.VERCEL_URL,
).replace(/\/$/, '');
