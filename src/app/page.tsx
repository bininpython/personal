import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  Dumbbell,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';

const capabilities = [
  {
    number: '01',
    icon: Users,
    title: 'Alunos sob controle',
    description: 'Perfis, avaliações, histórico e comunicação reunidos em uma visão limpa e acionável.',
  },
  {
    number: '02',
    icon: Dumbbell,
    title: 'Treinos que evoluem',
    description: 'Monte fichas completas, acompanhe cada série e ajuste o plano a partir do desempenho real.',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Dados que viram decisão',
    description: 'Consistência, frequência e progresso traduzidos em indicadores fáceis de entender.',
  },
];

const highlights = [
  'Sem e-mail obrigatório',
  'Códigos simples de 6 números',
  'Experiência otimizada para celular',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f6f1] text-[#0a0a0a]">
      <header className="border-b border-black/10 bg-[#f6f6f1]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="D KONG — início">
            <BrandMark priority />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="hidden text-sm font-bold transition-opacity hover:opacity-55 sm:inline-flex">
              Já tenho acesso
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              Começar agora <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16">
          <div className="absolute left-1/2 top-24 -z-0 size-[520px] -translate-x-1/2 rounded-full bg-[#c9ff32]/12 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] shadow-sm">
              <span className="size-2 rounded-full bg-[#9fdb00] shadow-[0_0_0_4px_rgba(159,219,0,0.14)]" />
              Performance management
            </div>
            <h1 className="max-w-4xl text-[clamp(3.55rem,8.5vw,7.6rem)] font-black leading-[0.83] tracking-[-0.075em]">
              FORÇA NA
              <span className="block text-[#7cae00]">GESTÃO.</span>
              FOCO NO
              <span className="block">RESULTADO.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-black/58 sm:text-lg">
              D KONG transforma a rotina do personal em um sistema direto: menos operação, mais presença e evolução visível para cada aluno.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-black px-7 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Acessar plataforma <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center rounded-full border border-black/15 bg-white px-7 text-sm font-bold transition-colors hover:bg-[#c9ff32]"
              >
                Criar conta de personal
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
              {highlights.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 text-xs font-semibold text-black/55">
                  <span className="flex size-5 items-center justify-center rounded-full bg-black text-white"><Check className="size-3" /></span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[540px]">
            <div className="absolute -left-5 top-12 hidden rounded-2xl bg-[#c9ff32] px-5 py-4 shadow-xl sm:block">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.22em]">Acesso simples</p>
              <p className="mt-1 font-mono text-xl font-black tracking-[0.12em]">564-625</p>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_40px_100px_rgba(0,0,0,0.14)] sm:p-8">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[#c9ff32]" />
              <div className="flex items-center justify-between border-b border-black/10 pb-5">
                <span className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-black/40">The training OS</span>
                <Sparkles className="size-4 text-[#7cae00]" />
              </div>
              <div className="relative mx-auto aspect-square max-w-[430px]">
                <Image
                  src="/dkong-logo.jpg"
                  alt="Gorila com boné, símbolo da D KONG"
                  fill
                  sizes="(max-width: 640px) 85vw, 430px"
                  className="object-contain mix-blend-multiply"
                  priority
                  loading="eager"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-black/10 pt-5 text-center">
                {[['254+', 'exercícios'], ['100%', 'mobile'], ['24/7', 'acesso']].map(([value, label]) => (
                  <div key={label}>
                    <p className="text-lg font-black">{value}</p>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-black/38">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -right-3 rounded-2xl bg-black px-5 py-4 text-white shadow-2xl sm:-right-8">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#c9ff32] text-black"><Zap className="size-4 fill-current" /></span>
                <div><p className="text-xs font-bold">Operação rápida</p><p className="text-[0.65rem] text-white/50">do cadastro ao treino</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0a0a0a] px-5 py-20 text-white sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 border-b border-white/12 pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c9ff32]">Sistema completo</p>
              <h2 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
                TUDO O QUE IMPORTA. SEM O QUE ATRAPALHA.
              </h2>
            </div>
            <div className="grid lg:grid-cols-3">
              {capabilities.map((item) => (
                <article key={item.number} className="group border-b border-white/12 py-9 lg:border-b-0 lg:border-r lg:px-8 lg:py-12 first:lg:pl-0 last:lg:border-r-0 last:lg:pr-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-white/35">/{item.number}</span>
                    <item.icon className="size-5 text-[#c9ff32] transition-transform group-hover:scale-110" />
                  </div>
                  <h3 className="mt-20 text-2xl font-black tracking-[-0.035em]">{item.title}</h3>
                  <p className="mt-4 max-w-sm text-sm leading-6 text-white/48">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-24">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#668f00]">Acesso D KONG</p>
              <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">ENTRAR NÃO PRECISA SER UM TREINO.</h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-black/55">Um fluxo pensado para funcionar na academia, entre uma série e outra — rápido, legível e sem códigos desnecessários.</p>
            </div>
            <div className="space-y-4">
              {[
                { icon: ShieldCheck, tag: 'PERSONAL', title: 'Nome + código pessoal', text: 'Cadastre-se uma vez e receba um único código no formato 000-000.' },
                { icon: KeyRound, tag: 'ALUNO', title: 'Nome + código do aluno', text: 'O personal cria o código no perfil do aluno e envia. Só isso.' },
                { icon: Zap, tag: 'RECUPERAÇÃO', title: 'Nome + senha + idade', text: 'Valide seus dados e gere um novo código sem e-mail ou etapas confusas.' },
              ].map((step, index) => (
                <div key={step.tag} className="grid gap-5 rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:grid-cols-[56px_1fr_auto] sm:items-center">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-black text-[#c9ff32]"><step.icon className="size-5" /></span>
                  <div>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-black/38">{step.tag}</p>
                    <h3 className="mt-1 text-lg font-black">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-black/48">{step.text}</p>
                  </div>
                  <span className="font-mono text-sm text-black/25">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-8 sm:px-8 sm:pb-12">
          <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 overflow-hidden rounded-[2.2rem] bg-[#c9ff32] p-8 sm:p-12 lg:flex-row lg:items-end lg:p-16">
            <div className="absolute -right-20 -top-40 size-96 rounded-full border-[55px] border-black/[0.055]" />
            <div className="relative z-10 max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em]">Sua próxima evolução começa aqui</p>
              <h2 className="mt-5 text-4xl font-black leading-[0.9] tracking-[-0.06em] sm:text-6xl">GESTÃO FORTE. ALUNOS MAIS PERTO.</h2>
            </div>
            <Link href="/register" className="relative z-10 inline-flex h-14 shrink-0 items-center gap-3 rounded-full bg-black px-7 text-sm font-bold text-white transition-transform hover:-translate-y-1">
              Criar minha conta <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-black/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark compact />
          <div className="flex gap-5 text-xs font-semibold text-black/45">
            <Link href="/terms" className="hover:text-black">Termos</Link>
            <Link href="/privacy" className="hover:text-black">Privacidade</Link>
            <Link href="/help" className="hover:text-black">Ajuda</Link>
          </div>
          <p className="text-xs text-black/35">© {new Date().getFullYear()} D KONG</p>
        </div>
      </footer>
    </div>
  );
}
