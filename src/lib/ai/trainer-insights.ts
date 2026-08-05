import 'server-only';
import type { getTrainerAnalytics } from '@/lib/analytics/trainer-analytics';

type TrainerAnalytics = Awaited<ReturnType<typeof getTrainerAnalytics>>;

export interface TrainerInsightResult {
  provider: 'local' | 'gemini';
  title: string;
  summary: string;
  actions: string[];
  disclaimer: string;
}

export function createLocalTrainerInsights(analytics: TrainerAnalytics): TrainerInsightResult {
  const { summary, students } = analytics;
  const actions: string[] = [];

  if (summary.atRisk > 0) {
    actions.push(`Contate primeiro os ${summary.atRisk} aluno(s) com risco alto e combine uma meta simples de retomada.`);
  }
  if (summary.attention > 0) {
    actions.push(`Revise a frequência dos ${summary.attention} aluno(s) que precisam de atenção nesta semana.`);
  }
  if (summary.averageConsistency < 60 && summary.activeStudents > 0) {
    actions.push('Reduza a complexidade das fichas com baixa adesão e acompanhe uma meta semanal objetiva.');
  }
  const progressing = students.filter((student) => student.trend === 'up').length;
  if (progressing > 0) {
    actions.push(`${progressing} aluno(s) aumentaram a frequência; reconheça a evolução e mantenha progressão gradual.`);
  }
  if (actions.length === 0) {
    actions.push('Continue registrando treinos e avaliações para formar uma base de análise mais completa.');
  }

  const summaryText = summary.activeStudents === 0
    ? 'Ainda não há alunos ativos para analisar.'
    : `A constância média está em ${summary.averageConsistency}%. Foram concluídos ${summary.workouts7d} treino(s) nos últimos 7 dias, com ${summary.atRisk} aluno(s) em risco alto.`;

  return {
    provider: 'local',
    title: 'Análise inteligente da carteira',
    summary: summaryText,
    actions,
    disclaimer: 'Análise operacional baseada em frequência e registros. Não substitui avaliação profissional ou orientação médica.',
  };
}

function extractGeminiText(payload: unknown) {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || '';
}

export async function createGeminiTrainerInsights(
  analytics: TrainerAnalytics,
): Promise<TrainerInsightResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const anonymousData = {
    summary: analytics.summary,
    weeklyWorkouts: analytics.weeklyWorkouts,
    goalDistribution: analytics.goalDistribution,
    riskDistribution: {
      low: analytics.students.filter((student) => student.risk === 'low').length,
      medium: analytics.students.filter((student) => student.risk === 'medium').length,
      high: analytics.students.filter((student) => student.risk === 'high').length,
    },
  };
  const prompt = [
    'Você analisa operações de uma pequena consultoria de personal trainer.',
    'Use somente os dados agregados e anônimos abaixo.',
    'Não dê diagnóstico médico, prescrição clínica ou recomendação perigosa.',
    'Responda em português do Brasil com um parágrafo curto e exatamente 3 ações práticas, uma por linha iniciada por "- ".',
    JSON.stringify(anonymousData),
  ].join('\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) {
      console.error('[Gemini Insights] Request failed:', response.status);
      return null;
    }

    const text = extractGeminiText(await response.json());
    if (!text) return null;
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const actions = lines.filter((line) => line.startsWith('- ')).map((line) => line.slice(2)).slice(0, 3);
    const summary = lines.filter((line) => !line.startsWith('- ')).join(' ');

    return {
      provider: 'gemini',
      title: 'Análise com Gemini Flash-Lite',
      summary: summary || createLocalTrainerInsights(analytics).summary,
      actions: actions.length > 0 ? actions : createLocalTrainerInsights(analytics).actions,
      disclaimer: 'Somente métricas agregadas e anônimas foram enviadas. A análise não substitui decisão profissional.',
    };
  } catch (error) {
    console.error('[Gemini Insights] Error:', error instanceof Error ? error.message : error);
    return null;
  }
}
