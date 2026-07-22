"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Teleprompter from "@/components/Teleprompter";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_SCRIPT =
  "Bem-vindo ao Grave e Leia! Escreva ou cole aqui o seu roteiro. " +
  "Ajuste a velocidade e o tamanho da fonte nas configuracoes ao lado. " +
  "Quando estiver pronto, aperte o botao vermelho para gravar.";

export default function AppPage() {
  const router = useRouter();
  const [scriptText, setScriptText] = useState(DEFAULT_SCRIPT);
  const [settings, setSettings] = useState({
    orientation: "vertical",
    facing: "user",
    presentation: false,
    speed: 4,
    fontSize: 28,
    animatedText: false,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <AuthGuard>
      <main style={{ minHeight: "100vh" }}>
        <div style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="container" style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
              Grave <span style={{ color: "var(--rec)" }}>&</span> Leia
            </strong>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="btn btn-ghost" onClick={handleLogout}>Sair</button>
            </div>
          </div>
        </div>
        <div className="container" style={{ padding: "28px 24px 60px" }}>
          <Teleprompter
            scriptText={scriptText}
            setScriptText={setScriptText}
            settings={settings}
            setSettings={setSettings}
          />
        </div>
      </main>
    </AuthGuard>
  );
}
