import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const { nome, email, mensagem } = await request.json();

    if (!mensagem || !mensagem.trim()) {
      return NextResponse.json({ error: "Escreva uma mensagem." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("mensagens_contato").insert({
      nome: nome?.trim() || null,
      email: email?.trim() || null,
      mensagem: mensagem.trim(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Erro inesperado." }, { status: 500 });
  }
}
