import { ImageResponse } from 'next/og';
import { APP_NAME, APP_SUBTITLE } from '@/constants';

// O produto se propaga por indicação e WhatsApp. Sem esta imagem o link
// colado numa conversa chega como texto cru — e o botão de convite do aluno
// manda exatamente esse link.
export const alt = `${APP_NAME} — plataforma de treino para personal trainers`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#090a08',
          color: '#ffffff',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '999px',
              background: '#c9ff32',
            }}
          />
          <span
            style={{
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '0.22em',
              color: '#c9ff32',
            }}
          >
            PERFORMANCE SYSTEM
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '148px',
              fontWeight: 900,
              letterSpacing: '-0.06em',
              lineHeight: 1,
            }}
          >
            {APP_NAME}
          </span>
          <span
            style={{
              marginTop: '28px',
              fontSize: '40px',
              lineHeight: 1.25,
              color: 'rgba(255,255,255,0.72)',
              maxWidth: '900px',
            }}
          >
            {APP_SUBTITLE}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '30px',
            fontWeight: 700,
            color: '#090a08',
            background: '#c9ff32',
            padding: '18px 32px',
            borderRadius: '999px',
            alignSelf: 'flex-start',
          }}
        >
          Entre com seu nome e um código de 6 números
        </div>
      </div>
    ),
    size,
  );
}
