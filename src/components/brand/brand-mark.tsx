import { cn } from '@/lib/utils';
import { APP_NAME } from '@/constants';

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
  priority?: boolean;
  inverted?: boolean;
  iconOnly?: boolean;
}

export function BrandMark({ className, compact = false, inverted = false, iconOnly = false }: BrandMarkProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div
        role="img"
        aria-label="Logo G KONG"
        style={{ backgroundImage: "url('/gkong-logo.jpg')" }}
        className={cn(
        'relative shrink-0 overflow-hidden rounded-[0.9rem] bg-white ring-1 ring-black/10',
        'bg-cover bg-center bg-no-repeat',
        compact ? 'size-9' : 'size-12',
      )}
      />
      {!iconOnly && <div className={cn('min-w-0', inverted && 'rounded-lg bg-white px-2.5 py-1.5')}>
        <span className={cn(
          'block font-black leading-none tracking-[-0.05em] text-black',
          compact ? 'text-base' : 'text-xl',
        )}>
          {APP_NAME}
        </span>
        {!compact && (
          <span className={cn(
            'mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-black/65',
          )}>
            Performance system
          </span>
        )}
      </div>}
    </div>
  );
}
