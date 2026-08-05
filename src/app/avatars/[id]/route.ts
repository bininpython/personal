import { AVATAR_COUNT } from '@/lib/profile/avatars';

const PALETTES = [
  ['#2563eb', '#dbeafe'], ['#7c3aed', '#ede9fe'], ['#db2777', '#fce7f3'],
  ['#059669', '#d1fae5'], ['#ea580c', '#ffedd5'], ['#0891b2', '#cffafe'],
  ['#4f46e5', '#e0e7ff'], ['#be123c', '#ffe4e6'], ['#65a30d', '#ecfccb'],
  ['#9333ea', '#f3e8ff'],
];

function avatarSvg(index: number) {
  const [accent, background] = PALETTES[index % PALETTES.length];
  const skinTones = ['#f2c6a0', '#d99b72', '#b86f4f', '#8b5138', '#6b3d2a'];
  const hairColors = ['#171717', '#4a2c1a', '#713f12', '#9f1239', '#374151'];
  const skin = skinTones[Math.floor(index / 10) % skinTones.length];
  const hair = hairColors[(index * 3) % hairColors.length];
  const faceRound = index % 2 === 0 ? 28 : 24;
  const eyeOffset = 11 + (index % 3);
  const hairStyle = index % 5;
  const accessory = index % 4;

  const hairShape = [
    `<path d="M34 49c1-22 13-31 30-31s29 9 30 31c-9-9-19-13-30-13S43 40 34 49Z" fill="${hair}"/>`,
    `<path d="M35 50c0-22 12-33 29-33 18 0 29 12 29 34-8-11-15-17-29-17-13 0-21 6-29 16Z" fill="${hair}"/><circle cx="42" cy="29" r="10" fill="${hair}"/>`,
    `<path d="M34 50c1-20 9-31 30-31s29 11 30 31c-7-7-13-13-18-18-10 8-24 10-42 18Z" fill="${hair}"/>`,
    `<path d="M35 50c0-21 12-32 29-32s29 11 29 32c-7-8-18-12-29-12S42 42 35 50Z" fill="${hair}"/><path d="M42 30c8-13 19-17 33-8" stroke="${accent}" stroke-width="4" fill="none"/>`,
    `<path d="M35 49c1-19 10-30 29-30 20 0 29 12 29 31-9-8-19-12-29-12-11 0-20 4-29 11Z" fill="${hair}"/><path d="M41 28h46" stroke="${background}" stroke-width="3"/>`,
  ][hairStyle];

  const accessoryShape = accessory === 0
    ? `<path d="M43 58h15M70 58h15" stroke="${accent}" stroke-width="3"/><path d="M58 58h12" stroke="${accent}" stroke-width="2"/><rect x="40" y="51" width="20" height="14" rx="6" fill="none" stroke="${accent}" stroke-width="3"/><rect x="68" y="51" width="20" height="14" rx="6" fill="none" stroke="${accent}" stroke-width="3"/>`
    : accessory === 1
      ? `<circle cx="86" cy="70" r="3" fill="${accent}"/>`
      : accessory === 2
        ? `<path d="M38 51c8-8 17-12 26-12 10 0 19 4 27 12" stroke="${accent}" stroke-width="3" fill="none"/>`
        : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Avatar ${index + 1}">
    <rect width="128" height="128" rx="64" fill="${background}"/>
    <circle cx="18" cy="22" r="10" fill="${accent}" opacity=".14"/>
    <circle cx="110" cy="35" r="16" fill="${accent}" opacity=".12"/>
    <path d="M22 128c3-26 18-40 42-40s39 14 42 40" fill="${accent}"/>
    <path d="M48 87h32v20H48z" fill="${skin}"/>
    <rect x="${64 - faceRound}" y="28" width="${faceRound * 2}" height="66" rx="${faceRound}" fill="${skin}"/>
    ${hairShape}
    <circle cx="${64 - eyeOffset}" cy="59" r="2.6" fill="#111827"/>
    <circle cx="${64 + eyeOffset}" cy="59" r="2.6" fill="#111827"/>
    <path d="M57 77c4 4 10 4 14 0" stroke="#7f1d1d" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    ${accessoryShape}
  </svg>`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const numericId = Number(id);
  if (!/^\d{2}$/.test(id) || numericId < 1 || numericId > AVATAR_COUNT) {
    return new Response('Avatar não encontrado.', { status: 404 });
  }

  return new Response(avatarSvg(numericId - 1), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
