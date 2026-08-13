import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import { RetryButton } from './retry-button';

export const metadata: Metadata = {
  title: 'Sem conexão',
  // A página só existe para quem já está sem rede; não há o que indexar.
  robots: { index: false, follow: false },
};

/**
 * Tela que o service worker entrega quando uma navegação falha por falta de
 * rede. Ela é guardada em cache na instalação, então precisa se sustentar
 * sozinha: nada de dados do servidor aqui.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#090a08] px-6 text-center text-white">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-white/5 text-[#c9ff32]">
        <WifiOff className="size-7" />
      </span>

      <p className="mt-8 text-[0.6rem] font-black uppercase tracking-[0.25em] text-[#c9ff32]">Sem conexão</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.05em]">VOCÊ ESTÁ OFFLINE</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-white/50">
        Academia com sinal ruim acontece. As telas que você já abriu continuam disponíveis — o resto volta assim que a
        internet voltar.
      </p>

      <div className="mt-8">
        <RetryButton />
      </div>
    </main>
  );
}
