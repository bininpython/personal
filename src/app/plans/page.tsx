import Link from 'next/link';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { PublicBackLink } from '@/components/navigation/public-back-link';
import { MAX_STUDENTS_PER_TRAINER } from '@/constants';

const included = [
  'Acesso por nome e código, sem e-mail',
  `Até ${MAX_STUDENTS_PER_TRAINER} alunos ativos ao mesmo tempo`,
  'Biblioteca com 705 exercícios, incluindo 490 demonstrações',
  'Montador de fichas pelo diagrama muscular',
  'Registro de série, carga e RPE com histórico',
  'Alertas de constância, risco e inatividade',
  'Avaliações físicas e relatório em PDF',
  'Mensagens diretas com o aluno',
];

export default function PlansPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f6f1] text-[#0a0a0a]">
      <PublicBackLink href="/" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-[#5c7f00]">Planos</p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4rem)] font-black leading-[1.02] tracking-[-0.06em]">
            TUDO LIBERADO<br />ENQUANTO VOCÊ CRESCE.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-black/60">
            Nenhum recurso fica atrás de um cadeado. O que define o plano é quantos alunos você
            acompanha ao mesmo tempo.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-7 shadow-[0_28px_70px_rgba(0,0,0,0.08)] sm:p-9">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[#c9ff32]" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-black/40">Plano atual</p>
                <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">Gratuito</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c9ff32] px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.14em]">
                <Sparkles className="size-3.5" /> Sem cartão
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-black/55">
              Para o personal que está começando a organizar a operação. Você não paga nada e o
              aluno também não.
            </p>

            <ul className="mt-7 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <Check className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-black px-7 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Criar conta de personal <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full border border-black/15 bg-white px-7 text-sm font-bold transition-colors hover:bg-[#c9ff32]"
            >
              Já tenho acesso
            </Link>
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-[1.75rem] bg-[#0a0a0a] p-7 text-white">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-[#c9ff32]">Próximo degrau</p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.03em]">Passou de {MAX_STUDENTS_PER_TRAINER} alunos?</h3>
              <p className="mt-3 text-sm leading-6 text-white/55">
                O limite vale para alunos <strong className="text-white">ativos</strong>. Aluno
                arquivado não ocupa vaga e mantém todo o histórico — então você pode girar a
                carteira sem perder dado nenhum.
              </p>
              <p className="mt-4 text-sm leading-6 text-white/55">
                Novos limites ainda não estão disponíveis. A página será atualizada quando houver
                uma oferta comercial pronta, com preço e canal de atendimento definidos.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-black/10 bg-white p-7">
              <h3 className="text-lg font-black tracking-[-0.02em]">O aluno paga alguma coisa?</h3>
              <p className="mt-2 text-sm leading-6 text-black/55">
                Não. Ele entra com nome e código, executa o treino e acompanha a evolução sem
                nenhum custo e sem criar conta.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 border-t border-black/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark compact />
          <div className="flex gap-5 text-xs font-semibold text-black/55">
            <Link href="/terms" className="hover:text-black">Termos</Link>
            <Link href="/privacy" className="hover:text-black">Privacidade</Link>
            <Link href="/help" className="hover:text-black">Ajuda</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
