import Link from "next/link";
import InstallButton from "@/components/InstallButton";
import PricingPanel from "@/components/PricingPanel";
import Footer from "@/components/Footer";

const FUNCOES = [
  { n: "01", t: "Teleprompter vertical", d: "Grave na vertical enquanto o roteiro rola por cima da camera." },
  { n: "02", t: "Teleprompter horizontal", d: "Grave na horizontal com o texto passando ao lado da imagem." },
  { n: "03", t: "Velocidade e fonte", d: "Ajuste a velocidade da rolagem, edite o texto e o tamanho da fonte a qualquer momento." },
  { n: "04", t: "Frontal ou traseira", d: "Escolha qual camera do aparelho usar antes de gravar." },
  { n: "05", t: "Modo apresentacao", d: "Grave com as duas cameras ao mesmo tempo: voce falando e o que esta apresentando." },
  { n: "06", t: "Roteiro viral com IA", d: "Gere roteiros para TikTok, Reels, Facebook, Shorts e videos longos do YouTube." },
  { n: "07", t: "Gravar e pausar", d: "Um botao para iniciar, pausar e retomar a gravacao sem perder o texto." },
  { n: "08", t: "Texto animado colorido", d: "Ative a legenda animada com palavras coloridas acompanhando a narracao." },
];

export default function LandingPage() {
  return (
    <main>
      <section style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ padding: "20px 24px" }}>
          <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Grave <span style={{ color: "var(--rec)" }}>&</span> Leia
            </strong>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href="/login" className="btn btn-ghost">Entrar</Link>
              <Link href="/register" className="btn btn-secondary">Criar conta</Link>
            </div>
          </nav>
        </div>
      </section>

      <section className="container" style={{ padding: "72px 24px 40px" }}>
        <span className="eyebrow">Gravando agora</span>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.02, margin: "16px 0" }}>
          Leia o roteiro na tela.
          <br />
          Grave sem travar.
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 18, maxWidth: 560, marginBottom: 28 }}>
          O teleprompter que cabe no bolso: grave na vertical ou horizontal,
          use as duas cameras no modo apresentacao e gere roteiros virais com
          inteligencia artificial antes de apertar o REC.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/register" className="btn btn-primary">Comecar agora — R$ 5,67/mes</Link>
          <InstallButton />
        </div>
      </section>

      <section className="container" style={{ padding: "40px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {FUNCOES.map((f) => (
            <div className="card" key={f.n}>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--amber)", fontSize: 13 }}>{f.n}</span>
              <h3 style={{ fontSize: 18, margin: "10px 0 8px" }}>{f.t}</h3>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: 14, lineHeight: 1.5 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="preco" className="container" style={{ padding: "0 24px 96px", display: "flex", justifyContent: "center" }}>
        <PricingPanel />
      </section>

      <Footer />
    </main>
  );
}
