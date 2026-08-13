import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Lidos uma vez, no módulo: os arquivos não mudam entre requisições e o
// ImageResponse precisa dos bytes embutidos, não de uma URL para buscar.
const GORILLA = `data:image/jpeg;base64,${readFileSync(
  join(process.cwd(), 'public', 'gkong-logo.jpg'),
).toString('base64')}`;

// O Satori só tem a fonte padrão, que existe em um peso só — sem isto o "GK"
// sai fininho, do lado de um gorila pesadíssimo. É o Inter 900 do site, com
// apenas os glifos G e K (2 KB). Inter é licenciada sob a SIL Open Font License.
const INTER_BLACK = readFileSync(join(process.cwd(), 'src', 'assets', 'inter-black-gk.ttf'));

interface BrandIconOptions {
  /**
   * Fração do quadrado que a marca pode ocupar. O Android recorta ícones
   * `maskable` em círculo, folha de trevo ou quadrado arredondado conforme o
   * launcher, e só os 80% centrais são garantidos — daí a versão reduzida.
   */
  safeArea?: number;
  /** O "GK" some nos tamanhos pequenos, onde viraria borrão. */
  wordmark?: boolean;
}

/**
 * Marca do app: o gorila do G KONG com a sigla embaixo.
 *
 * O fundo é claro porque a arte do logo é preta sobre branco — é assim que ela
 * aparece no site inteiro, pelo `BrandMark`. Sobre o preto da interface o
 * gorila simplesmente desapareceria.
 */
export function brandIcon(size: number, { safeArea = 1, wordmark = true }: BrandIconOptions = {}) {
  const usable = size * safeArea;
  const gorilla = Math.round(usable * (wordmark ? 0.74 : 0.94));
  const wordmarkSize = Math.round(usable * 0.2);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={GORILLA} width={gorilla} height={gorilla} alt="" />
        {wordmark && (
          <div
            style={{
              display: 'flex',
              marginTop: -Math.round(usable * 0.04),
              fontSize: wordmarkSize,
              letterSpacing: '-0.06em',
              color: '#090a08',
              fontFamily: 'Inter',
            }}
          >
            GK
          </div>
        )}
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: 'Inter', data: INTER_BLACK, weight: 900, style: 'normal' }],
    },
  );
}
