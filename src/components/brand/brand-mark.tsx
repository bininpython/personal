import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';
import { BrandLogo } from './brand-logo';

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
  /** Mantido por compatibilidade: o símbolo vetorial não precisa de prioridade de carga. */
  priority?: boolean;
  inverted?: boolean;
  iconOnly?: boolean;
}

/**
 * A assinatura da marca: símbolo + nome + descritor.
 *
 * Nome e descritor vêm de `src/lib/brand.ts`; o desenho, de `BrandLogo`.
 * Nenhum texto de marca é escrito aqui.
 */
export function BrandMark({ className, compact = false, inverted = false, iconOnly = false }: BrandMarkProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className={cn(
        'relative flex shrink-0 items-center justify-center rounded-[0.9rem] bg-brand-surface text-white ring-1 ring-white/10',
        compact ? 'size-9' : 'size-12',
      )}>
        <BrandLogo className={compact ? 'size-6' : 'size-8'} title={`Símbolo ${BRAND.name}`} />
      </div>
      {!iconOnly && <div className="min-w-0">
        <span className={cn(
          'block font-black leading-none tracking-[-0.05em]',
          compact ? 'text-base' : 'text-xl',
          inverted ? 'text-white' : 'text-black dark:text-white',
        )}>
          {BRAND.name}
        </span>
        {!compact && (
          <span className={cn(
            'mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.24em]',
            inverted ? 'text-white/55' : 'text-black/55 dark:text-white/55',
          )}>
            {BRAND.wordmarkSubtitle}
          </span>
        )}
      </div>}
    </div>
  );
}
