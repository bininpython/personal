import { AVATAR_COUNT, AVATAR_OPTIONS } from '@/lib/profile/avatars';

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

const FITNESS_PALETTES = [
  ['#2563eb', '#dbeafe', '#1e3a8a'], ['#7c3aed', '#ede9fe', '#4c1d95'],
  ['#db2777', '#fce7f3', '#831843'], ['#059669', '#d1fae5', '#064e3b'],
  ['#ea580c', '#ffedd5', '#7c2d12'], ['#0891b2', '#cffafe', '#164e63'],
  ['#4f46e5', '#e0e7ff', '#312e81'], ['#be123c', '#ffe4e6', '#881337'],
  ['#65a30d', '#ecfccb', '#365314'], ['#9333ea', '#f3e8ff', '#581c87'],
];

function weightShape(variant: number, accent: string, dark: string) {
  const shapes = [
    `<g fill="${dark}"><rect x="40" y="59" width="48" height="10" rx="5"/><rect x="25" y="49" width="13" height="30" rx="4"/><rect x="18" y="54" width="7" height="20" rx="3"/><rect x="90" y="49" width="13" height="30" rx="4"/><rect x="103" y="54" width="7" height="20" rx="3"/></g>`,
    `<g stroke="${dark}" stroke-width="8" stroke-linecap="round"><path d="M22 64h84"/><path d="M29 45v38M40 50v28M88 50v28M99 45v38"/></g>`,
    `<g stroke="${dark}" stroke-width="8" stroke-linecap="round"><path d="M35 35l58 58M93 35L35 93"/><path d="M26 30l16 16M20 37l16 16M102 30L86 46M108 37L92 53M26 98l16-16M20 91l16-16M102 98L86 82M108 91L92 75"/></g>`,
    `<circle cx="64" cy="64" r="39" fill="${accent}" stroke="${dark}" stroke-width="7"/><circle cx="64" cy="64" r="14" fill="none" stroke="white" stroke-width="7"/><path d="M64 31v12M64 85v12M31 64h12M85 64h12" stroke="white" stroke-width="5" stroke-linecap="round"/>`,
    `<g><ellipse cx="64" cy="82" rx="41" ry="15" fill="${dark}"/><ellipse cx="64" cy="67" rx="38" ry="14" fill="${accent}" stroke="${dark}" stroke-width="5"/><ellipse cx="64" cy="51" rx="34" ry="13" fill="white" stroke="${dark}" stroke-width="5"/><circle cx="64" cy="51" r="7" fill="${dark}"/></g>`,
    `<path d="M49 44c0-20 30-20 30 0" fill="none" stroke="${dark}" stroke-width="9" stroke-linecap="round"/><path d="M37 55c-13 18-9 47 7 58h40c16-11 20-40 7-58-15-9-39-9-54 0Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><circle cx="64" cy="78" r="10" fill="white" opacity=".75"/>`,
    `<circle cx="64" cy="67" r="39" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M42 39c18 12 30 33 31 62M88 40C70 53 59 75 58 103M29 70c23-7 47-5 69 7" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/>`,
    `<path d="M27 35h74" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M64 38v28" stroke="${dark}" stroke-width="6"/><path d="M48 66h32l-8 30H56Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M55 107h18" stroke="${dark}" stroke-width="7" stroke-linecap="round"/>`,
    `<path d="M25 102V36M103 102V36M25 47h78" stroke="${dark}" stroke-width="7" stroke-linecap="round"/><g fill="${accent}" stroke="${dark}" stroke-width="4"><rect x="34" y="55" width="22" height="13" rx="4"/><rect x="72" y="55" width="22" height="13" rx="4"/><rect x="34" y="77" width="22" height="13" rx="4"/><rect x="72" y="77" width="22" height="13" rx="4"/></g>`,
    `<g fill="${dark}"><rect x="37" y="61" width="54" height="9" rx="4"/><rect x="22" y="51" width="13" height="29" rx="4"/><rect x="93" y="51" width="13" height="29" rx="4"/></g><path d="M65 23 48 55h15l-7 35 25-41H66Z" fill="${accent}" stroke="white" stroke-width="3"/>`,
  ];
  return shapes[variant];
}

