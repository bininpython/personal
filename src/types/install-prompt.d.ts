/**
 * `beforeinstallprompt` não está no lib.dom padrão — é uma extensão do Chromium,
 * fora da especificação, e cada navegador decide se a implementa.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  appinstalled: Event;
}

interface Window {
  /** Guardado por um script no layout, que roda antes do React montar. */
  __gkInstallPrompt: BeforeInstallPromptEvent | null;
}
