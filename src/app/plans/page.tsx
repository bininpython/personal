import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMark } from '@/components/brand/brand-mark';
import { MAX_STUDENTS_PER_TRAINER } from '@/constants';

const INCLUDED_FEATURES = [
  'Acesso por nome e código, sem e-mail',
  `Até ${MAX_STUDENTS_PER_TRAINER} alunos ativos ao mesmo tempo`,
  'Biblioteca com 254 exercícios e vídeos de execução',
  'Montador de fichas por grupo muscular',
  'Registro de séries, carga e RPE com histórico',
  'Alertas de constância, risco e inatividade',
  'Avaliações físicas, agenda e mensagens diretas',
];

export default function PlansPage() {
  return (
    <main className="dk-app dk-app-surface min-h-screen px-4 py-6 sm:py-10">
      <div className="relative z-10 mx-auto max-w-5xl">
        <nav className="flex items-center justify-between"><BrandMark /><Link href="/" className="flex min-h-11 items-center gap-2 rounded-full border bg-background px-4 text-sm font-bold"><ArrowLeft className="size-4" /> Voltar</Link></nav>
        <div className="dk-hero-panel mx-auto mt-8 p-7 text-center sm:p-12">
          <div className="relative z-10"><p className="dk-kicker justify-center text-[#c9ff32]">Comece com força</p><h1 className="dk-display mt-7 text-[clamp(3rem,9vw,7rem)]">SIMPLES PARA<br /><span className="text-[#c9ff32]">COMEÇAR.</span></h1><p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/70">Todos os recursos essenciais para organizar alunos, publicar treinos e mostrar evolução real.</p></div>
        </div>
        <div className="mx-auto -mt-5 grid max-w-4xl gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Card className="border-[#9fdb00]/35 shadow-xl">
            <CardHeader className="border-b border-black/8 bg-[#c9ff32]/12 dark:border-white/8">
              <p className="flex items-center gap-2 text-sm font-black text-[#668f00]"><Sparkles className="size-4" /> Acesso atual</p>
              <CardTitle className="text-4xl font-black tracking-tight">D KONG Start</CardTitle>
              <p className="text-sm text-muted-foreground">Todos os recursos essenciais para iniciar sua operação. Sem cartão e sem cobrar do aluno.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-3 text-sm">
                {INCLUDED_FEATURES.map((item) => (
                  <li key={item} className="flex gap-3 rounded-xl border border-black/8 p-3 font-medium dark:border-white/8">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#c9ff32] text-black"><Check className="size-3.5" /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button nativeButton={false} className="w-full" render={<Link href="/register" />}>Criar conta de personal</Button>
              <Button nativeButton={false} variant="outline" className="w-full" render={<Link href="/login" />}>Já tenho acesso</Button>
            </CardContent>
          </Card>

          <aside className="space-y-4 pt-5 lg:pt-0">
            <div className="rounded-[1.75rem] bg-[#090a08] p-7 text-white shadow-xl">
              <span className="flex size-11 items-center justify-center rounded-full bg-[#c9ff32] text-black"><UsersRound className="size-5" /></span>
              <p className="dk-kicker mt-6 text-[#c9ff32]">Próximo degrau</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">Passou de {MAX_STUDENTS_PER_TRAINER} alunos ativos?</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">Alunos arquivados não ocupam vaga e mantêm todo o histórico. Assim você organiza a carteira sem perder dados.</p>
              <p className="mt-4 text-sm leading-6 text-white/70">Planos para operações maiores estão em preparação. O limite atual funciona como um degrau claro de crescimento.</p>
            </div>
            <div className="rounded-[1.75rem] border bg-card p-6">
              <h2 className="text-lg font-black">O aluno paga?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Não. Ele entra com nome e código, executa o treino e acompanha a evolução sem criar uma conta separada.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
