import Link from 'next/link';
import { Check, Dumbbell, Lock, PlaySquare, User, UserCheck } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { PublicBackLink } from '@/components/navigation/public-back-link';

export default function PlansPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <PublicBackLink href="/" />
      
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-20 pt-10 sm:px-8">
        <header className="mb-12 text-left">
          <BrandMark className="mb-8" compact />
          <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#c9ff32]">Plano Trimestral</p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4rem)] font-black leading-[0.95] tracking-[-0.06em]">
            TREINE MELHOR.<br />EVOLUA COM O G KONG<span className="text-[#c9ff32]">.</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/60">
            Biblioteca de treinos, GIFs de execução, acompanhamento e evolução em um sistema direto, simples e profissional.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Individual Plan */}
          <div className="relative flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8 transition-colors hover:border-white/20">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#c9ff32]/10 text-[#c9ff32]">
                <User className="size-6" />
              </div>
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-[#c9ff32]">Plano</p>
                <h2 className="text-lg font-black tracking-[-0.03em]">INDIVIDUAL</h2>
              </div>
            </div>
            
            <div className="mt-8 border-b border-white/10 pb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold">R$</span>
                <span className="text-6xl font-black tracking-tighter">4,99</span>
              </div>
              <p className="mt-2 text-sm text-white/40">3 meses</p>
            </div>

            <ul className="mt-8 space-y-4">
              {['Biblioteca de treinos', 'GIFs de exercícios', 'Acompanhamento', 'Evolução', 'Fichas prontas inclusas'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <Check className="size-4 text-[#c9ff32]" /> {item}
                </li>
              ))}
            </ul>

            <Link href="/register/individual" className="mt-auto pt-8">
              <button className="h-14 w-full rounded-full border border-white/10 bg-white/5 text-sm font-bold transition-colors hover:bg-white/10">
                Selecionar Individual
              </button>
            </Link>
          </div>

          {/* Personal Plan */}
          <div className="relative flex flex-col rounded-3xl border border-[#c9ff32] bg-[#c9ff32]/5 p-8">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#c9ff32]/10 text-[#c9ff32]">
                <UserCheck className="size-6" />
              </div>
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-[#c9ff32]">Plano</p>
                <h2 className="text-lg font-black tracking-[-0.03em]">PERSONAL</h2>
              </div>
            </div>
            
            <div className="mt-8 border-b border-white/10 pb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold">R$</span>
                <span className="text-6xl font-black tracking-tighter">9,99</span>
              </div>
              <p className="mt-2 text-sm text-white/40">3 meses • Até 10 alunos</p>
            </div>

            <ul className="mt-8 space-y-4">
              {['Biblioteca de treinos', 'GIFs de exercícios', 'Acompanhamento dos alunos', 'Evolução', 'Fichas prontas inclusas'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <Check className="size-4 text-[#c9ff32]" /> {item}
                </li>
              ))}
            </ul>

            <Link href="/register" className="mt-auto pt-8">
              <button className="h-14 w-full rounded-full bg-[#c9ff32] text-sm font-bold text-black transition-colors hover:bg-[#b0e620]">
                Selecionar Personal
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-6 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-around">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/5 text-[#c9ff32]">
              <Dumbbell className="size-6" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tighter text-[#c9ff32]">705</p>
              <p className="text-xs text-white/40">exercícios</p>
            </div>
          </div>
          <div className="hidden h-12 w-px bg-white/10 sm:block" />
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/5 text-[#c9ff32]">
              <PlaySquare className="size-6" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tighter text-[#c9ff32]">490</p>
              <p className="text-xs text-white/40">demonstrações</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-white/40">
          <p className="flex items-center justify-center gap-2">
            <Lock className="size-4" /> Acesse e comece seu treino hoje
          </p>
        </div>
      </main>
    </div>
  );
}
