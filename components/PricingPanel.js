"use client";

import { useState } from "react";

export default function PricingPanel() {
  const [step, setStep] = useState(1); // 1: email, 2: confirmar, 3: redirecionando
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleContinue = (e) => {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Digite um e-mail valido.");
      return;
    }
    setStep(2);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");
    if (email !== confirmEmail) {
      setError("Os e-mails nao conferem. Confira e tente novamente.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) {
        throw new Error(data.error || "Nao foi possivel iniciar o pagamento.");
      }
      window.location.href = data.init_point;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 440 }}>
      <span className="eyebrow">Plano unico</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "12px 0 4px" }}>
        <h2 style={{ fontSize: 40 }}>R$ 5,67</h2>
        <span style={{ color: "var(--muted)" }}>/ mes</span>
      </div>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 20 }}>
        Acesso completo ao teleprompter, gravacao com as duas cameras e geracao
        ilimitada de roteiros com IA. Cancele quando quiser.
      </p>

      {step === 1 && (
        <form onSubmit={handleContinue}>
          <label htmlFor="email">Seu e-mail</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p style={{ color: "var(--rec)", fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            Continuar
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handlePay}>
          <label htmlFor="confirmEmail">Confirme seu e-mail</label>
          <input
            id="confirmEmail"
            type="email"
            className="input"
            placeholder="digite novamente"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            required
          />
          {error && <p style={{ color: "var(--rec)", fontSize: 13 }}>{error}</p>}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ marginTop: 16 }}
            disabled={loading}
          >
            {loading ? "Redirecionando..." : "Pagar com Mercado Pago"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => setStep(1)}
            style={{ marginTop: 8 }}
          >
            Voltar
          </button>
        </form>
      )}

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 18, marginBottom: 0 }}>
        Depois de pagar, crie sua senha na tela de cadastro usando o mesmo
        e-mail para liberar o acesso.
      </p>
    </div>
  );
}
