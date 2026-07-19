"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

export default function ContatoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!mensagem.trim()) {
      setErro("Escreva sua mensagem antes de enviar.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, mensagem }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nao foi possivel enviar sua mensagem.");
      setEnviado(true);
      setNome("");
      setEmail("");
      setMensagem("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ padding: "20px 24px" }}>
          <Link href="/" style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Grave <span style={{ color: "var(--rec)" }}>&</span> Leia
          </Link>
        </div>
      </div>

      <div className="container" style={{ padding: "48px 24px", maxWidth: 880 }}>
        <span className="eyebrow">Fale com a gente</span>
        <h1 style={{ fontSize: 34, margin: "14px 0 32px" }}>Contato</h1>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }} className="contato-grid">
          {/* Responsavel pelo aplicativo */}
          <div className="card" style={{ textAlign: "center", height: "fit-content" }}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                overflow: "hidden",
                margin: "0 auto 16px",
                border: "3px solid var(--amber)",
                position: "relative",
              }}
            >
              <Image
                src="/images/responsavel.png"
                alt="Responsavel pelo Grave & Leia"
                fill
                sizes="140px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <h3 style={{ fontSize: 18 }}>Marcos Vitor</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Responsavel pelo aplicativo</p>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12 }}>
              <a href="mailto:marcoshvitor.ia@gmail.com" style={{ color: "var(--amber)" }}>
                marcoshvitor.ia@gmail.com
              </a>
            </p>
          </div>

          {/* Formulario de comentarios */}
          <div className="card">
            {enviado ? (
              <div>
                <h3 style={{ marginBottom: 8 }}>Mensagem enviada!</h3>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  Obrigado pelo contato. Vamos responder o mais rapido possivel.
                </p>
                <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setEnviado(false)}>
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label htmlFor="nome">Nome (opcional)</label>
                <input
                  id="nome"
                  className="input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  style={{ marginBottom: 14 }}
                />
                <label htmlFor="email">E-mail para resposta (opcional)</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ marginBottom: 14 }}
                />
                <label htmlFor="mensagem">Sua mensagem</label>
                <textarea
                  id="mensagem"
                  className="input"
                  rows={5}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
                  required
                />
                {erro && <p style={{ color: "var(--rec)", fontSize: 13, marginTop: 10 }}>{erro}</p>}
                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={loading}>
                  {loading ? "Enviando..." : "Enviar mensagem"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .contato-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Footer />
    </main>
  );
}
