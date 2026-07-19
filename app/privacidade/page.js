import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = { title: "Politica de privacidade — Grave & Leia" };

export default function PrivacidadePage() {
  return (
    <main>
      <div style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ padding: "20px 24px" }}>
          <Link href="/" style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Grave <span style={{ color: "var(--rec)" }}>&</span> Leia
          </Link>
        </div>
      </div>

      <div className="container" style={{ padding: "48px 24px", maxWidth: 760 }}>
        <span className="eyebrow">Documento</span>
        <h1 style={{ fontSize: 34, margin: "14px 0 24px" }}>Politica de privacidade</h1>

        <div style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 15 }}>
          <p><strong style={{ color: "var(--cream)" }}>Ultima atualizacao:</strong> substitua pela data em que publicar este texto.</p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>1. Quais dados coletamos</h3>
          <p>
            Coletamos o e-mail e a senha (armazenada de forma criptografada) usados
            no cadastro, dados de pagamento processados pelo Mercado Pago (nao
            armazenamos numero de cartao), os roteiros que voce gera ou digita
            dentro do aplicativo, e mensagens enviadas pelo formulario de contato.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>2. Acesso a camera e microfone</h3>
          <p>
            O Grave & Leia pede acesso a camera e ao microfone do seu aparelho
            apenas para gravar os videos que voce cria dentro do app. As
            gravacoes ficam no seu proprio aparelho — nao enviamos seus videos
            para nossos servidores.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>3. Como usamos seus dados</h3>
          <p>
            Usamos seus dados para autenticar seu login, liberar o acesso apos o
            pagamento da assinatura, gerar roteiros com inteligencia artificial
            a partir do tema que voce descreve, e responder mensagens enviadas
            pelo formulario de contato.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>4. Compartilhamento com terceiros</h3>
          <p>
            Utilizamos os seguintes prestadores de servico para operar o
            aplicativo: Supabase (autenticacao e banco de dados), Mercado Pago
            (processamento de pagamentos) e Groq (geracao de roteiros por IA).
            Cada um desses servicos processa apenas os dados estritamente
            necessarios para a funcao que realiza.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>5. Seus direitos</h3>
          <p>
            Voce pode solicitar a exclusao da sua conta e dos seus dados a
            qualquer momento entrando em contato pela pagina de{" "}
            <Link href="/contato" style={{ color: "var(--amber)" }}>Contato</Link>.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>6. Contato</h3>
          <p>
            Duvidas sobre esta politica podem ser enviadas pela nossa pagina de{" "}
            <Link href="/contato" style={{ color: "var(--amber)" }}>Contato</Link>.
          </p>

          <p style={{ marginTop: 28, fontSize: 13 }}>
            Este texto e um modelo inicial e nao substitui a orientacao de um
            advogado. Revise e adapte conforme a legislacao aplicavel (como a
            LGPD) antes de publicar.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
