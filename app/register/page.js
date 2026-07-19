"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setSent(true);
  };

  return (
    <main className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <span className="eyebrow">Criar conta</span>
        <h2 style={{ fontSize: 28, margin: "12px 0 20px" }}>Grave & Leia</h2>

        {sent ? (
          <div>
            <p style={{ color: "var(--cream)" }}>
              Enviamos um link de confirmacao para <strong>{email}</strong>.
              Abra seu e-mail e confirme para poder entrar.
            </p>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Ja pagou a assinatura? Depois de confirmar o e-mail, faca login
              normalmente — se o pagamento ja foi aprovado, o acesso libera
              automaticamente.
            </p>
            <Link href="/login" className="btn btn-secondary btn-block" style={{ marginTop: 8 }}>
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginBottom: 14 }}
            />
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className="input"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p style={{ color: "var(--rec)", fontSize: 13, marginTop: 10 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </button>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16, textAlign: "center" }}>
              Ja tem conta? <Link href="/login" style={{ color: "var(--amber)" }}>Entrar</Link>
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, textAlign: "center" }}>
              Ainda nao assinou? <Link href="/#preco" style={{ color: "var(--amber)" }}>Ver o plano</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
