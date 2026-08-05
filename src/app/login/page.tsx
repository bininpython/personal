'use client';

import { useRouter } from 'next/navigation';
import { Dumbbell, Shield, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { APP_NAME } from '@/constants';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-background to-blue-600/5 dark:from-emerald-600/15 dark:via-background dark:to-blue-600/10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />

      {/* Back button */}
      <div className="relative z-10 p-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Dumbbell className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">Escolha como deseja acessar</p>
          </div>
        </div>

        {/* Access Cards */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl animate-slide-up">
          {/* Personal Trainer Card */}
          <Card
            className="group cursor-pointer border-2 border-border/50 hover:border-primary/50 bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            onClick={() => router.push('/login/trainer')}
          >
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sou Personal Trainer</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Acesse o painel para cadastrar alunos, criar fichas e acompanhar resultados.
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 group-hover:shadow-md transition-all">
                Entrar como Personal
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Student Card */}
          <Card
            className="group cursor-pointer border-2 border-border/50 hover:border-blue-500/50 bg-card hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
            onClick={() => router.push('/login/student')}
          >
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                <User className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sou Aluno</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Use seu nome e o código fornecido pelo seu personal trainer.
              </p>
              <Button variant="outline" className="w-full border-blue-500/30 text-blue-500 hover:bg-blue-500/10 group-hover:shadow-md transition-all">
                Acessar Meu Treino
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-muted-foreground mb-1">Demonstração</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs text-muted-foreground">
            <span>
              Personal: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">#001-CHRIS</code> / <code className="bg-muted px-1.5 py-0.5 rounded font-mono">senha123</code>
            </span>
            <span>
              Aluno: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">João Pedro Silva</code> / <code className="bg-muted px-1.5 py-0.5 rounded font-mono">JP8X41</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
