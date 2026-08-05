'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Filter, Grid3X3, List, Plus, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Activity, Eye, Edit, Archive, Copy, Check
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
  const [copiedCode, setCopiedCode] = useState('');
  const [loading, setLoading] = useState(true);

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

  const copyAccessCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Código copiado!');
      setTimeout(() => setCopiedCode(''), 2000);
    } catch {
      toast.error('Não foi possível copiar o código.');
    }
  };

  const updateStudentStatus = async (student: StudentSummary) => {
    const nextStatus = student.status === 'active' ? 'inactive' : 'active';
    const action = nextStatus === 'inactive' ? 'arquivar' : 'reativar';
    if (!window.confirm(`Deseja ${action} ${student.name}?`)) return;
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
    }
  };

  const limitReached = students.length >= studentLimit;

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
            {students.length} de {studentLimit} alunos cadastrados
          </p>
        </div>
        <Button
          onClick={() => router.push('/students/new')}
          className="bg-primary hover:bg-primary/90 shrink-0"
          disabled={limitReached}
          title={limitReached ? `Limite de ${studentLimit} alunos atingido` : undefined}
        >
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
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} />}>
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => router.push(`/students/${student.id}`)}><Eye className="w-4 h-4 mr-2" /> Ver Perfil</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push(`/students/${student.id}#edit`)}><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => void updateStudentStatus(student)}><Archive className="w-4 h-4 mr-2" /> {student.status === 'active' ? 'Arquivar' : 'Reativar'}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-xs hover:bg-muted"
                      onClick={(event) => {
                        event.stopPropagation();
                        void copyAccessCode(student.access_code);
                      }}
                    >
                      <span className="text-muted-foreground">Código do aluno</span>
                      <span className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest">
                        {student.access_code}
                        {copiedCode === student.access_code
                          ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                          : <Copy className="h-3.5 w-3.5" />}
                      </span>
                    </button>
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
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="font-mono font-bold tracking-widest"
                        onClick={(event) => {
                          event.stopPropagation();
                          void copyAccessCode(student.access_code);
                        }}
                      >
                        {student.access_code}
                        {copiedCode === student.access_code
                          ? <Check className="ml-2 h-3.5 w-3.5 text-emerald-500" />
                          : <Copy className="ml-2 h-3.5 w-3.5" />}
                      </Button>
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
    </div>
  );
}