function gearShape(variant: number, accent: string, dark: string) {
  const shapes = [
    `<path d="M46 23h36l-5 14 8 67c1 8-5 13-13 13H56c-8 0-14-5-13-13l8-67Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M49 67h31M50 91h32" stroke="white" stroke-width="5"/>`,
    `<circle cx="64" cy="70" r="38" fill="${accent}" stroke="${dark}" stroke-width="7"/><path d="M54 23h20M64 31v10M91 44l8-8" stroke="${dark}" stroke-width="7" stroke-linecap="round"/><path d="M64 70 82 54" stroke="white" stroke-width="6" stroke-linecap="round"/><circle cx="64" cy="70" r="5" fill="white"/>`,
    `<path d="M20 75c20 0 33-11 42-34 9 19 20 29 45 36l-3 23H29c-10 0-15-5-9-25Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="m60 52 15 17M50 61l15 16M34 88h67" stroke="white" stroke-width="4"/>`,
    `<rect x="25" y="51" width="78" height="45" rx="17" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M30 49c15-14 53-14 68 0M43 58v30M57 55v36" stroke="${dark}" stroke-width="5"/><circle cx="88" cy="73" r="8" fill="white" opacity=".8"/>`,
    `<path d="M43 37c-27 16-25 65 2 75M85 37c27 16 25 65-2 75" fill="none" stroke="${dark}" stroke-width="6" stroke-linecap="round"/><rect x="34" y="25" width="14" height="31" rx="6" fill="${accent}" stroke="${dark}" stroke-width="4"/><rect x="80" y="25" width="14" height="31" rx="6" fill="${accent}" stroke="${dark}" stroke-width="4"/>`,
    `<path d="M27 58c0-12 14-18 24-8l13 14 13-14c10-10 24-4 24 8v39c0 8-6 14-14 14H41c-8 0-14-6-14-14Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M51 50v58M77 50v58" stroke="white" stroke-width="4"/>`,
    `<path d="M38 46c2-18 50-18 52 0" fill="none" stroke="${dark}" stroke-width="7"/><rect x="20" y="43" width="88" height="65" rx="14" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M20 67h88M53 67v15h22V67" stroke="white" stroke-width="5"/>`,
    `<path d="M19 89h90M29 75h62" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M39 75 50 44h42M86 44l10 31" fill="none" stroke="${dark}" stroke-width="7"/><rect x="48" y="37" width="47" height="13" rx="6" fill="${accent}"/>`,
    `<path d="M50 21h28l-3 17 10 14v56c0 7-5 12-12 12H55c-7 0-12-5-12-12V52l10-14Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M46 67h36M46 91h36" stroke="white" stroke-width="5"/>`,
    `<path d="M26 72V60c0-23 17-40 38-40s38 17 38 40v12" fill="none" stroke="${dark}" stroke-width="8"/><rect x="18" y="60" width="23" height="43" rx="10" fill="${accent}" stroke="${dark}" stroke-width="5"/><rect x="87" y="60" width="23" height="43" rx="10" fill="${accent}" stroke="${dark}" stroke-width="5"/>`,
  ];
  return shapes[variant];
}

function personShape(variant: number, accent: string, dark: string) {
  const shapes = [
    `<circle cx="64" cy="27" r="11" fill="${dark}"/><path d="M64 40v36M64 50 38 62M64 50l26 12M48 57l-9 20M80 57l9 20M64 76 48 108M64 76l16 32" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M30 78h18M80 78h18" stroke="${accent}" stroke-width="8"/>`,
    `<circle cx="64" cy="23" r="10" fill="${dark}"/><path d="M64 35v31M64 47 39 59M64 47l25 12M64 66 41 82M64 66l23 16M41 82l-10 24M87 82l10 24" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M24 108h18M86 108h18" stroke="${accent}" stroke-width="7"/>`,
    `<circle cx="58" cy="27" r="10" fill="${dark}"/><path d="M58 39 48 72M51 50 29 71M51 51l28 18M48 72l-5 35M48 72l31 31" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M20 72h75" stroke="${accent}" stroke-width="7"/><path d="M27 61v22M89 61v22" stroke="${dark}" stroke-width="6"/>`,
    `<circle cx="36" cy="66" r="9" fill="${dark}"/><path d="M47 68h39M58 70 42 91M82 70l20 18M42 91H23M102 88h15" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M55 59h35" stroke="${accent}" stroke-width="5"/>`,
    `<circle cx="64" cy="35" r="10" fill="${dark}"/><path d="M64 47v39M64 58 40 41M64 58l24-17M64 86l-17 27M64 86l17 27" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M31 36h18M79 36h18" stroke="${accent}" stroke-width="8"/>`,
    `<circle cx="57" cy="25" r="10" fill="${dark}"/><path d="M58 37v34M58 49 35 61M58 49l25 10M58 71 34 83M58 71l27 22M34 83l-8 27M85 93l17 13" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><circle cx="34" cy="61" r="5" fill="${accent}"/><circle cx="83" cy="59" r="5" fill="${accent}"/>`,
    `<circle cx="31" cy="69" r="9" fill="${dark}"/><path d="M42 70h46M56 72 42 91M84 71l20 20M42 91H22M104 91h15" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M49 59h40" stroke="${accent}" stroke-width="5"/>`,
    `<path d="M25 24h78" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><circle cx="64" cy="45" r="10" fill="${dark}"/><path d="M64 56v31M64 65 42 38M64 65l22-27M64 87l-15 27M64 87l15 27" stroke="${dark}" stroke-width="8" stroke-linecap="round"/>`,
    `<circle cx="65" cy="27" r="9" fill="${dark}"/><path d="M62 38 50 66M55 53l24 8M50 66l-24 13M50 66l22 21M26 79 18 102M72 87l22 18" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M18 105h19M90 108h20" stroke="${accent}" stroke-width="6"/>`,
    `<circle cx="86" cy="30" r="9" fill="${dark}"/><circle cx="62" cy="82" r="27" fill="none" stroke="${accent}" stroke-width="6"/><circle cx="62" cy="82" r="6" fill="${dark}"/><path d="M83 42 69 61M69 61 47 51M69 61l17 26M69 61 47 83M47 83l-14 18M86 87l18 11" stroke="${dark}" stroke-width="7" stroke-linecap="round"/>`,
  ];
  return shapes[variant];
}

