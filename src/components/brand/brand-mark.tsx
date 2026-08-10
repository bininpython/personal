import Image from 'next/image';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/constants';

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
  priority?: boolean;
  inverted?: boolean;
  iconOnly?: boolean;
}

export function BrandMark({ className, compact = false, priority = false, inverted = false, iconOnly = false }: BrandMarkProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <div className={cn(
        'relative shrink-0 overflow-hidden rounded-[0.9rem] bg-white ring-1 ring-black/10',
        compact ? 'size-9' : 'size-12',
      )}>
        <Image
          src="/dkong-logo.jpg"
          alt="Logo D KONG"
          fill
          sizes={compact ? '36px' : '48px'}
          className="object-cover mix-blend-multiply"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />
      </div>
      {!iconOnly && <div className="min-w-0">
        <span className={cn(
          'block font-black leading-none tracking-[-0.05em]',
          compact ? 'text-base' : 'text-xl',
          inverted ? 'text-white' : 'text-black dark:text-white',
        )}>
          {APP_NAME}
        </span>
        {!compact && (
          <span className={cn(
            'mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.24em]',
            inverted ? 'text-white/50' : 'text-black/45 dark:text-white/45',
          )}>
            Performance system
          </span>
        )}
      </div>}
    </div>
  );
}
