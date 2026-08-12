'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Registra o service worker e avisa quando existe versão nova.
 *
 * Um app instalado não passa mais pela barra de endereço, então o usuário não
 * tem como "dar F5" para buscar a atualização. O aviso abaixo é o substituto:
 * a versão nova fica esperando e só assume quando ele aceita.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Em desenvolvimento o cache dos bundles brigaria com o hot reload. Para
    // testar o comportamento real, use `next build && next start`.
    if (process.env.NODE_ENV !== 'production') return;

    let reloading = false;

    function onControllerChange() {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    function announceUpdate(worker: ServiceWorker) {
      toast('Nova versão disponível', {
        description: 'Atualize para carregar as últimas melhorias.',
        duration: Infinity,
        action: {
          label: 'Atualizar',
          onClick: () => worker.postMessage({ type: 'SKIP_WAITING' }),
        },
      });
    }

    navigator.serviceWorker
      .register(new URL('../../lib/service-worker.js', import.meta.url), {
        scope: '/',
        // O próprio script do worker nunca pode vir do cache HTTP, senão a
        // checagem de atualização compara sempre com a versão velha.
        updateViaCache: 'none',
      })
      .then((registration) => {
        // Já havia uma versão nova parada de uma visita anterior.
        if (registration.waiting && navigator.serviceWorker.controller) {
          announceUpdate(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener('statechange', () => {
            // Sem `controller` é a primeira instalação: não há o que atualizar.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              announceUpdate(installing);
            }
          });
        });
      })
      .catch(() => {
        // Falhar aqui não pode derrubar a página: o site funciona sem o worker.
      });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return null;
}
