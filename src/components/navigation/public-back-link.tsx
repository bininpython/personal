import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PublicBackLinkProps {
  href: string;
  label?: string;
}

export function PublicBackLink({ href, label = 'Voltar' }: PublicBackLinkProps) {
  return (
    <div className="relative z-30 shrink-0 p-4">
      <Link
        href={href}
        className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="mr-1 size-4" />
        {label}
      </Link>
    </div>
  );
}
