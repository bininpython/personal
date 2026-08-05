'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus, Search, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useEffect } from 'react';

interface AssessmentSummary {
  id: string;
  student: string;
  date: string;
  type: string;
  weight: number;
  weightDiff: number;
  bf: number;
  bfDiff: number;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await fetch('/api/assessments');
        const data = await res.json() as { assessments?: AssessmentSummary[]; error?: string };
        if (!res.ok) throw new Error(data.error || 'Não foi possível carregar as avaliações.');
        if (data.assessments) setAssessments(data.assessments);
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError(err instanceof Error ? err.message : 'Não foi possível carregar as avaliações.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  const filtered = assessments.filter((assessment) => assessment.student.toLowerCase().includes(search.toLowerCase()));

  const getDiffIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-amber-500" />;
    if (diff < 0) return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const formatDiff = (diff: number) => {
    if (diff > 0) return `+${diff}`;
    return diff.toString();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avaliações Físicas</h1>
          <p className="text-muted-foreground mt-1">Acompanhe a evolução corporal dos seus alunos</p>
        </div>
        <Button onClick={() => router.push('/assessments/new')} className="h-10">
          <Plus className="w-4 h-4 mr-2" />
          Nova Avaliação
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar aluno..." 
          className="pl-9 h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Carregando avaliações...
          </div>
        ) : error ? (
          <div className="col-span-full rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhuma avaliação encontrada.
          </div>
        ) : (
          filtered.map((assessment, i) => (
            <Card key={assessment.id} className="border-border/50 hover:shadow-md transition-all animate-slide-up cursor-pointer" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardHeader className="pb-3 border-b border-border/30">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{assessment.student}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {assessment.date} • {assessment.type}
                    </CardDescription>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Peso Corporal</p>
                  <p className="text-xl font-bold">{assessment.weight} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs font-medium">
                    {getDiffIcon(assessment.weightDiff)}
                    <span className={assessment.weightDiff < 0 ? 'text-emerald-500' : assessment.weightDiff > 0 ? 'text-amber-500' : 'text-muted-foreground'}>
                      {formatDiff(assessment.weightDiff)} kg
                    </span>
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Percentual Gordura</p>
                  <p className="text-xl font-bold">{assessment.bf} <span className="text-sm font-normal text-muted-foreground">%</span></p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs font-medium">
                    {getDiffIcon(assessment.bfDiff)}
                    <span className={assessment.bfDiff < 0 ? 'text-emerald-500' : assessment.bfDiff > 0 ? 'text-amber-500' : 'text-muted-foreground'}>
                      {formatDiff(assessment.bfDiff)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
