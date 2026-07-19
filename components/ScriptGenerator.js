"use client";

import { useState } from "react";

const PLATAFORMAS = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram / Reels" },
  { id: "facebook", label: "Facebook" },
  { id: "youtube_shorts", label: "YouTube Shorts" },
  { id: "youtube_longo", label: "YouTube (video longo)" },
];

export default function ScriptGenerator({ onUseScript }) {
  const [tema, setTema] = useState("");
  const [plataforma, setPlataforma] = useState("tiktok");
  const [tom, setTom] = useState("energico e direto");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState("");

  const gerar = async () => {
    if (!tema.trim()) {
      setErro("Descreva o tema ou assunto do video.");
      return;
    }
    setErro("");
    setLoading(true);
    setResultado("");
    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, plataforma, tom }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao gerar roteiro.");
      setResultado(data.roteiro);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <span className="eyebrow">Roteiro com IA</span>
      <h3 style={{ margin: "10px 0 16px" }}>Gerar roteiro viral</h3>

      <label htmlFor="tema">Sobre o que e o video?</label>
      <textarea
        id="tema"
        className="input"
        rows={3}
        placeholder="Ex: 5 dicas para economizar dinheiro no dia a dia"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
        <div>
          <label htmlFor="plataforma">Plataforma</label>
          <select
            id="plataforma"
            className="input"
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
          >
            {PLATAFORMAS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tom">Tom de voz</label>
          <input
            id="tom"
            className="input"
            value={tom}
            onChange={(e) => setTom(e.target.value)}
            placeholder="ex: engracado, inspirador..."
          />
        </div>
      </div>

      {erro && <p style={{ color: "var(--rec)", fontSize: 13, marginTop: 10 }}>{erro}</p>}

      <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={gerar} disabled={loading}>
        {loading ? "Gerando..." : "Gerar roteiro"}
      </button>

      {resultado && (
        <div style={{ marginTop: 20 }}>
          <label>Resultado</label>
          <div
            className="input"
            style={{ whiteSpace: "pre-wrap", minHeight: 140, lineHeight: 1.5, fontSize: 14 }}
          >
            {resultado}
          </div>
          <button
            className="btn btn-secondary btn-block"
            style={{ marginTop: 10 }}
            onClick={() => onUseScript(resultado)}
          >
            Usar este roteiro na gravacao
          </button>
        </div>
      )}
    </div>
  );
}
