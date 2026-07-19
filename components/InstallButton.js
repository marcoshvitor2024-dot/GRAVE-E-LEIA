"use client";

import { useEffect, useState } from "react";

export default function InstallButton({ className = "btn btn-secondary" }) {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (!prompt) {
      alert(
        "Para instalar: no celular use o menu do navegador e toque em 'Adicionar a tela inicial'. No computador, use o icone de instalar na barra de enderecos."
      );
      return;
    }
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };

  return (
    <button className={className} onClick={handleClick}>
      ⬇ Baixar aplicativo
    </button>
  );
}
