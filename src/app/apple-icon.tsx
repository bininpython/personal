import { ImageResponse } from 'next/og';
import { BRAND, BRAND_COLORS } from '@/lib/brand';

// Substitui o dkong-logo.jpg de 158 KB que era servido como ícone de iOS.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_COLORS.surface,
          color: BRAND_COLORS.accent,
          fontSize: '86px',
          fontWeight: 900,
          letterSpacing: '-0.06em',
          fontFamily: 'sans-serif',
        }}
      >
        {BRAND.monogram}
      </div>
    ),
    size,
  );
}
