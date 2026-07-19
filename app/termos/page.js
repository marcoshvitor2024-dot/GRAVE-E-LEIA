import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = { title: "Termos de uso — Grave & Leia" };

export default function TermosPage() {
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
        <h1 style={{ fontSize: 34, margin: "14px 0 24px" }}>Termos de uso</h1>

        <div style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 15 }}>
          <p><strong style={{ color: "var(--cream)" }}>Ultima atualizacao:</strong> substitua pela data em que publicar este texto.</p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>1. Sobre o servico</h3>
          <p>
            O Grave & Leia e um aplicativo de teleprompter e geracao de roteiros
            com inteligencia artificial, oferecido mediante assinatura mensal de
            R$ 5,67.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>2. Cadastro e acesso</h3>
          <p>
            Para usar o aplicativo, voce deve criar uma conta com e-mail e senha
            e manter uma assinatura ativa. Voce e responsavel por manter sua
            senha em sigilo e por todas as atividades realizadas na sua conta.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>3. Pagamento e cancelamento</h3>
          <p>
            A assinatura e cobrada mensalmente atraves do Mercado Pago. Voce
            pode cancelar a renovacao automatica a qualquer momento diretamente
            no Mercado Pago ou solicitando pela pagina de{" "}
            <Link href="/contato" style={{ color: "var(--amber)" }}>Contato</Link>.
            Nao ha reembolso proporcional de periodos ja pagos, salvo quando
            exigido por lei.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>4. Uso adequado</h3>
          <p>
            Voce concorda em nao usar o aplicativo para gerar ou divulgar
            conteudo ilegal, difamatorio, discriminatorio ou que viole direitos
            de terceiros. Os roteiros gerados por inteligencia artificial sao
            sugestoes — voce e o responsavel final pelo conteudo publicado.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>5. Conteudo gravado</h3>
          <p>
            Os videos gravados no aplicativo ficam salvos no seu proprio
            aparelho. Voce e o unico responsavel por armazenar, editar e
            publicar os videos que produzir.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>6. Disponibilidade do servico</h3>
          <p>
            Fazemos o possivel para manter o aplicativo sempre disponivel, mas
            nao garantimos funcionamento ininterrupto. Funcionalidades como o
            modo apresentacao (duas cameras) dependem do suporte do seu
            aparelho e navegador.
          </p>

          <h3 style={{ color: "var(--cream)", fontSize: 18, marginTop: 28 }}>7. Alteracoes nestes termos</h3>
          <p>
            Podemos atualizar estes termos periodicamente. Mudancas relevantes
            serao comunicadas nesta pagina.
          </p>

          <p style={{ marginTop: 28, fontSize: 13 }}>
            Este texto e um modelo inicial e nao substitui a orientacao de um
            advogado. Revise e adapte conforme a legislacao aplicavel antes de
            publicar.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
