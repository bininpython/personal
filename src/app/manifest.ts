import type { MetadataRoute } from 'next';

/**
 * Servido em `/manifest.webmanifest`. É o arquivo que transforma o site em app
 * instalável: o sistema lê daqui o nome, o ícone e o modo de exibição.
 *
 * `start_url` aponta para `/login` de propósito. O proxy manda quem já tem
 * sessão para a home do seu papel, então abrir pelo ícone cai direto no painel
 * — e quem está deslogado encontra a escolha de perfil, não a página de venda.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'G KONG — Performance e Gestão de Treinos',
    short_name: 'G KONG',
    description:
      'Fichas, catálogo de exercícios e acompanhamento de treino para personal trainers, alunos e atletas independentes.',
    lang: 'pt-BR',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    // O fundo da splash acompanha o preto da marca, o mesmo dos ícones, para
    // que a abertura não pisque um retângulo branco antes da primeira tela.
    background_color: '#090a08',
    theme_color: '#090a08',
    categories: ['fitness', 'health', 'sports'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
