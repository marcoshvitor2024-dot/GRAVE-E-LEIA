import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail invalido." }, { status: 400 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "MERCADOPAGO_ACCESS_TOKEN nao configurado no servidor." },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const body = {
      reason: "Grave & Leia - Assinatura mensal",
      external_reference: email,
      payer_email: email,
      back_url: `${siteUrl}/app`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 5.67,
        currency_id: "BRL",
      },
      status: "pending",
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      return NextResponse.json(
        { error: data.message || "Erro ao criar assinatura no Mercado Pago." },
        { status: 502 }
      );
    }

    return NextResponse.json({ init_point: data.init_point, id: data.id });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Erro inesperado." }, { status: 500 });
  }
}
