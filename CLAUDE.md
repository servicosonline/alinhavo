# Alinhavo

Software web para confecções: modelagem 2D, prova virtual 3D, encaixe e gestão de coleção. A proposta completa está em `docs/` (comece por `docs/02-produto-alinhavo.md` e `docs/03-arquitetura.md`).

## Stack
- Monorepo **npm workspaces + Turborepo**, Node 24 (`.nvmrc`).
- `apps/web`: Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, Tailwind 4. Deploy na Vercel.
- `packages/geometry`: geometria dos moldes, TypeScript puro, testes com Vitest.
  - `pattern.ts`: **formato do documento do molde** (`PatternDocument`, schema 2), validação, gradação (`pieceAtSize`, `stepGrading`) e contorno. Mudar o formato exige subir `schema`, escrever a migração do documento em `migratePattern` e uma migração de banco para a trava de `pattern_versions.document`. **Todo documento lido do banco passa por `migratePattern`** (versões antigas não são reescritas).
  - `seams.ts`: costuras (`seams`: pares de segmentos, sentido `opposite`/`same`). Referenciam o segmento pelo índice: operação que renumera segmentos (em `edit.ts`) chama `remapSeams`; dividir ou juntar o segmento costurado desfaz a costura.
  - `seam-allowance.ts`: margem de costura por aresta (canto em ponta, chanfro em canto agudo).
  - `grading.ts`: gradação (passo por ponto, valor por tamanho, `setSizes`, `setBaseSize`, `applyGrade`). **Trocar o base nunca muda um tamanho** (teste de propriedade em `grading.test.ts`); edita-se o desenho só no tamanho base.
  - `edit.ts`: operações de edição do molde (criar parte, mover ponto/alça/parte, inserir e apagar ponto, reta↔curva, margens). Puras: devolvem documento novo, nunca alteram o original.
  - `bezier.ts`, `polygon.ts`: curvas e polígonos. `fixtures.ts` só para testes.
- `packages/cloth`: Prova 3D (simulação do tecido), TypeScript puro para rodar em Web Worker; mesmas regras de `packages/geometry`.
  - `simulation.ts`: `createSimulation` (XPBD, passos pequenos), **referência em CPU**: uma versão WebGPU futura deve ser conferida contra ela. Unidades **mm, g, s** (gravidade 9810 mm/s²). Esticamento por aresta com rigidez pela direção do fio, flexão por vértices opostos, costura puxando cada ponto ao correspondente do outro lado (pelo `t`, fechando a `seamClosingSpeed`), colisão pela interface `Collider` (`collider.ts`). O Worker fica no app; o pacote não usa tipos de navegador.
  - `fabrics.ts`: presets malha, plano leve e jeans. **Valores a calibrar**; os testes garantem só as relações entre eles.
  - `mesh.ts`: `meshPiece` gera a malha triangular da **linha de costura** (sem margem). Borda reamostrada por segmento (vértices `0..boundaryCount-1`, com segmento e `t` de origem, base das costuras), miolo em grade alinhada ao fio, Delaunay com a borda forçada (Delaunator + Constrainautor, ISC) e suavização só na faixa junto à borda.- `packages/export`: exportação, carregada sob demanda no navegador (`@alinhavo/export/dxf`, `@alinhavo/export/pdf`).
  - `dxf.ts`: DXF-AAMA (R12 ASCII). Camadas fixas 1 corte, 2 quinas, 3 curva, 7 fio, 14 costura; uma BLOCK por peça×tamanho. **O Y é invertido** (DXF cresce para cima): sem isso a peça sai espelhada. Testes leem o arquivo com `dxf-parser` (leitor independente).
  - `pdf.ts`: PDF 1:1 em folhas A4 com folha de conferência (quadrado de 10 cm); pula folhas vazias. Espessuras e tracejados em mm (a escala do `drawSvgPath` vale para eles).
