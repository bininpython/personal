'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { Share, SquarePlus, X } from 'lucide-react';

const DISMISSED_KEY = 'gkong-install-hint-dismissed';

const STANDALONE_QUERY = '(display-mode: standalone)';

/**
 * A dica depende de coisas que só existem no navegador, então ela é lida como
 * estado externo: no servidor o retorno é sempre `false` e a primeira leitura
 * real acontece depois da hidratação, sem divergência de marcação.
 */
function subscribe(onChange: () => void) {
  const query = window.matchMedia(STANDALONE_QUERY);
  // Instalar o app durante a visita muda `display-mode` na aba aberta.
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function shouldOffer() {
  const ua = navigator.userAgent;
  // O iPad com iPadOS 13+ se apresenta como Mac; o toque é o que o entrega.
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;

  const isInstalled =
    window.matchMedia(STANDALONE_QUERY).matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return !isInstalled;
}

function wasDismissed() {
  try {
    return Boolean(localStorage.getItem(DISMISSED_KEY));
  } catch {
    // Safari em navegação privada bloqueia o storage. Mostrar a dica de novo é
    // melhor do que quebrar a página.
    return false;
  }
}

/**
 * Dica de instalação para iOS.
 *
 * O Chrome no Android oferece "Instalar app" sozinho assim que o manifest é
 * válido. O Safari não oferece nada: a instalação existe, mas escondida no
 * menu Compartilhar. Sem esse empurrão, no iPhone o app simplesmente nunca é
 * descoberto.
 */
export function InstallHint() {
  const [dismissed, setDismissed] = useState(wasDismissed);

  const offered = useSyncExternalStore(
    subscribe,
    shouldOffer,
    () => false,
  );

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // idem
    }
    setDismissed(true);
  }, []);

  if (!offered || dismissed) return null;

  return (
    <div
      // A margem inferior repete a do Toaster para não cobrir a navegação fixa,
      // e o safe area evita a faixa do gesto de home.
      className="fixed inset-x-3 bottom-[5.5rem] z-50 mb-[env(safe-area-inset-bottom)] rounded-3xl border border-white/10 bg-[#090a08] p-4 text-white shadow-2xl sm:left-auto sm:right-4 sm:w-80"
      role="complementary"
      aria-label="Instalar o G KONG"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar"
        className="absolute right-3 top-3 rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" />
      </button>

      <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#c9ff32]">Instale o app</p>
      <p className="mt-2 pr-6 text-sm font-bold leading-5">Tenha o G KONG na tela de início do seu iPhone.</p>
      <p className="mt-2 inline-flex flex-wrap items-center gap-1 text-xs leading-5 text-white/55">
        Toque em
        <Share className="size-3.5 text-[#c9ff32]" aria-hidden />
        <span className="font-bold text-white/80">Compartilhar</span>
        e depois em
        <SquarePlus className="size-3.5 text-[#c9ff32]" aria-hidden />
        <span className="font-bold text-white/80">Adicionar à Tela de Início</span>.
      </p>
    </div>
  );
}
