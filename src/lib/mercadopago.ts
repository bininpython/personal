import { MercadoPagoConfig, Preference } from 'mercadopago';

// Instanciar o SDK com o Access Token
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '', 
  options: { timeout: 5000 } 
});

export async function createCheckoutPreference(data: {
  title: string;
  price: number;
  payerName: string;
  payerEmail: string;
  externalReference: string;
  webhookUrl: string;
  returnUrl: string;
}) {
  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items: [
        {
          id: 'subscription',
          title: data.title,
          quantity: 1,
          unit_price: data.price,
        },
      ],
      payer: {
        name: data.payerName,
        email: data.payerEmail,
      },
      back_urls: {
        success: data.returnUrl,
        failure: data.returnUrl,
        pending: data.returnUrl,
      },
      auto_return: 'approved',
      notification_url: data.webhookUrl,
      external_reference: data.externalReference,
    },
  });

  return response.init_point;
}
