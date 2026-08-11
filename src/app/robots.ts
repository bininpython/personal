import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/plans', '/help', '/privacy', '/terms'],
      disallow: ['/api/', '/dashboard', '/students', '/workouts', '/exercises', '/assessments', '/schedule', '/messages', '/reports', '/alerts', '/settings', '/home', '/workout', '/history', '/progress', '/profile', '/student-messages', '/onboarding'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
