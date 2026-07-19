# Grave & Leia

PWA de teleprompter para gravar videos lendo o roteiro na tela, com gerador
de roteiros virais por IA (Groq), area de membros (Supabase Auth) e
assinatura recorrente de R$ 5,67/mes (Mercado Pago).

## Funcionalidades

1. Gravacao vertical com o roteiro passando por cima da camera.
2. Gravacao horizontal com o roteiro passando do lado.
3. Ajuste de velocidade do texto, edicao do roteiro e do tamanho da fonte.
4. Escolha entre camera frontal ou traseira.
5. Modo apresentacao: grava com as duas cameras ao mesmo tempo (frontal +
   traseira compostas em uma so gravacao).
6. Gerador de roteiro viral com IA (Groq) para TikTok, Instagram, Facebook,
   YouTube Shorts e YouTube (video longo).
7. Botao de gravar/pausar/parar.
8. Modo "video animado": legenda colorida gravada junto com o video.
9. Aba de gravacao com todas as configuracoes reunidas.
10. Area de membro com Supabase (login com e-mail e senha).
11. Painel de assinatura de R$ 5,67/mes via Mercado Pago (producao).
12. Rodape com links para Politica de Privacidade, Termos de Uso e Contato.
13. Pagina de Contato com foto e nome do responsavel pelo aplicativo, mais um
    formulario onde visitantes podem deixar comentarios/mensagens (salvos no
    Supabase).

## Pagina de Contato

O responsavel exibido na pagina de Contato e Marcos Vitor
(marcoshvitor.ia@gmail.com). Para trocar o nome/e-mail, edite
`app/contato/page.js`. A foto usada e `public/images/responsavel.png` —
para trocar, basta substituir esse arquivo por outra imagem com o mesmo
nome.

## 1. Pre-requisitos

- Conta no [Supabase](https://supabase.com)
- Conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
  com credenciais de **producao**
- Conta na [Groq](https://console.groq.com) (API key gratuita)
- Conta no GitHub e na [Vercel](https://vercel.com)
- Node.js 18+ instalado (para testar localmente)

## 2. Configurar o Supabase

1. Crie um novo projeto no Supabase.
2. Va em **SQL Editor** e execute o conteudo do arquivo `supabase/schema.sql`
   deste projeto. Isso cria a tabela `profiles` (com o campo
   `subscription_status`) e a tabela `roteiros`.
3. Em **Authentication > Settings**, confirme que "Enable email confirmations"
   esta ativado (recomendado).
4. Em **Authentication > URL Configuration**, adicione a URL do seu site
   (ex: `https://seusite.vercel.app`) em "Site URL" e em "Redirect URLs".
5. Copie em **Project Settings > API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (mantenha em segredo, so
     usada no servidor)

## 3. Configurar a Groq

1. Gere uma API key em https://console.groq.com/keys
2. Coloque em `GROQ_API_KEY`.

## 4. Configurar o Mercado Pago

1. No painel de desenvolvedores, pegue seu **Access Token de producao** e
   coloque em `MERCADOPAGO_ACCESS_TOKEN`.
2. Depois do primeiro deploy, configure o Webhook do Mercado Pago apontando
   para:
   `https://SEUDOMINIO.vercel.app/api/mercadopago/webhook`
   Selecione os topicos **preapproval** (assinaturas) e **payment**.
3. O fluxo de cobranca usa o produto de **assinaturas (preapproval)** do
   Mercado Pago: o usuario informa o e-mail, e o app cria uma assinatura de
   R$ 5,67/mes e redireciona para o checkout do Mercado Pago. Quando o
   pagamento e aprovado, o webhook ativa o acesso automaticamente
   (`subscription_status = 'active'`) na tabela `profiles`, casando pelo
   e-mail.

## 5. Variaveis de ambiente

Copie `.env.example` para `.env` (ja existe um `.env` de exemplo na raiz,
so preencher) e informe todas as chaves:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_SITE_URL=https://seusite.vercel.app
```

**Importante:** o arquivo `.env` esta no `.gitignore` e nunca sera enviado
ao GitHub — isso e proposital, para proteger suas chaves. Isso tambem
significa que a Vercel **nao le esse arquivo**. Depois de subir o projeto,
cadastre as mesmas variaveis manualmente em:
**Vercel > seu projeto > Settings > Environment Variables**.

## 6. Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## 7. Subir para o GitHub

```bash
git init
git add .
git commit -m "Grave & Leia"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/grave-e-leia.git
git push -u origin main
```

## 8. Deploy na Vercel

1. Va em https://vercel.com/new e importe o repositorio.
2. Framework detectado automaticamente: **Next.js**.
3. Antes de finalizar, adicione as variaveis de ambiente da secao 5 em
   **Environment Variables**.
4. Clique em **Deploy**.
5. Depois do deploy, volte ao painel do Mercado Pago e configure o webhook
   com a URL final (secao 4).

## Estrutura do projeto

```
app/
  page.js                  landing page + painel de preco
  login/page.js
  register/page.js
  app/page.js               area logada (Gravar / Roteiro IA)
  api/groq/route.js         gera roteiro com IA (chave protegida)
  api/mercadopago/create-preference/route.js   cria assinatura
  api/mercadopago/webhook/route.js             ativa acesso apos pagamento
components/
  Teleprompter.js           camera, texto rolando, gravacao
  ScriptGenerator.js        gerador de roteiro com IA
  AuthGuard.js               protege a area logada
  PricingPanel.js            painel de assinatura
  InstallButton.js            botao "baixar aplicativo" (PWA)
lib/
  supabaseClient.js          cliente publico (navegador)
  supabaseAdmin.js           cliente privado (somente API routes)
supabase/schema.sql          script SQL para criar as tabelas
public/manifest.json, sw.js  configuracao do PWA
```

## Observacoes tecnicas

- O modo apresentacao (duas cameras ao mesmo tempo) depende do
  navegador/aparelho permitir abrir duas cameras simultaneamente. Em alguns
  celulares isso pode nao funcionar; o app avisa o usuario quando isso
  acontece.
- Nenhuma chave de API fica exposta no navegador: Groq, Supabase
  service role e Mercado Pago so sao usadas dentro das rotas
  `app/api/**/route.js`, que rodam no servidor da Vercel.
- O botao "Baixar aplicativo" usa o recurso nativo de instalacao de PWA do
  navegador (`beforeinstallprompt`). Em navegadores que nao dao suporte,
  o app mostra instrucoes para adicionar a tela inicial manualmente.
