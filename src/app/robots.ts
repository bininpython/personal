import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nada atrás de sessão deve ser rastreado — inclusive as telas do aluno,
      // que carregam dado pessoal.
      disallow: [
        '/api/',
        '/dashboard',
        '/students',
        '/workouts',
        '/exercises',
        '/assessments',
        '/schedule',
        '/messages',
        '/reports',
        '/alerts',
        '/settings',
        '/home',
        '/workout',
        '/history',
        '/progress',
        '/student-messages',
        '/profile',
        '/onboarding',
        '/recover',
      ],
    },
    sitemap: new URL('/sitemap.xml', base).toString(),
  };
}
