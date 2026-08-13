import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'G KONG — Performance System',
    short_name: 'G KONG',
    description: 'Treinos, evolução e gestão para personal trainers, alunos e atletas independentes.',
    id: '/',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f5f7ed',
    theme_color: '#090a08',
    categories: ['fitness', 'health', 'sports'],
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Abrir treino',
        short_name: 'Treino',
        description: 'Abrir a ficha ativa para treinar.',
        url: '/workout',
        icons: [{ src: '/icons/192', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
