import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    // Mercado Pago envia por query params: ?data.id=123&type=payment
    // Ou pelo body dependendo da configuração. Vamos tentar ambos.
    const body = await request.json().catch(() => ({}));
    
    const paymentId = url.searchParams.get('data.id') || body?.data?.id;
    const type = url.searchParams.get('type') || body?.type;

    if (type === 'payment' && paymentId) {
      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' });
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === 'approved' && paymentData.external_reference) {
        const admin = createAdminClient();
        const actorId = paymentData.external_reference;

        // Tenta ativar como Personal
        let result = await admin
          .from('trainers')
          .update({ status: 'active', external_payment_id: paymentId.toString() })
          .eq('id', actorId)
          .eq('status', 'pending_payment')
          .select('id')
          .maybeSingle();

        // Se não foi personal, tenta como Aluno Individual
        if (!result.data) {
          result = await admin
            .from('individual_users')
            .update({ status: 'active', external_payment_id: paymentId.toString() })
            .eq('id', actorId)
            .eq('status', 'pending_payment')
            .select('id')
            .maybeSingle();
        }

        if (result.data) {
          console.log(`[Mercado Pago] Conta ${actorId} ativada com sucesso!`);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Mercado Pago Webhook] Erro ao processar:', error);
    // Retorna 200 para evitar retentativas infinitas se for erro nosso
    return NextResponse.json({ error: 'Falha no processamento' }, { status: 200 });
  }
}
