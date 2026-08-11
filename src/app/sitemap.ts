import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

// Só as páginas públicas. Tudo atrás de sessão fica fora do sitemap e é
// bloqueado no robots.
const PUBLIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/plans', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/register', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/login', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/help', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: new URL(route.path, base).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
