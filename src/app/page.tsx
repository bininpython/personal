'use client';

import { useRouter } from 'next/navigation';
import { Dumbbell, Users, BarChart3, Shield, ChevronRight, Zap, Target, TrendingUp, Award, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { APP_NAME, APP_SUBTITLE } from '@/constants';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background" />

        <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{APP_NAME}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/login')}
              className="hidden sm:inline-flex"
            >
              Entrar
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/login')}
              className="bg-primary hover:bg-primary/90"
            >
              Começar Agora
            </Button>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/50 bg-muted/30 text-muted-foreground text-sm font-medium mb-6 animate-fade-in">
              Gestão Profissional de Alunos
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
              {APP_NAME}
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {APP_SUBTITLE}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: '0.15s' }}>
              Cadastre alunos, crie fichas personalizadas, acompanhe cada série em tempo real,
              analise evolução com gráficos detalhados e transforme resultados com dados precisos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button
                size="lg"
                onClick={() => router.push('/login')}
                className="text-base px-8 h-12"
              >
                Acessar Plataforma
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/plans')}
                className="text-base px-8 h-12"
              >
                Ver Planos
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: '100%', label: 'Gratuito para testar', icon: Star },
            { value: '∞', label: 'Exercícios na biblioteca', icon: Dumbbell },
            { value: 'Real-time', label: 'Acompanhamento ao vivo', icon: Clock },
            { value: 'Seguro', label: 'Dados protegidos', icon: Shield },
          ].map((stat, i) => (
            <div key={i} className="text-center animate-fade-in" style={{ animationDelay: `${0.1 * i}s` }}>
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas profissionais para transformar a gestão dos seus alunos
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Gestão de Alunos',
                description: 'Cadastre, organize e acompanhe todos os seus alunos com perfis completos, status e evolução.',
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: Target,
                title: 'Fichas Personalizadas',
                description: 'Crie fichas de treino detalhadas com séries, repetições, carga, método e vídeos demonstrativos.',
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
              {
                icon: TrendingUp,
                title: 'Evolução em Gráficos',
                description: 'Visualize a progressão de carga, peso, medidas e desempenho com gráficos interativos.',
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
              },
              {
                icon: Dumbbell,
                title: 'Checklist de Séries',
                description: 'O aluno marca cada série realizada, registra carga e repetições em tempo real.',
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: BarChart3,
                title: 'Relatórios Completos',
                description: 'Relatórios detalhados de frequência, desempenho e evolução exportáveis em PDF.',
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
              {
                icon: Award,
                title: 'Gamificação',
                description: 'Conquistas, recordes e sequências para manter seus alunos motivados e engajados.',
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="group border border-border/50 hover:border-primary/30 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mb-4 transition-transform duration-300`}>
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Simples para o personal, ainda mais simples para o aluno
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Personal Flow */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Para o Personal</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Cadastre-se com um código exclusivo e senha segura',
                  'Adicione seus alunos e gere códigos de acesso',
                  'Crie fichas de treino personalizadas',
                  'Acompanhe treinos e evolução em tempo real',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Student Flow */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Para o Aluno</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Receba seu nome e código de acesso do personal',
                  'Acesse o sistema — sem e-mail, sem senha complicada',
                  'Visualize seu treino do dia e inicie',
                  'Marque cada série, registre carga e veja seu progresso',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="rounded-2xl bg-card border border-border/50 p-6 sm:p-14">
            <Dumbbell className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Comece a usar agora
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Acesse o sistema demo com dados de demonstração ou crie sua conta de personal trainer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => router.push('/login')}
                className="text-base px-8 h-12"
              >
                Acessar o Sistema
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button onClick={() => router.push('/terms')} className="hover:text-foreground transition-colors">
              Termos de Uso
            </button>
            <button onClick={() => router.push('/privacy')} className="hover:text-foreground transition-colors">
              Privacidade
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}
