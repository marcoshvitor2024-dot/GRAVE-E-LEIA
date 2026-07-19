"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("E-mail ou senha invalidos, ou e-mail ainda nao confirmado.");
      return;
    }
    router.push("/app");
  };

  return (
    <main className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <span className="eyebrow">Area de membro</span>
        <h2 style={{ fontSize: 28, margin: "12px 0 20px" }}>Entrar</h2>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: "var(--rec)", fontSize: 13, marginTop: 10 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16, textAlign: "center" }}>
            Nao tem conta? <Link href="/register" style={{ color: "var(--amber)" }}>Criar conta</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
