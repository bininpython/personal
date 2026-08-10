import Link from 'next/link';
import { Check, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlansPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Dumbbell className="size-4" /></span>
          D KONG
        </Link>
        <div className="mx-auto mt-14 max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Plano simples, sem surpresa</h1>
          <p className="mt-4 text-muted-foreground">Use os recursos disponíveis atualmente sem cobrança.</p>
        </div>
        <Card className="mx-auto mt-10 max-w-lg border-primary/30 shadow-lg">
          <CardHeader>
            <p className="text-sm font-semibold text-primary">Plano atual</p>
            <CardTitle className="text-3xl">Gratuito</CardTitle>
            <p className="text-sm text-muted-foreground">Para um personal e até 10 alunos ativos.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="space-y-3 text-sm">
              {[
                'Cadastro e acesso por código',
                'Até 10 alunos ativos',
                'Biblioteca com 254 exercícios',
                'Montador de fichas por grupo muscular',
                'Vídeos demonstrativos disponíveis',
                'Ficha sincronizada com o aluno',
              ].map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {item}</li>)}
            </ul>
            <Button nativeButton={false} className="w-full" render={<Link href="/register" />}>Criar conta de personal</Button>
            <Button nativeButton={false} variant="outline" className="w-full" render={<Link href="/login" />}>Já tenho acesso</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