- `apps/web/src/components/editor/`: editor 2D (SVG em mm). `canvas.tsx` desenha e trata o ponteiro por **delegação** (`data-hit`, `data-piece`…); `pattern-editor.tsx` guarda o histórico e o painel. Lógica de molde nova vai para `packages/geometry`, não para o componente.
- Interface mostra **cm com vírgula**; converta só por `src/lib/units.ts` (`formatCm`, `parseCmToMm`).
- `/experimentar`: editor público sem salvar (demonstração e teste manual sem login).
- `supabase/`: Supabase (Postgres 17 + RLS, Auth, Storage, Realtime, Edge Functions). Migrações em `supabase/migrations/`, testes de RLS em `supabase/tests-pglite/`.

## Banco
- **Toda mudança de banco é uma migração nova** em `supabase/migrations/` (nome `AAAAMMDDHHMMSS_descricao.sql`). Nunca edite uma migração já aplicada em produção.
- **Testes de RLS rodam sem Docker**: PGlite (Postgres em WASM) aplica as migrações sobre uma imitação mínima do Supabase (`tests-pglite/db.ts`). Toda tabela ou política nova ganha teste em `tests-pglite/`.
- Entrar numa organização só pelas funções `create_org` e `accept_invite`; não existe política de insert em `org_members`.
- Funções usadas nas políticas ficam no schema `private`, com `security definer` e `set search_path = ''`.
- CLI do Supabase: `npx supabase <comando>` (está nas dependências de `@alinhavo/supabase`).
- **Tipos do banco** em `apps/web/src/lib/supabase/database.types.ts`. Hoje escritos à mão: toda migração nova atualiza esse arquivo. Quando houver projeto Supabase, passam a ser gerados com `supabase gen types`.

## App web (login e acesso)
- Login por link mágico (`/entrar` → e-mail → `/auth/callback`). `src/proxy.ts` só renova a sessão e manda quem não está logado de `/painel` para `/entrar`.
- **Toda Server Action e Route Handler confere o login de novo** (`getCurrentUser`/`requireUser` em `src/lib/auth.ts`); o proxy não é a autorização. A permissão de verdade é a RLS.
- Com `cacheComponents`, quem lê cookies, `params` ou `searchParams` fica dentro de `<Suspense>`. Leia `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`.
- Redirecionar depois do login só com `safeNext()` (`src/lib/safe-next.ts`).
- Só a chave **publicável** do Supabase vai para o app (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

**O Next 16 tem APIs diferentes das versões antigas.** Antes de escrever código do Next, leia o guia em `node_modules/next/dist/docs/`.

## Comandos (na raiz)
- `npm run dev`: sobe o app em http://localhost:3000
- `npm run check`: lint + tipos + testes + build. **Rode antes de dar uma tarefa por pronta.**
- `npm test -w @alinhavo/geometry`: só os testes de geometria.
- `npm test -w @alinhavo/supabase`: só os testes de banco e RLS.
- `npm test -w @alinhavo/web`: testes do app (ex.: `safeNext`).

## Invariantes
1. **Medidas em milímetros** em todo o código e no banco. Conversão para cm só na interface.
2. **Geometria é pura**: `packages/geometry` não importa React, DOM, Next nem Supabase. Toda função nova lá vem com teste.
3. **Isolamento por organização**: toda tabela de negócio tem `org_id` e RLS ativa. A chave de serviço do Supabase nunca vai para o navegador nem para variável `NEXT_PUBLIC_*`.
4. **O molde é um documento versionado**: um ajuste (no editor, na Prova ou no Scan) grava nova versão; nunca sobrescreve.
5. **Cálculo pesado no navegador** (simulação e encaixe em Worker/WebGPU), não em função da Vercel.
6. **Licenças**: nada de código GPL (ex.: Deepnest) nem do corpo SMPL. Ver `docs/06-riscos-e-licencas.md`.
7. **Interface em português do Brasil.**

## Publicação
Sem commit, push ou deploy sem pedido explícito. O CI (`.github/workflows/ci.yml`) roda o mesmo `check` em cada PR. Migrações chegam ao Supabase de produção só pelo workflow `supabase-migrations.yml` (na `main`, depois dos testes de RLS). O app vai para a Vercel com Root Directory `apps/web`. Passo a passo em `docs/07-deploy.md`.
- Banco: `npm run db:link -- --project-ref <ref>`, `npm run db:push`, `npm run db:types`.
