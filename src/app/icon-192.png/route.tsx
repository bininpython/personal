import { brandIcon } from '@/lib/brand-icon';

export function GET() {
  return brandIcon(192);
}

// A marca não muda entre requisições: gere o PNG uma vez, no build.
export const dynamic = 'force-static';
