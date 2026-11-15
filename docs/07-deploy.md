# 07 · Deploy: Supabase, GitHub e Vercel

Ordem: Supabase → banco local ligado → GitHub → Vercel → ajustes finais. Leva uns 30 minutos.

Nunca cole a **service_role key** em lugar nenhum do app nem do GitHub. O app usa só a chave **publicável**.

---

## 1. Criar o projeto no Supabase

1. Entre em [supabase.com](https://supabase.com) → **New project**.
2. Nome: `alinhavo`. Região: **South America (São Paulo)**.
3. Crie uma senha forte para o banco e **guarde num gerenciador de senhas** (vai para o GitHub depois).
4. Quando o projeto estiver pronto, anote:
   - **Project ref**: o código em *Project Settings → General* (ex.: `abcdefghijklmnop`).
   - **Project URL** e **Publishable key** (`sb_publishable_…`): em *Project Settings → API Keys*.

### Login no app
Em *Authentication → URL Configuration*:
- **Site URL**: `http://localhost:3000` por enquanto (troque pela URL da Vercel no passo 5).
- **Redirect URLs**: adicione `http://localhost:3000/auth/callback`.

### Login com senha
O app entra com e-mail e senha (o link mágico fica como opção). Para criar conta sem receber e-mail nenhum, em *Authentication → Sign In / Providers → Email* desligue **Confirm email**. Se ficar ligado, o cadastro manda um link de confirmação uma vez; depois disso, entra-se só com a senha.

> Com **Confirm email** desligado, o e-mail da conta não é verificado: qualquer pessoa pode criar conta com um endereço que não é dela. O que protege a organização é a RLS e, no convite, o link secreto (token) que só o dono copia e envia. Antes de abrir para usuários de verdade, religue a confirmação, ou faça o convite exigir e-mail confirmado (migração em `accept_invite`).

> O envio de e-mail embutido do Supabase manda poucos e-mails por hora e serve só para teste. Antes de chamar usuários de verdade, configure um SMTP próprio (ex.: Resend) em *Authentication → Emails → SMTP Settings*.

## 2. Ligar o projeto local ao Supabase

No terminal, na pasta do projeto:

```bash
npx supabase login
```

```bash
npm run db:link -- --project-ref SEU_PROJECT_REF
```

```bash
npm run db:push
```

```bash
npm run db:types
```

O `db:push` aplica as migrações. O `db:types` gera os tipos do banco no lugar do arquivo provisório. Depois copie `apps/web/.env.example` para `apps/web/.env.local`, preencha a URL e a chave publicável e rode:

```bash
npm run check
```

```bash
npm run dev
```

Teste em http://localhost:3000/entrar.

## 3. Publicar no GitHub

1. Em [github.com/new](https://github.com/new): nome `alinhavo`, **Private**, sem README, sem .gitignore.
2. No terminal (troque `SEU_USUARIO`):

```bash
git remote add origin https://github.com/SEU_USUARIO/alinhavo.git
```

```bash
git push -u origin main
```

3. Em *Settings → Environments*, crie o ambiente **production**. Ele protege a aplicação de migrações.
4. Em *Settings → Secrets and variables → Actions*:
   - aba **Variables**: `SUPABASE_PROJECT_ID` = o project ref;
   - aba **Secrets**: `SUPABASE_ACCESS_TOKEN` (crie em supabase.com → *Account → Access Tokens*) e `SUPABASE_DB_PASSWORD`.

A partir daí:
- **CI** (`ci.yml`) roda lint, tipos, testes e build em todo push e PR.
- **Migrações do Supabase** (`supabase-migrations.yml`) aplica migrações novas quando elas chegam na `main`, depois de passar nos testes de RLS.

## 4. Publicar na Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `alinhavo`.
2. **Root Directory**: `apps/web`. Framework: Next.js (detectado). Deixe os comandos padrão.
3. **Environment Variables**:

| Nome | Valor | Ambientes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://SEU-APP.vercel.app` | só Production |
| `ANTHROPIC_API_KEY` | Chave da API da Anthropic (textos do produto por IA; opcional) | Production (e Preview, se quiser testar a IA nas prévias) |

4. **Deploy**. Cada PR ganha uma URL de prévia; a `main` vai para produção.

## 5. Ajustes finais no Supabase

Em *Authentication → URL Configuration*:
- **Site URL**: `https://SEU-APP.vercel.app`.
- **Redirect URLs**: adicione `https://SEU-APP.vercel.app/auth/callback` e, para as prévias, `https://*-SEU-TIME.vercel.app/auth/callback`.

## 6. Roteiro de teste em produção

1. Entrar com o e-mail A → criar a organização "Teste A".
2. Convidar o e-mail B como modelista → copiar o link.
3. Numa janela anônima, abrir o link → entrar com o e-mail B → aceitar.
4. Com B: conferir que vê "Teste A", a equipe, e **não** vê convites nem pode convidar.
5. Com B: criar "Teste B". Com A: conferir que "Teste B" não aparece.
