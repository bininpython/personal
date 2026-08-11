import { ImageResponse } from 'next/og';

import { BRAND, BRAND_COLORS } from '@/lib/brand';

// O produto se propaga por indicação e WhatsApp. Sem esta imagem o link
// colado numa conversa chega como texto cru — e o botão de convite do aluno
// manda exatamente esse link.
export const alt = `${BRAND.name} — plataforma de treino para personal trainers`;
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
          background: BRAND_COLORS.surface,
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
              background: BRAND_COLORS.accent,
            }}
          />
          <span
            style={{
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '0.22em',
              color: BRAND_COLORS.accent,
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
            {BRAND.name}
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
            {BRAND.tagline}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '30px',
            fontWeight: 700,
            color: BRAND_COLORS.surface,
            background: BRAND_COLORS.accent,
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
