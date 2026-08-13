import { NextResponse } from 'next/server';
import { generateTrainerNotifications } from '@/lib/notifications/generate';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

// A geração de alertas percorre todos os personais ativos, e cada um custa
// várias consultas. Rodar tudo numa volta só, em série, era garantia de que
// um dia os últimos da lista parariam de receber alerta em silêncio — o
// tempo estoura, a rota devolve 500 e ninguém fica sabendo.
//
// Agora o trabalho é paginado por cursor: cada requisição processa lotes até
// gastar seu orçamento de tempo e, se sobrar gente, chama a si mesma para
// continuar de onde parou. A resposta sempre diz até onde foi.
const BATCH_SIZE = 5;
const PAGE_SIZE = 50;
const TIME_BUDGET_MS = 45_000;
const MAX_CHAIN_DEPTH = 20;

export async function GET(request: Request) {
  const startedAt = Date.now();
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Agendamento automático não configurado.' }, { status: 503 });
  }
  const authorization = request.headers.get('authorization');
  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const after = url.searchParams.get('after') || '';
  const depth = Number(url.searchParams.get('depth') || '0');

  try {
    const admin = createAdminClient();
    let cursor = after;
    let processed = 0;
    let generated = 0;
    let failed = 0;
    let exhausted = false;

    while (!exhausted && Date.now() - startedAt < TIME_BUDGET_MS) {
      let page = admin
        .from('trainers')
        .select('id')
        .is('deleted_at', null)
        .order('id')
        .limit(PAGE_SIZE);
      if (cursor) page = page.gt('id', cursor);

      const { data: trainers, error } = await page;
      if (error) throw error;
      if (!trainers || trainers.length === 0) {
        exhausted = true;
        break;
      }

      let pageCompleted = true;
      for (let index = 0; index < trainers.length; index += BATCH_SIZE) {
        const batch = trainers.slice(index, index + BATCH_SIZE);
        // Um personal com dado inconsistente não pode derrubar a rodada dos
        // outros: cada falha é contada e o laço segue.
        const results = await Promise.allSettled(
          batch.map((trainer) => generateTrainerNotifications(trainer.id)),
        );
        for (const result of results) {
          if (result.status === 'fulfilled') {
            generated += result.value;
          } else {
            failed += 1;
            console.error('[Cron Alerts] Trainer failed:', result.reason);
          }
        }
        processed += batch.length;
        cursor = batch.at(-1)!.id;
        if (Date.now() - startedAt >= TIME_BUDGET_MS && index + BATCH_SIZE < trainers.length) {
          pageCompleted = false;
          break;
        }
      }

      // A página só acabou a lista quando veio incompleta e foi percorrida
      // inteira; parar no meio por tempo deixa o cursor no lugar certo.
      if (pageCompleted && trainers.length < PAGE_SIZE) exhausted = true;
    }

    const hasMore = !exhausted;
    if (hasMore && depth < MAX_CHAIN_DEPTH) {
      // Continua de onde parou, sem segurar esta resposta.
      const nextUrl = new URL(url.pathname, url.origin);
      nextUrl.searchParams.set('after', cursor);
      nextUrl.searchParams.set('depth', String(depth + 1));
      void fetch(nextUrl, { headers: { authorization } }).catch((chainError) => {
        console.error('[Cron Alerts] Chain error:', chainError);
      });
    } else if (hasMore) {
      console.error('[Cron Alerts] Chain depth limit reached, stopped at cursor:', cursor);
    }

    return NextResponse.json({
      success: true,
      processed,
      generated,
      failed,
      hasMore,
      nextCursor: hasMore ? cursor : null,
      depth,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[Cron Alerts] Error:', error);
    return NextResponse.json({ error: 'Falha ao gerar alertas automáticos.' }, { status: 500 });
  }
}
