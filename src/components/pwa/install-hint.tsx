'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';

const DISMISSED_KEY = 'gkong-install-hint-dismissed';

const STANDALONE_QUERY = '(display-mode: standalone)';

/** Avisa a árvore quando o prompt guardado é consumido. */
const PROMPT_CHANGED = 'gk:install-prompt-changed';

function isInstalled() {
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  // O iPad com iPadOS 13+ se apresenta como Mac; o toque é o que o entrega.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

/**
 * O que oferecer, se é que há algo a oferecer. Tudo aqui depende de APIs que só
 * existem no navegador, então é lido como estado externo: no servidor a
 * resposta é sempre `null` e a primeira leitura real acontece depois da
 * hidratação, sem divergência de marcação.
 */
function getMode(): 'prompt' | 'ios' | null {
  if (isInstalled()) return null;
  // O prompt do Chromium é guardado por um script no layout, porque o evento
  // costuma disparar antes de o React montar.
  if (window.__gkInstallPrompt) return 'prompt';
  // No iPhone não há diálogo a abrir: resta ensinar o caminho do menu.
  return isIOS() ? 'ios' : null;
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia(STANDALONE_QUERY);
  // Instalar o app durante a visita muda `display-mode` na aba aberta.
  query.addEventListener('change', onChange);
  window.addEventListener('beforeinstallprompt', onChange);
  window.addEventListener('appinstalled', onChange);
  window.addEventListener(PROMPT_CHANGED, onChange);

  return () => {
    query.removeEventListener('change', onChange);
    window.removeEventListener('beforeinstallprompt', onChange);
    window.removeEventListener('appinstalled', onChange);
    window.removeEventListener(PROMPT_CHANGED, onChange);
  };
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
 * Convite para instalar o app.
 *
 * No Android o Chrome esconde a instalação num item do menu de três pontos,
 * fácil de não achar — e que nem existe em outros navegadores. Aqui o convite
 * nasce dentro do app, com um botão que abre o diálogo nativo.
 */
export function InstallHint() {
  const [dismissed, setDismissed] = useState(wasDismissed);
  const mode = useSyncExternalStore(subscribe, getMode, () => null);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // idem
    }
    setDismissed(true);
  }, []);

  const install = useCallback(async () => {
    const prompt = window.__gkInstallPrompt;
    if (!prompt) return;

    await prompt.prompt();
    // Um prompt só vale uma vez. Se a pessoa recusar, o Chrome manda outro
    // evento mais tarde e o convite volta sozinho.
    window.__gkInstallPrompt = null;
    window.dispatchEvent(new Event(PROMPT_CHANGED));
  }, []);

  if (!mode || dismissed) return null;

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

      {mode === 'prompt' ? (
        <>
          <p className="mt-2 pr-6 text-sm font-bold leading-5">
            Tenha o G KONG na tela de início, abrindo em tela cheia.
          </p>
          <button
            type="button"
            onClick={install}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#c9ff32] text-sm font-black text-black transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9ff32]/60"
          >
            <Download className="size-4" />
            Instalar agora
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 pr-6 text-sm font-bold leading-5">Tenha o G KONG na tela de início do seu iPhone.</p>
          <p className="mt-2 inline-flex flex-wrap items-center gap-1 text-xs leading-5 text-white/55">
            Toque em
            <Share className="size-3.5 text-[#c9ff32]" aria-hidden />
            <span className="font-bold text-white/80">Compartilhar</span>
            e depois em
            <SquarePlus className="size-3.5 text-[#c9ff32]" aria-hidden />
            {/* Sem ponto final: o `gap` do flex o deixaria solto da última palavra. */}
            <span className="font-bold text-white/80">Adicionar à Tela de Início</span>
          </p>
        </>
      )}
    </div>
  );
}
