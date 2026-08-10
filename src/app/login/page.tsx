import Link from 'next/link';
import { ArrowRight, Dumbbell, ShieldCheck, UserRound } from 'lucide-react';
import { AuthScene } from '@/components/auth/auth-scene';
import { PublicBackLink } from '@/components/navigation/public-back-link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f4ef] text-black">
      <PublicBackLink href="/" />
      <AuthScene
        eyebrow="D KONG Access"
        title="DOIS PERFIS. UM SÓ FOCO."
        description="Escolha seu tipo de acesso. Cada caminho foi reduzido ao essencial para você entrar e começar rápido."
      >
        <div className="mb-8">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#648d00]">Acesso à plataforma</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Como você treina?</h1>
          <p className="mt-3 text-sm leading-6 text-black/50">Selecione o seu perfil para continuar.</p>
        </div>

        <div className="space-y-3">
          <Link href="/login/trainer" className="group flex items-center gap-4 rounded-3xl border border-black/10 bg-black p-5 text-white shadow-xl transition-transform hover:-translate-y-0.5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#c9ff32] text-black"><ShieldCheck className="size-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/40">Profissional</span>
              <span className="mt-1 block text-lg font-black">Sou personal trainer</span>
              <span className="mt-1 block text-xs text-white/48">Gerenciar alunos e treinos</span>
            </span>
            <ArrowRight className="size-5 text-[#c9ff32] transition-transform group-hover:translate-x-1" />
          </Link>

          <Link href="/login/student" className="group flex items-center gap-4 rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-black text-[#c9ff32]"><UserRound className="size-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-black/35">Treino</span>
              <span className="mt-1 block text-lg font-black">Sou aluno</span>
              <span className="mt-1 block text-xs text-black/45">Acessar meu treino e evolução</span>
            </span>
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-black/8 bg-white/60 p-4 text-xs leading-5 text-black/48">
          <Dumbbell className="size-5 shrink-0 text-black" />
          Sem e-mail. Personal e aluno acessam usando apenas nome e código.
        </div>
      </AuthScene>
    </div>
  );
}
