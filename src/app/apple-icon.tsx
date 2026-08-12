import { brandIcon } from '@/lib/brand-icon';

// É este arquivo que vira o ícone na tela de início do iPhone: o iOS ignora os
// ícones declarados no manifest.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return brandIcon(size.width);
}
