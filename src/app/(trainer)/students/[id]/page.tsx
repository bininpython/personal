'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Activity, Dumbbell, ClipboardList, TrendingUp, Mail, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data
const studentData = {
  id: '1',
  name: 'João Pedro Silva',
  code: 'JP8X41',
  status: 'active',
  goal: 'Hipertrofia',
  level: 'Intermediário',
  weight: 78,
  height: 175,
  startDate: '05/01/2026',
  phone: '(11) 98765-4321',
  notes: 'Tem leve desconforto no ombro direito. Pegar leve no desenvolvimento.',
};

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/students')} className="shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Perfil do Aluno</h1>
          <p className="text-muted-foreground mt-1">Gerencie os dados e o progresso do aluno</p>
        </div>
      </div>

      {/* Header Card */}
      <Card className="border-border/50 bg-gradient-to-r from-background to-muted/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary/20">
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {studentData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{studentData.name}</h2>
                <Badge className={studentData.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                  {studentData.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Cód: <strong className="text-foreground">{studentData.code}</strong></span>
                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {studentData.goal}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Mail className="w-4 h-4 mr-2" /> Mensagem
            </Button>
            <Button className="flex-1 sm:flex-none">
              <Edit3 className="w-4 h-4 mr-2" /> Editar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto flex flex-wrap bg-transparent border-b border-border/50 rounded-none h-auto p-0 gap-6">
          {[
            { id: 'overview', label: 'Visão Geral', icon: User },
            { id: 'workouts', label: 'Fichas de Treino', icon: Dumbbell },
            { id: 'progress', label: 'Evolução', icon: TrendingUp },
            { id: 'assessments', label: 'Avaliações', icon: ClipboardList },
          ].map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={`pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1
                flex items-center gap-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground transition-colors`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Dados Físicos & Métricas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Peso Inicial</p>
                    <p className="font-bold text-lg">{studentData.weight} kg</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Altura</p>
                    <p className="font-bold text-lg">{studentData.height} cm</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Nível</p>
                    <p className="font-bold text-lg">{studentData.level}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Início</p>
                    <p className="font-bold text-lg">{studentData.startDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-amber-500/5 border-amber-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <Activity className="w-5 h-5" />
                  Observações e Restrições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {studentData.notes}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workouts" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border/50 text-center py-12">
            <CardContent>
              <Dumbbell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Nenhuma ficha ativa</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Este aluno ainda não possui uma ficha de treino ativa.
              </p>
              <Button onClick={() => router.push('/workouts/new')}>Criar Nova Ficha</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border/50 text-center py-12">
            <CardContent>
              <TrendingUp className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Dados insuficientes</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                O aluno precisa realizar mais treinos para gerarmos os gráficos de evolução de carga e frequência.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="focus-visible:outline-none focus-visible:ring-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Histórico de Avaliações Físicas</h3>
            <Button variant="outline">Nova Avaliação</Button>
          </div>
          <Card className="border-border/50 text-center py-12">
            <CardContent>
              <ClipboardList className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                Nenhuma avaliação física registrada.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
