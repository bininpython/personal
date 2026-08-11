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
        // As páginas públicas são claras nos dois temas, então as cores aqui não
        // podem vir dos tokens de tema — no escuro elas sumiriam sobre o fundo claro.
        className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-bold text-black/60 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
      >
        <ArrowLeft className="mr-1 size-4" />
        {label}
      </Link>
    </div>
  );
}
