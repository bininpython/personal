import { brandIcon } from '@/lib/brand-icon';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  // Na aba do navegador a marca aparece com 16px de lado. Só o gorila: a sigla
  // nesse tamanho viraria uma mancha.
  return brandIcon(size.width, { wordmark: false });
}
