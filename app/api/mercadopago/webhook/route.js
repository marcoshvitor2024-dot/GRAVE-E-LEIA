import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// O Mercado Pago chama esta URL automaticamente quando ha eventos de pagamento
// ou assinatura. Configure em: Suas integracoes > Webhooks, apontando para:
// https://SEUDOMINIO.com/api/mercadopago/webhook
export async function POST(request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);

    const topic = body.type || body.topic || searchParams.get("type") || searchParams.get("topic");
    const id = body.data?.id || searchParams.get("id") || searchParams.get("data.id");

    if (!topic || !id) {
      return NextResponse.json({ received: true });
    }

    if (topic === "preapproval" || topic === "subscription_preapproval") {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const preapproval = await res.json();

      const email = preapproval.payer_email || preapproval.external_reference;
      const status = preapproval.status; // authorized | paused | cancelled | pending

      if (email) {
        const subscription_status =
          status === "authorized" ? "active" : status === "cancelled" ? "canceled" : "pending";

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status,
            mercadopago_preapproval_id: id,
            updated_at: new Date().toISOString(),
          })
          .eq("email", email);
      }
    }

    // Pagamentos avulsos recorrentes de uma assinatura ja autorizada
    if (topic === "payment") {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payment = await res.json();
      const email = payment.payer?.email || payment.external_reference;

      if (email && payment.status === "approved") {
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "active",
            mercadopago_payment_id: String(id),
            updated_at: new Date().toISOString(),
          })
          .eq("email", email);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erro no webhook Mercado Pago:", err);
    return NextResponse.json({ received: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
