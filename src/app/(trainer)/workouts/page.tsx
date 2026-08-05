'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus, Search, Filter, MoreHorizontal, Calendar, User, Copy, Trash2, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

import { useEffect } from 'react';

export default function WorkoutsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/workout-plans');
        const data = await res.json();
        if (data.plans) setPlans(data.plans);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.student.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fichas de Treino</h1>
          <p className="text-muted-foreground mt-1">Gerencie os treinos dos seus alunos</p>
        </div>
        <Button onClick={() => router.push('/workouts/new')} className="h-10">
          <Plus className="w-4 h-4 mr-2" />
          Nova Ficha
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ficha ou aluno..." 
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-10 w-full sm:w-auto">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Carregando fichas...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhuma ficha encontrada.
          </div>
        ) : (
          filteredPlans.map((plan, i) => (
            <Card key={plan.id} className="border-border/50 hover:shadow-md transition-all animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardHeader className="pb-3 border-b border-border/30">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className={plan.status === 'active' ? 'text-emerald-500 border-emerald-500/30' : 'text-amber-500 border-amber-500/30'}>
                      {plan.status === 'active' ? 'Ativo' : 'Rascunho'}
                    </Badge>
                    <CardTitle className="text-lg mt-2">{plan.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <User className="w-3.5 h-3.5" />
                      {plan.student}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit3 className="w-4 h-4 mr-2 text-muted-foreground" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="w-4 h-4 mr-2 text-muted-foreground" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Objetivo</span>
                  <span className="font-medium">{plan.goal}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Frequência</span>
                  <span className="font-medium">{plan.days}x na semana</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duração média</span>
                  <span className="font-medium">{plan.duration}</span>
                </div>
                <div className="bg-muted/50 rounded-md p-2 mt-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Início:</span>
                  </div>
                  <span className="font-medium">{plan.startDate}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
