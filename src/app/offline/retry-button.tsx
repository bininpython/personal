'use client';

import { RotateCw } from 'lucide-react';

export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#c9ff32] px-6 text-sm font-black text-black transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9ff32]/60"
    >
      <RotateCw className="size-4" />
      Tentar de novo
    </button>
  );
}
