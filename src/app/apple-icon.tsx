import { ImageResponse } from 'next/og';

// Substitui o gkong-logo.jpg de 158 KB que antes era servido como ícone de iOS.
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
          background: '#090a08',
          color: '#c9ff32',
          fontSize: '86px',
          fontWeight: 900,
          letterSpacing: '-0.06em',
          fontFamily: 'sans-serif',
        }}
      >
        GK
      </div>
    ),
    size,
  );
}
