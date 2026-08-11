import { cn } from '@/lib/utils';

interface ContentSkeletonProps {
  count?: number;
  className?: string;
}

export function ContentSkeleton({ count = 6, className }: ContentSkeletonProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)} role="status" aria-label="Carregando conteúdo">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-black/8 bg-card p-5 dark:border-white/8">
          <div className="flex items-center gap-3"><div className="dk-skeleton size-11 rounded-full" /><div className="flex-1 space-y-2"><div className="dk-skeleton h-3 w-2/3 rounded-full" /><div className="dk-skeleton h-2.5 w-1/2 rounded-full" /></div></div>
          <div className="mt-6 space-y-3"><div className="dk-skeleton h-9 rounded-xl" /><div className="dk-skeleton h-3 w-full rounded-full" /><div className="dk-skeleton h-3 w-4/5 rounded-full" /></div>
        </div>
      ))}
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
