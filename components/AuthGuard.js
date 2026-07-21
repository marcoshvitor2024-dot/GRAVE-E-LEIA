"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | no-session | inactive | active
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (mounted) setStatus("no-session");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (!mounted) return;

      setProfile(prof);

      if (prof && prof.subscription_status === "active") {
        setStatus("active");
      } else {
        setStatus("inactive");
      }
    };

    check();
    const { data: listener } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
        Carregando...
      </div>
    );
  }

  if (status === "no-session") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ maxWidth: 380, textAlign: "center" }}>
          <h3 style={{ marginBottom: 12 }}>Faca login</h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Voce precisa entrar para acessar o Grave & Leia.</p>
          <Link href="/login" className="btn btn-primary btn-block" style={{ marginTop: 12 }}>Ir para o login</Link>
        </div>
      </div>
    );
  }

  if (status === "inactive") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ maxWidth: 420, textAlign: "center" }}>
          <span className="badge badge-pending">Assinatura pendente</span>
          <h3 style={{ margin: "14px 0 8px" }}>Falta pouco</h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Nao encontramos uma assinatura ativa para {profile?.email || "sua conta"}.
            Finalize o pagamento para liberar o acesso ao aplicativo.
          </p>
          <Link href="/#preco" className="btn btn-primary btn-block" style={{ marginTop: 14 }}>Ver plano — R$ 5,67/mes</Link>
          <button
            className="btn btn-ghost btn-block"
            style={{ marginTop: 8 }}
            onClick={() => window.location.reload()}
          >
            Ja paguei, atualizar status
          </button>
        </div>
      </div>
    );
  }

  return children;
}
