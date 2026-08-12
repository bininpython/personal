import { ImageResponse } from 'next/og';

/**
 * Marca usada nos ícones do app instalado.
 *
 * `icon.tsx` e `apple-icon.tsx` cobrem o favicon e o atalho do iOS; o manifest
 * precisa de tamanhos próprios (192 e 512) em URLs estáveis, então eles nascem
 * aqui para não repetir os mesmos estilos em cada rota.
 *
 * `safeArea` encolhe a marca dentro do quadrado. O Android recorta ícones
 * `maskable` em círculo, folha de trevo ou quadrado arredondado conforme o
 * launcher, e só os 80% centrais são garantidos — daí a versão reduzida.
 */
export function brandIcon(size: number, { safeArea = 1 }: { safeArea?: number } = {}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090a08',
          color: '#c9ff32',
          fontSize: Math.round(size * 0.52 * safeArea),
          fontWeight: 900,
          letterSpacing: '-0.06em',
          fontFamily: 'sans-serif',
        }}
      >
        DK
      </div>
    ),
    { width: size, height: size },
  );
}
