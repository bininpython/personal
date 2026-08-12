import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const { default: manifest } = await import('../src/app/manifest.ts');

test('manifest tem o mínimo para o app ser instalável', () => {
  const value = manifest();

  assert.equal(value.display, 'standalone');
  assert.equal(value.scope, '/');
  assert.ok(value.name && value.short_name);
  // Sem os dois tamanhos o Chrome recusa a instalação.
  for (const size of ['192x192', '512x512']) {
    assert.ok(
      value.icons.some((icon) => icon.sizes === size && icon.type === 'image/png'),
      `falta ícone ${size}`,
    );
  }
  // Sem um ícone maskable o launcher do Android desenha a marca dentro de um
  // quadradinho branco em vez de recortá-la no formato do sistema.
  assert.ok(value.icons.some((icon) => icon.purpose === 'maskable'));
});

test('todo ícone declarado no manifest é servido por uma rota', () => {
  for (const icon of manifest().icons) {
    assert.ok(
      existsSync(new URL(`../src/app${icon.src}/route.tsx`, import.meta.url)),
      `${icon.src} não tem rota`,
    );
  }
});

test('proxy entrega manifest e tela de offline sem desviar quem tem sessão', () => {
  const proxy = read('src/proxy.ts');

  // Os dois precisam sair pelo retorno antecipado. Em PUBLIC_PATHS, uma sessão
  // ativa vira redirect para o painel — e o service worker guardaria o HTML do
  // painel sob a chave `/offline` ao pré-cachear a página.
  assert.match(proxy, /METADATA_PATHS = new Set\(\[[^\]]*'\/manifest\.webmanifest'/s);
  assert.match(proxy, /ALWAYS_PUBLIC_PATHS = new Set\(\[[^\]]*'\/offline'/s);
  assert.match(proxy, /METADATA_PATHS\.has\(pathname\) \|\| ALWAYS_PUBLIC_PATHS\.has\(pathname\)/);
  assert.doesNotMatch(proxy, /const PUBLIC_PATHS = new Set\(\[[^\]]*'\/offline'/s);
});

test('service worker não guarda resposta autenticada nem de outra origem', () => {
  const worker = read('src/lib/service-worker.js');

  // Sessão e dados vivos sempre vão à rede.
  assert.match(worker, /pathname\.startsWith\('\/api\/'\)\) return/);
  // Navegação é network-first: o HTML carrega dados do usuário.
  assert.match(worker, /request\.mode === 'navigate'[\s\S]{0,80}networkWithOfflineFallback/);
  assert.doesNotMatch(worker, /cacheFirst\(request, SHELL_CACHE\)/);
  // Refazer um pedido cross-origin dentro do worker esbarraria no
  // `connect-src 'self'` do CSP e quebraria os vídeos do Supabase.
  assert.match(worker, /url\.origin !== self\.location\.origin\) return/);
  // Resposta 206 de vídeo não pode ir para o Cache Storage.
  assert.match(worker, /headers\.has\('range'\)\) return/);
});

test('logout esvazia o cache que ficou no aparelho', () => {
  assert.match(read('src/hooks/use-auth.tsx'), /postMessage\(\{ type: 'CLEAR_CACHES' \}\)/);
  assert.match(read('src/lib/service-worker.js'), /'CLEAR_CACHES'[\s\S]{0,200}caches\.delete/);
});

test('registro do service worker pede escopo raiz e não confia no cache HTTP', () => {
  const registrar = read('src/components/pwa/service-worker-registrar.tsx');

  assert.match(registrar, /scope: '\/'/);
  // Sem isso o navegador compara a versão nova com uma cópia velha em cache e
  // a atualização nunca é detectada.
  assert.match(registrar, /updateViaCache: 'none'/);
  // O caminho relativo é o que o bundler do Next usa para emitir o worker.
  assert.match(registrar, /new URL\('\.\.\/\.\.\/lib\/service-worker\.js', import\.meta\.url\)/);
  assert.ok(existsSync(new URL('../src/lib/service-worker.js', import.meta.url)));
});

test('o convite de instalação cobre Android, não só iOS', () => {
  const hint = read('src/components/pwa/install-hint.tsx');

  // No Android a instalação vive num item escondido do menu do Chrome. Sem
  // abrir o diálogo nativo daqui, o app fica sem caminho de instalação visível.
  assert.match(hint, /window\.__gkInstallPrompt/);
  assert.match(hint, /prompt\.prompt\(\)/);
  assert.match(hint, /mode === 'prompt'/);
  // O prompt vale uma vez só; segurá-lo depois de usado deixaria um botão morto.
  assert.match(hint, /window\.__gkInstallPrompt = null/);
});

test('o prompt de instalação é capturado antes do React montar', () => {
  const layout = read('src/app/layout.tsx');

  // O evento dispara cedo demais para um useEffect: sem este script no head, o
  // convite do Android nunca aparece.
  assert.match(layout, /addEventListener\('beforeinstallprompt'/);
  assert.match(layout, /e\.preventDefault\(\)/);
  assert.match(layout, /addEventListener\('appinstalled'/);
});

test('iOS recebe as tags que o Safari lê no lugar do manifest', () => {
  const layout = read('src/app/layout.tsx');

  assert.match(layout, /appleWebApp:\s*\{[\s\S]*capable: true/);
  assert.match(layout, /themeColor:/);
});
