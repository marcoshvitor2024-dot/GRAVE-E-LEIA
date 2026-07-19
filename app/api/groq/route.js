import { NextResponse } from "next/server";

const PLATAFORMA_LABEL = {
  tiktok: "TikTok (vertical, ate 60s, gancho nos 2 primeiros segundos)",
  instagram: "Instagram Reels (vertical, dinamico, com call to action no final)",
  facebook: "Facebook (linguagem direta, funciona vertical ou quadrado)",
  youtube_shorts: "YouTube Shorts (vertical, ate 60s, gancho forte no inicio)",
  youtube_longo: "YouTube video longo (roteiro estruturado com introducao, desenvolvimento e encerramento)",
};

export async function POST(request) {
  try {
    const { tema, plataforma, tom } = await request.json();

    if (!tema || !tema.trim()) {
      return NextResponse.json({ error: "Informe o tema do video." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY nao configurada no servidor." },
        { status: 500 }
      );
    }

    const plataformaTexto = PLATAFORMA_LABEL[plataforma] || plataforma;

    const systemPrompt = `Voce e um roteirista especialista em videos virais para redes sociais.
Escreva roteiros prontos para serem lidos em um teleprompter enquanto a pessoa grava.
Regras:
- Use frases curtas, faceis de narrar em voz alta.
- Comece com um gancho forte nas 2 primeiras linhas para prender a atencao.
- Adapte o formato para: ${plataformaTexto}.
- Tom de voz: ${tom || "natural"}.
- Termine com uma chamada para acao (like, comentario, seguir ou compartilhar).
- Responda APENAS com o roteiro, sem explicacoes, sem markdown, sem titulos tecnicos.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Tema do video: ${tema}` },
        ],
        temperature: 0.8,
        max_tokens: 700,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: "Erro ao gerar roteiro na Groq: " + errText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const roteiro = data?.choices?.[0]?.message?.content?.trim();

    if (!roteiro) {
      return NextResponse.json({ error: "A IA nao retornou um roteiro." }, { status: 502 });
    }

    return NextResponse.json({ roteiro });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Erro inesperado." }, { status: 500 });
  }
}
