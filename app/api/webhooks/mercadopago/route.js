import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function validarAssinatura(req, body) {
  const signature = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');

  if (!signature) return false;

  // O header x-signature vem no formato: "ts=123456,v1=hash..."
  const parts = signature.split(',');
  let ts = '';
  let hash = '';

  parts.forEach((part) => {
    const [key, value] = part.split('=');
    if (key.trim() === 'ts') ts = value.trim();
    if (key.trim() === 'v1') hash = value.trim();
  });

  const dataId = body?.data?.id || '';

  // Monta o "manifest" exatamente como o Mercado Pago pede
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const hmac = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');

  return hmac === hash;
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Valida se a notificação realmente veio do Mercado Pago
    const assinaturaValida = validarAssinatura(req, body);

    if (!assinaturaValida) {
      console.error('Assinatura inválida - possível tentativa de fraude');
      return new Response('Assinatura inválida', { status: 401 });
    }

    if (body.type === 'subscription_preapproval') {
      const preapprovalId = body.data.id;

      const res = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
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
