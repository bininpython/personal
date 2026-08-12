import { brandIcon } from '@/lib/brand-icon';

export function GET() {
  return brandIcon(512);
}

// A marca não muda entre requisições: gere o PNG uma vez, no build.
export const dynamic = 'force-static';
