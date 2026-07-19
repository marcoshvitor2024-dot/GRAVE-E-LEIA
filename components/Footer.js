import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: 40 }}>
      <div
        className="container"
        style={{
          padding: "28px 24px",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          Grave & Leia — feito para criadores de conteudo.
        </span>
        <nav style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/privacidade" style={{ color: "var(--muted)", fontSize: 13 }}>
            Politica de privacidade
          </Link>
          <Link href="/termos" style={{ color: "var(--muted)", fontSize: 13 }}>
            Termos de uso
          </Link>
          <Link href="/contato" style={{ color: "var(--muted)", fontSize: 13 }}>
            Contato
          </Link>
        </nav>
      </div>
    </footer>
  );
}
