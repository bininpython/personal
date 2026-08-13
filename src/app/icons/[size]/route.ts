import { createElement } from 'react';
import { ImageResponse } from 'next/og';

const ALLOWED_SIZES = new Set([192, 512]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: requestedSize } = await context.params;
  const size = Number(requestedSize);
  if (!ALLOWED_SIZES.has(size)) {
    return Response.json({ error: 'Tamanho de ícone não disponível.' }, { status: 404 });
  }

  const logo = createElement('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Math.round(size * 0.22),
      background: '#090a08',
      color: '#c9ff32',
      fontSize: Math.round(size * 0.36),
      fontWeight: 900,
      letterSpacing: '-0.08em',
      fontFamily: 'sans-serif',
    },
  }, 'GK');

  return new ImageResponse(logo, {
    width: size,
    height: size,
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
