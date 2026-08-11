'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Grid3X3, List, Plus, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Activity, Eye, Edit, Archive, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
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
import { MAX_STUDENTS_PER_TRAINER } from '@/constants';
import { toast } from 'sonner';

interface StudentSummary {
  id: string;
  name: string;
  access_code: string;
  goal: string;
  level: string;
  lastWorkout: string;
  frequency: string;
  completion: number;
  status: string;
  trend: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [studentLimit, setStudentLimit] = useState(MAX_STUDENTS_PER_TRAINER);
  const [loading, setLoading] = useState(true);
  // Arquivar derruba as sessões abertas do aluno. Isso merece um diálogo do
  // próprio sistema visual, com o efeito escrito, e não a caixa nativa do
  // navegador — que no celular aparece colada no topo, sem contexto.
  const [statusChange, setStatusChange] = useState<StudentSummary | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar alunos');
        setStudents(data.students || []);
        setStudentLimit(data.student_limit || MAX_STUDENTS_PER_TRAINER);
      } catch {
        toast.error('Não foi possível carregar os alunos.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const updateStudentStatus = async (student: StudentSummary) => {
    const nextStatus = student.status === 'active' ? 'inactive' : 'active';
    const action = nextStatus === 'inactive' ? 'arquivar' : 'reativar';
    setStatusChange(null);
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || `Não foi possível ${action} o aluno.`);
      setStudents((current) => current.map((item) => item.id === student.id ? { ...item, status: nextStatus } : item));
      toast.success(nextStatus === 'inactive' ? 'Aluno arquivado.' : 'Aluno reativado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Não foi possível ${action} o aluno.`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const activeStudentCount = students.filter((student) => student.status === 'active').length;
  const limitReached = activeStudentCount >= studentLimit;

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="border-ok/20 bg-ok-wash text-ok text-[10px]">Ativo</Badge>;
      case 'inactive': return <Badge variant="secondary" className="text-[10px]">Inativo</Badge>;
      case 'blocked': return <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">Arquivado</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5 text-ok" />;
    if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5 text-danger" />;
    return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        kicker="Operação"
        title="Alunos"
        description={`${activeStudentCount} de ${studentLimit} alunos ativos · ${students.length} no total`}
        actions={
          <Button
            onClick={() => router.push('/students/new')}
            className="h-11"
            disabled={limitReached}
            title={limitReached ? `Limite de ${studentLimit} alunos atingido` : undefined}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo aluno
          </Button>
        }
      />

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
                className="group cursor-pointer transition-all duration-300 hover:border-volt-strong/40 hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${0.05 * i}s` }}
                onClick={() => router.push(`/students/${student.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-black font-black text-brand-accent dark:bg-brand-accent dark:text-black">
                          {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm">{student.name}</h3>
                        <p className="text-xs text-muted-foreground">{student.goal}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} />}>
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/students/${student.id}`)}><Eye className="w-4 h-4 mr-2" /> Ver Perfil</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/students/${student.id}#edit`)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setStatusChange(student)}><Archive className="w-4 h-4 mr-2" /> {student.status === 'active' ? 'Arquivar' : 'Reativar'}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex w-full items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">Últimos dígitos do código</span>
                      <span className="font-mono text-sm font-bold tracking-widest">{student.access_code}</span>
                    </div>
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
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Código</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Último Treino</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Conclusão</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Carregando alunos...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
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
                          <AvatarFallback className="bg-black text-xs font-black text-brand-accent dark:bg-brand-accent dark:text-black">
                            {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{student.goal}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm hidden sm:table-cell">{student.goal}</td>
                    <td className="p-4">
                      <span className="font-mono text-sm font-bold tracking-widest">{student.access_code}</span>
                    </td>
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

      <Dialog open={Boolean(statusChange)} onOpenChange={(open) => !open && setStatusChange(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusChange?.status === 'active' ? 'Arquivar aluno' : 'Reativar aluno'}
            </DialogTitle>
            <DialogDescription>
              {statusChange?.status === 'active'
                ? `${statusChange?.name} deixa de contar no seu limite e perde o acesso ao app — as sessões abertas dele são encerradas. O histórico e as fichas continuam guardados.`
                : `${statusChange?.name} volta a contar no seu limite de alunos ativos e recupera o acesso com o mesmo código.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChange(null)} disabled={updatingStatus}>
              Cancelar
            </Button>
            <Button
              variant={statusChange?.status === 'active' ? 'destructive' : 'default'}
              onClick={() => statusChange && void updateStudentStatus(statusChange)}
              disabled={updatingStatus}
            >
              {updatingStatus && <Loader2 className="mr-2 size-4 animate-spin" />}
              {statusChange?.status === 'active' ? 'Arquivar' : 'Reativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
