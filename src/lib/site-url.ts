/**
 * Endereço público do site.
 *
 * `metadataBase`, `sitemap` e `robots` precisam de uma origem absoluta. Em
 * produção ela vem de `NEXT_PUBLIC_SITE_URL`; na Vercel, do domínio do
 * projeto; em desenvolvimento, do servidor local.
 */
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return new URL(explicit);

  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelDomain) return new URL(`https://${vercelDomain}`);

  return new URL('http://localhost:3000');
}
