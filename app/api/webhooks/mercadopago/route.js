import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // atenção: use a Service Role Key aqui, não a anon key
);

export async function POST(req) {
  try {
    const body = await req.json();

    if (body.type === 'subscription_preapproval') {
      const preapprovalId = body.data.id;

      // Busca os detalhes da assinatura direto na API do Mercado Pago
      const res = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,`,
          },
        }
      );
      const subscription = await res.json();

      const userId = subscription.external_reference;
      let newStatus = 'inactive';

      if (subscription.status === 'authorized') newStatus = 'active';
      if (subscription.status === 'paused') newStatus = 'paused';
      if (subscription.status === 'cancelled') newStatus = 'cancelled';

      await supabase
        .from('subscriptions')
        .update({
          status: newStatus,
          mp_preapproval_id: preapprovalId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Erro no webhook:', err);
    return new Response('Erro', { status: 500 });
  }
}
