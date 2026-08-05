'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Activity, Dumbbell, ClipboardList, TrendingUp, Mail, Edit3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function StudentProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/students/${params.id}`);
        const data = await res.json();
        
        if (!res.ok) {
          toast.error(data.error || 'Erro ao carregar aluno');
          router.push('/students');
          return;
        }

        setStudent(data.student);
      } catch (err) {
        toast.error('Erro de conexão ao carregar aluno');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aluno não encontrado.
      </div>
    );
  }

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
                {student.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{student.full_name}</h2>
                <Badge className={student.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                  {student.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {student.goal || 'Sem objetivo'}</span>
                {student.phone && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {student.phone}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Mail className="w-4 h-4 mr-2" />
              Mensagem
            </Button>
            <Button variant="secondary" className="flex-1 sm:flex-none">
              <Edit3 className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-12">
          <TabsTrigger value="overview" className="h-full">
            <User className="w-4 h-4 mr-2 hidden sm:inline" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="workouts" className="h-full">
            <Dumbbell className="w-4 h-4 mr-2 hidden sm:inline" /> Fichas
          </TabsTrigger>
          <TabsTrigger value="progress" className="h-full">
            <TrendingUp className="w-4 h-4 mr-2 hidden sm:inline" /> Evolução
          </TabsTrigger>
          <TabsTrigger value="assessments" className="h-full">
            <ClipboardList className="w-4 h-4 mr-2 hidden sm:inline" /> Avaliações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Dados Físicos & Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/40">
                    <p className="text-sm text-muted-foreground mb-1">Peso</p>
                    <p className="text-xl font-bold">{student.current_weight ? `${student.current_weight} kg` : '--'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40">
                    <p className="text-sm text-muted-foreground mb-1">Altura</p>
                    <p className="text-xl font-bold">{student.height ? `${student.height} cm` : '--'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40">
                    <p className="text-sm text-muted-foreground mb-1">Nível</p>
                    <p className="text-xl font-bold capitalize">{student.experience_level || '--'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40">
                    <p className="text-sm text-muted-foreground mb-1">Início</p>
                    <p className="text-xl font-bold">{student.start_date ? new Date(student.start_date).toLocaleDateString('pt-BR') : '--'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-amber-500/5 border-amber-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <Activity className="w-5 h-5" />
                  Observações e Lesões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {student.injuries || student.restrictions || student.notes || 'Nenhuma observação registrada.'}
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
