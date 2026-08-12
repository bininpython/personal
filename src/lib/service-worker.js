/**
 * Service worker do G KONG.
 *
 * Ele é compilado pelo Next para `/_next/static/service-worker/`, que já
 * responde com `Service-Worker-Allowed: /` — por isso o registro em
 * `service-worker-registrar.tsx` pode pedir escopo `/` mesmo o arquivo não
 * morando na raiz.
 *
 * A regra que orienta tudo aqui: **nada de resposta autenticada no cache**.
 * O celular do aluno pode ser emprestado e o Cache Storage sobrevive ao
 * logout, então só guardamos o que é público e igual para todo mundo —
 * bundles, imagens e vídeos de demonstração. HTML de página e `/api/` sempre
 * vão à rede.
 */

const VERSION = 'v1';
const SHELL_CACHE = `gkong-shell-${VERSION}`;
const STATIC_CACHE = `gkong-static-${VERSION}`;
const MEDIA_CACHE = `gkong-media-${VERSION}`;

const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE, MEDIA_CACHE];

const OFFLINE_URL = '/offline';

// Um vídeo de exercício pesa bem mais que um thumbnail, então o limite é baixo
// de propósito: o iOS descarta o site inteiro quando a cota estoura.
const MEDIA_CACHE_LIMIT = 60;

const MEDIA_PREFIXES = ['/exercise-media/', '/exercise-thumbnails/', '/videos/'];
const MEDIA_EXTENSIONS = /\.(?:png|jpe?g|webp|avif|gif|svg|mp4|webm)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))),
  );
  // Sem `skipWaiting()`: a versão nova espera o usuário aceitar o aviso de
  // atualização, para não trocar os bundles debaixo de uma página já aberta.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => !CURRENT_CACHES.includes(name)).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Disparado no logout: some com tudo que ficou guardado no aparelho.
  if (event.data?.type === 'CLEAR_CACHES') {
    event.waitUntil(caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name)))));
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Só mexemos no que é nosso. Refazer um pedido ao Supabase aqui dentro
  // esbarraria no `connect-src 'self'` do CSP, que também vale para o service
  // worker — sem `respondWith` o navegador cuida do vídeo como antes.
  if (url.origin !== self.location.origin) return;

  // Requisição parcial de vídeo responde 206, e o Cache Storage recusa guardar
  // esse status. Deixe passar direto.
  if (request.headers.has('range')) return;

  // Dados vivos e sessão nunca são cacheados.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkWithOfflineFallback(request));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    // O nome do arquivo carrega o hash do conteúdo: se mudou, muda a URL.
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isPublicMedia(url.pathname)) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE, MEDIA_CACHE_LIMIT));
  }
});

function isPublicMedia(pathname) {
  // `/avatars/` fica de fora: é a única imagem por origem que identifica uma
  // pessoa, e não vale guardar no disco de um aparelho compartilhado.
  if (pathname.startsWith('/avatars/')) return false;
  if (MEDIA_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return MEDIA_EXTENSIONS.test(pathname);
}

/**
 * A navegação sempre tenta a rede — o HTML traz dados do usuário e envelhece
 * rápido. Sem conexão, entra a página de offline já guardada na instalação.
 */
async function networkWithOfflineFallback(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE });
    return cached ?? Response.error();
  }
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);

  // `basic` garante que é resposta same-origin completa — nada de opaca ou 206.
  if (response.status === 200 && response.type === 'basic') {
    await cache.put(request, response.clone());
    if (limit) await trimCache(cache, limit);
  }

  return response;
}

/** Descarta as entradas mais antigas, na ordem em que entraram. */
async function trimCache(cache, limit) {
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map((key) => cache.delete(key)));
}