function movementShape(variant: number, accent: string, dark: string) {
  const shapes = [
    `<path d="M64 108S22 83 22 49c0-27 34-34 42-10 8-24 42-17 42 10 0 34-42 59-42 59Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M34 67h18l8-18 10 34 8-16h18" fill="none" stroke="white" stroke-width="5"/>`,
    `<path d="M67 17c4 25 30 30 30 61 0 22-15 38-33 38S31 101 31 79c0-17 10-30 23-42-1 15 4 24 13 29 8-17 9-31 0-49Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M64 70c10 12 12 21 0 35-12-14-10-24 0-35Z" fill="white"/>`,
    `<path d="m70 14-43 58h31l-4 42 47-64H70Z" fill="${accent}" stroke="${dark}" stroke-width="7" stroke-linejoin="round"/>`,
    `<circle cx="64" cy="64" r="45" fill="white" stroke="${dark}" stroke-width="6"/><circle cx="64" cy="64" r="31" fill="none" stroke="${accent}" stroke-width="9"/><circle cx="64" cy="64" r="10" fill="${dark}"/><path d="M64 64 99 30" stroke="${dark}" stroke-width="7" stroke-linecap="round"/>`,
    `<path d="m15 103 31-46 15 20 20-37 33 63Z" fill="${accent}" stroke="${dark}" stroke-width="6" stroke-linejoin="round"/><path d="m38 69 8-12 8 11M72 57l9-17 12 22" fill="none" stroke="white" stroke-width="5"/>`,
    `<path d="M12 68h24l8-20 13 42 15-55 13 33h31" fill="none" stroke="${dark}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="64" cy="64" r="49" fill="none" stroke="${accent}" stroke-width="5"/>`,
    `<g fill="${accent}" stroke="${dark}" stroke-width="5"><ellipse cx="46" cy="72" rx="19" ry="30" transform="rotate(25 46 72)"/><ellipse cx="84" cy="55" rx="17" ry="27" transform="rotate(-20 84 55)"/></g><g fill="white"><circle cx="38" cy="42" r="5"/><circle cx="49" cy="39" r="5"/><circle cx="59" cy="44" r="5"/><circle cx="76" cy="27" r="5"/><circle cx="87" cy="25" r="5"/><circle cx="96" cy="31" r="5"/></g>`,
    `<path d="M20 91c20-5 30-19 37-42 8 17 21 25 48 30" fill="none" stroke="${dark}" stroke-width="10" stroke-linecap="round"/><path d="M28 101h73" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><path d="m91 65 17 14-18 13" fill="none" stroke="${accent}" stroke-width="6"/>`,
    `<path d="M94 44a39 39 0 0 0-66 17M34 42l-6 19-18-7M34 84a39 39 0 0 0 66-17M94 86l6-19 18 7" fill="none" stroke="${dark}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="64" cy="64" r="13" fill="${accent}"/>`,
    `<path d="M29 73c6-22 17-33 34-33 12 0 17 8 17 17 0 8-5 14-12 14H55M55 71l-7 30M55 71l23 29" fill="none" stroke="${dark}" stroke-width="9" stroke-linecap="round"/><circle cx="72" cy="26" r="10" fill="${accent}"/><path d="M21 107h76" stroke="${accent}" stroke-width="6"/>`,
  ];
  return shapes[variant];
}

