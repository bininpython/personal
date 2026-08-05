'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Bot, Download, Loader2, RefreshCw, Sparkles, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AnalyticsStudent {
  id: string;
  name: string;
  goal: string;
  workouts7d: number;
  workouts30d: number;
  plannedFrequency: number;
  completionAverage: number;
  consistencyScore: number;
  daysSinceLastWorkout: number | null;
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface AnalyticsData {
  generatedAt: string;
  summary: {
    activeStudents: number;
    atRisk: number;
    attention: number;
    averageConsistency: number;
    workouts7d: number;
    workouts30d: number;
  };
  students: AnalyticsStudent[];
  weeklyWorkouts: Array<{ label: string; workouts: number }>;
}

interface InsightData {
  provider: 'local' | 'gemini';
  title: string;
  summary: string;
  actions: string[];
  disclaimer: string;
}

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsResponse, insightResponse] = await Promise.all([
        fetch('/api/analytics', { cache: 'no-store' }),
        fetch('/api/ai/insights', { cache: 'no-store' }),
      ]);
      const analyticsData = await analyticsResponse.json() as AnalyticsData & { error?: string };
      const insightData = await insightResponse.json() as { insight?: InsightData; geminiConfigured?: boolean; error?: string };
      if (!analyticsResponse.ok) throw new Error(analyticsData.error || 'Não foi possível gerar o relatório.');
      setAnalytics(analyticsData);
      if (insightResponse.ok) {
        setInsight(insightData.insight ?? null);
        setGeminiConfigured(Boolean(insightData.geminiConfigured));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar o relatório.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadReport(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadReport]);

  async function generateWithAi() {
    setGeneratingAi(true);
    try {
      const response = await fetch('/api/ai/insights?provider=gemini', { cache: 'no-store' });
      const data = await response.json() as { insight?: InsightData; error?: string };
      if (!response.ok || !data.insight) throw new Error(data.error || 'Não foi possível gerar a análise.');
      setInsight(data.insight);
      toast.success(data.insight.provider === 'gemini' ? 'Análise do Gemini atualizada.' : 'Motor local utilizado; configure a chave do Gemini para aprimorar o texto.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível gerar a análise.');
    } finally {
      setGeneratingAi(false);
    }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 size-6 animate-spin" /> Analisando desempenho...</div>;
  if (!analytics) return <div className="rounded-xl border border-destructive/30 p-8 text-center text-destructive">Relatório indisponível.</div>;

  return (
    <div className="print-report space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Relatório de desempenho</h1><p className="mt-1 text-muted-foreground">Constância, risco, adesão e evolução da carteira.</p></div><div className="no-print flex gap-2"><Button variant="outline" onClick={() => void loadReport()}><RefreshCw className="mr-2 size-4" /> Atualizar</Button><Button onClick={() => window.print()}><Download className="mr-2 size-4" /> Salvar em PDF</Button></div></div>
      <p className="text-xs text-muted-foreground">Gerado em {new Date(analytics.generatedAt).toLocaleString('pt-BR')}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[
        { label: 'Alunos ativos', value: analytics.summary.activeStudents, icon: Users },
        { label: 'Constância média', value: `${analytics.summary.averageConsistency}%`, icon: BarChart3 },
        { label: 'Treinos em 7 dias', value: analytics.summary.workouts7d, icon: BarChart3 },
        { label: 'Treinos em 30 dias', value: analytics.summary.workouts30d, icon: BarChart3 },
        { label: 'Risco alto', value: analytics.summary.atRisk, icon: AlertTriangle },
      ].map((item) => <Card key={item.label}><CardContent className="p-4"><item.icon className="mb-2 size-4 text-primary" /><p className="text-2xl font-bold">{item.value}</p><p className="text-xs text-muted-foreground">{item.label}</p></CardContent></Card>)}</div>

      <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">Treinos concluídos por semana</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.weeklyWorkouts}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="workouts" name="Treinos" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="border-violet-500/20 bg-violet-500/[0.04]"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><Bot className="size-5 text-violet-600" /> {insight?.title || 'Análise inteligente'}</CardTitle><Badge variant="outline">{insight?.provider === 'gemini' ? 'Gemini' : 'Local · custo zero'}</Badge></div></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-relaxed">{insight?.summary}</p><ul className="space-y-2">{insight?.actions.map((action) => <li key={action} className="flex gap-2 text-sm"><Sparkles className="mt-0.5 size-4 shrink-0 text-violet-600" /> {action}</li>)}</ul><p className="text-[11px] text-muted-foreground">{insight?.disclaimer}</p><Button className="no-print" variant="outline" onClick={() => void generateWithAi()} disabled={generatingAi}>{generatingAi && <Loader2 className="mr-2 size-4 animate-spin" />} {geminiConfigured ? 'Atualizar com Gemini' : 'Testar IA (usa motor local)'}</Button></CardContent></Card></div>

      <Card><CardHeader><CardTitle className="text-base">Desempenho por aluno</CardTitle></CardHeader><CardContent className="space-y-4">{analytics.students.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum aluno para analisar.</p> : analytics.students.map((student) => <div key={student.id} className="rounded-xl border p-4"><div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{student.name}</p><p className="text-xs text-muted-foreground">{student.goal} · {student.workouts7d}/{student.plannedFrequency} treino(s) nesta semana</p></div><Badge variant="outline" className={student.risk === 'high' ? 'border-red-500/30 text-red-600' : student.risk === 'medium' ? 'border-amber-500/30 text-amber-600' : 'border-emerald-500/30 text-emerald-600'}>{student.risk === 'high' ? 'Risco alto' : student.risk === 'medium' ? 'Atenção' : 'Bom ritmo'}</Badge></div><div className="flex items-center gap-3"><Progress value={student.consistencyScore} className="flex-1" /><strong className="text-sm">{student.consistencyScore}%</strong></div><p className="mt-3 text-xs text-muted-foreground">{student.recommendation}</p></div>)}</CardContent></Card>
    </div>
  );
}
