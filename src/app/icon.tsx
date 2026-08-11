import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, background: '#090a08', color: '#c9ff32', fontSize: 23, fontWeight: 900, letterSpacing: '-0.08em' }}>DK</div>,
    size,
  );
}
