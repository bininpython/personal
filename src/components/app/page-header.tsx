import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <header className="dk-page-header">
      <div className="relative z-10 min-w-0">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-black text-[#c9ff32] dark:bg-[#c9ff32] dark:text-black">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          )}
          <p className="dk-kicker text-muted-foreground">{eyebrow}</p>
        </div>
        <h1 className="dk-display mt-5 text-[clamp(2.5rem,6vw,4.6rem)]">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      </div>
      {actions && <div className="relative z-10 flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">{actions}</div>}
    </header>
  );
}
