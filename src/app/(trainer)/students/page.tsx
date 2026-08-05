'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Filter, Grid3X3, List, Plus, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Calendar, Activity, Eye, Edit, Archive, ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const students = [
  {
    id: '1', name: 'João Pedro Silva', goal: 'Hipertrofia', level: 'Intermediário',
    lastWorkout: 'Hoje', frequency: '4x/sem', completion: 92, status: 'active',
    startDate: '07/05/2026', nextAssessment: '15/08/2026', trend: 'up',
    weight: '78 kg', height: '175 cm',
  },
  {
    id: '2', name: 'Maria Oliveira', goal: 'Emagrecimento', level: 'Iniciante',
    lastWorkout: 'Ontem', frequency: '3x/sem', completion: 78, status: 'active',
    startDate: '05/06/2026', nextAssessment: '20/08/2026', trend: 'up',
    weight: '65 kg', height: '162 cm',
  },
  {
    id: '3', name: 'Carlos Santos', goal: 'Força', level: 'Avançado',
    lastWorkout: 'Há 2 dias', frequency: '5x/sem', completion: 95, status: 'active',
    startDate: '05/02/2026', nextAssessment: '10/08/2026', trend: 'stable',
    weight: '92 kg', height: '182 cm',
  },
  {
    id: '4', name: 'Ana Beatriz Costa', goal: 'Condicionamento', level: 'Intermediário',
    lastWorkout: 'Há 4 dias', frequency: '3x/sem', completion: 60, status: 'active',
    startDate: '20/06/2026', nextAssessment: '25/08/2026', trend: 'down',
    weight: '58 kg', height: '168 cm',
  },
  {
    id: '5', name: 'Lucas Mendes', goal: 'Definição Muscular', level: 'Intermediário',
    lastWorkout: 'Ontem', frequency: '4x/sem', completion: 85, status: 'active',
    startDate: '06/04/2026', nextAssessment: '18/08/2026', trend: 'up',
    weight: '82 kg', height: '178 cm',
  },
];

export default function StudentsPage() {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        if (data.students) setStudents(data.students);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Ativo</Badge>;
      case 'inactive': return <Badge variant="secondary" className="text-[10px]">Inativo</Badge>;
      case 'blocked': return <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">Arquivado</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />;
    if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />;
    return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Alunos
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} encontrado{filteredStudents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => router.push('/students/new')} className="bg-primary hover:bg-primary/90 shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Cadastrar Aluno
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
          <SelectTrigger className="w-full sm:w-[160px] h-10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="blocked">Bloqueados</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Carregando alunos...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Nenhum aluno encontrado.
            </div>
          ) : (
            filteredStudents.map((student, i) => (
              <Card
                key={student.id}
                className="group border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${0.05 * i}s` }}
                onClick={() => router.push(`/students/${student.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm">{student.name}</h3>
                        <p className="text-xs text-muted-foreground">{student.goal}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Ver Perfil</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive"><Archive className="w-4 h-4 mr-2" /> Arquivar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Conclusão</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{student.completion}%</span>
                        {getTrendIcon(student.trend)}
                      </div>
                    </div>
                    <Progress value={student.completion} className="h-1.5" />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Último treino</span>
                        <p className="font-medium">{student.lastWorkout}</p>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Frequência</span>
                        <p className="font-medium">{student.frequency}</p>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Nível</span>
                        <p className="font-medium">{student.level}</p>
                      </div>
                      <div className="text-xs">
                        {getStatusBadge(student.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card className="border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Aluno</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Objetivo</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Último Treino</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Conclusão</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Carregando alunos...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Nenhum aluno encontrado.
                    </td>
                  </tr>
                ) : filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/students/${student.id}`)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{student.goal}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm hidden sm:table-cell">{student.goal}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{student.lastWorkout}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{student.completion}%</span>
                        {getTrendIcon(student.trend)}
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">{getStatusBadge(student.status)}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/students/${student.id}`); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