function achievementShape(variant: number, accent: string, dark: string) {
  const shapes = [
    `<path d="M38 24h52v24c0 22-10 36-26 36S38 70 38 48Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="M38 34H20c0 22 8 33 27 34M90 34h18c0 22-8 33-27 34M64 84v20M45 108h38" fill="none" stroke="${dark}" stroke-width="7" stroke-linecap="round"/><path d="m64 39 5 10 11 2-8 8 2 12-10-6-10 6 2-12-8-8 11-2Z" fill="white"/>`,
    `<path d="m43 17 21 32 21-32" fill="none" stroke="${dark}" stroke-width="8"/><circle cx="64" cy="76" r="34" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="m64 55 6 12 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2Z" fill="white"/>`,
    `<path d="M64 14 105 31v31c0 27-17 43-41 53-24-10-41-26-41-53V31Z" fill="${accent}" stroke="${dark}" stroke-width="7"/><path d="m44 65 13 13 28-31" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/>`,
    `<path d="m20 48 20 17 24-38 24 38 20-17-7 55H27Z" fill="${accent}" stroke="${dark}" stroke-width="7" stroke-linejoin="round"/><circle cx="40" cy="82" r="5" fill="white"/><circle cx="64" cy="82" r="5" fill="white"/><circle cx="88" cy="82" r="5" fill="white"/>`,
    `<path d="m64 14 14 30 33 4-24 23 6 33-29-16-29 16 6-33-24-23 33-4Z" fill="${accent}" stroke="${dark}" stroke-width="7" stroke-linejoin="round"/><circle cx="64" cy="65" r="11" fill="white"/>`,
    `<path d="M48 107C17 88 20 48 43 25M80 107c31-19 28-59 5-82" fill="none" stroke="${dark}" stroke-width="7" stroke-linecap="round"/><g fill="${accent}"><ellipse cx="35" cy="41" rx="7" ry="13" transform="rotate(-35 35 41)"/><ellipse cx="30" cy="61" rx="7" ry="13" transform="rotate(-65 30 61)"/><ellipse cx="36" cy="83" rx="7" ry="13" transform="rotate(-65 36 83)"/><ellipse cx="93" cy="41" rx="7" ry="13" transform="rotate(35 93 41)"/><ellipse cx="98" cy="61" rx="7" ry="13" transform="rotate(65 98 61)"/><ellipse cx="92" cy="83" rx="7" ry="13" transform="rotate(65 92 83)"/></g><path d="m64 38 7 15 17 2-12 12 3 17-15-8-15 8 3-17-12-12 17-2Z" fill="${accent}"/>`,
    `<path d="m64 15 39 49-39 49-39-49Z" fill="${accent}" stroke="${dark}" stroke-width="7"/><path d="M25 64h78M64 15 48 64l16 49 16-49Z" fill="none" stroke="white" stroke-width="5"/>`,
    `<path d="M53 101c-21-22-13-48 11-78 24 30 32 56 11 78Z" fill="${accent}" stroke="${dark}" stroke-width="6"/><path d="m52 92-19 20 4-31M76 92l19 20-4-31" fill="${dark}"/><circle cx="64" cy="59" r="13" fill="white" stroke="${dark}" stroke-width="5"/><path d="M58 108h12" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
    `<path d="M35 112V21" stroke="${dark}" stroke-width="8" stroke-linecap="round"/><path d="M40 27h63L85 52l18 26H40Z" fill="${accent}" stroke="${dark}" stroke-width="6" stroke-linejoin="round"/><path d="m56 45 7 7 14-15" fill="none" stroke="white" stroke-width="5"/>`,
    `<circle cx="64" cy="64" r="46" fill="${accent}" stroke="${dark}" stroke-width="7"/><circle cx="64" cy="64" r="34" fill="none" stroke="white" stroke-width="5" stroke-dasharray="5 7"/><path d="m64 42 7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2Z" fill="white"/>`,
  ];
  return shapes[variant];
}

function fitnessAvatarSvg(index: number) {
  const group = Math.floor(index / 10);
  const variant = index % 10;
  const [accent, background, dark] = FITNESS_PALETTES[(index * 3 + group) % FITNESS_PALETTES.length];
  const shape = [weightShape, gearShape, personShape, movementShape, achievementShape][group](variant, accent, dark);
  const label = AVATAR_OPTIONS[index + 50]?.label ?? `Avatar fitness ${index + 51}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${label}">
    <rect width="128" height="128" rx="64" fill="${background}"/>
    <circle cx="22" cy="22" r="13" fill="${accent}" opacity=".12"/>
    <circle cx="108" cy="105" r="19" fill="${accent}" opacity=".1"/>
    ${shape}
  </svg>`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const numericId = Number(id);
  if (!/^\d{2,3}$/.test(id) || numericId < 1 || numericId > AVATAR_COUNT) {
    return new Response('Avatar não encontrado.', { status: 404 });
  }

  return new Response(numericId <= 50 ? avatarSvg(numericId - 1) : fitnessAvatarSvg(numericId - 51), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
