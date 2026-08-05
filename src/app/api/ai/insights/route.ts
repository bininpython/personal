import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getTrainerAnalytics } from '@/lib/analytics/trainer-analytics';
import { createGeminiTrainerInsights, createLocalTrainerInsights } from '@/lib/ai/trainer-insights';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'trainer') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const analytics = await getTrainerAnalytics(session.trainer_id);
    const requestedProvider = new URL(request.url).searchParams.get('provider');
    const insight = requestedProvider === 'gemini'
      ? await createGeminiTrainerInsights(analytics) ?? createLocalTrainerInsights(analytics)
      : createLocalTrainerInsights(analytics);

    return NextResponse.json({ insight, geminiConfigured: Boolean(process.env.GEMINI_API_KEY) }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[AI Insights] Error:', error);
    return NextResponse.json({ error: 'Não foi possível gerar a análise.' }, { status: 500 });
  }
}
