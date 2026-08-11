import { BrandMark } from '@/components/brand/brand-mark';

interface AuthSceneProps {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  wide?: boolean;
}

export function AuthScene({ children, eyebrow, title, description, wide = false }: AuthSceneProps) {
  return (
    <div className="relative flex flex-1 items-stretch overflow-hidden px-4 pb-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:38px_38px]" />
      <div className="relative mx-auto grid w-full max-w-7xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.12)] lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative hidden min-h-[720px] overflow-hidden bg-[#080808] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-20 size-80 rounded-full bg-[#c9ff32]/15 blur-3xl" />
          <div className="absolute -bottom-40 -left-28 size-96 rounded-full border-[52px] border-white/[0.035]" />
          <BrandMark inverted priority />

          <div className="relative z-10 max-w-md">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#c9ff32]">{eyebrow}</p>
            <h2 className="text-5xl font-black leading-[0.94] tracking-[-0.055em]">{title}</h2>
            <p className="mt-6 max-w-sm text-base leading-7 text-white/72">{description}</p>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/65">
            <span className="h-px w-12 bg-[#c9ff32]" />
            Simples por design
          </div>
        </aside>

        <main className="relative flex min-h-[620px] items-center justify-center bg-[#f4f4ef] px-5 py-10 sm:px-10 lg:min-h-[720px] lg:px-14">
          <div className="absolute right-7 top-7 lg:hidden"><BrandMark compact priority /></div>
          <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>{children}</div>
        </main>
      </div>
    </div>
  );
}
