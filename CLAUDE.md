# Alinhavo

Software web para confecções: modelagem 2D, prova virtual 3D, encaixe e gestão de coleção. A proposta completa está em `docs/` (comece por `docs/02-produto-alinhavo.md` e `docs/03-arquitetura.md`).

## Stack
- Monorepo **npm workspaces + Turborepo**, Node 24 (`.nvmrc`).
- `apps/web`: Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, Tailwind 4. Deploy na Vercel.
- `packages/geometry`: geometria dos moldes, TypeScript puro, testes com Vitest.
  - `pattern.ts`: **formato do documento do molde** (`PatternDocument`, schema 2), validação, gradação (`pieceAtSize`, `stepGrading`) e contorno. Mudar o formato exige subir `schema`, escrever a migração do documento em `migratePattern` e uma migração de banco para a trava de `pattern_versions.document`. **Todo documento lido do banco passa por `migratePattern`** (versões antigas não são reescritas).
  - Schema 3: por parte, `fold` (segmento reto da dobra, nunca costurado) e `placement` (lado do corpo, altura de referência e ajuste em mm).
  - Schema 4: por parte, `cutPair` (cortar par; não combina com dobra) e `placement.leg` (veste a perna abaixo do gancho). Costura com `a` igual a `b` = o segmento com o mesmo segmento do par espelhado (gancho), só em parte de par. `pairCopy` (em `unfold.ts`) gera a cópia (id com `~par`, espelhada, percorrida ao contrário, perna trocada); `garmentAtSize` devolve `source` (parte do molde de cada peça da Prova) e duplica as costuras par com par. `setCutPair` em `edit.ts`. `unfold.ts`: `unfoldPiece` abre a peça pela dobra (cópias com id "~"); `garmentAtSize` dá a roupa da Prova num tamanho (partes graduadas e abertas, costuras duplicadas para o espelho; `origin`/`patternEdgeOf` levam o segmento da Prova de volta ao do molde). Ajuste da Prova no app: `lib/prova/adjustment.ts` (aplica e descreve a versão); salvar com `origin: "prova"`. Bordas clicáveis em `lib/prova/edges.ts` (o Worker manda; clique no tecido mede na roupa, fora dele mede na tela e ignora o que o corpo esconde); painel em `components/prova/adjust-panel.tsx` (`saveMode`: `save` no painel com permissão, `readonly`, `local` no /experimentar).
- Capturas da Prova: `scene.capture(ângulo)` (JPEG 900×1200, sem o destaque de borda; frente, costas, lado ou a câmera atual), regras em `lib/prova/captures.ts` (até 4, até 600 KB, iguais às do banco), painel em `components/prova/captures-panel.tsx`. Trocar tamanho, tecido, pose ou molde limpa as capturas.
- Aprovação por link: tabelas `approvals` e `approval_images` (imagens em `bytea` no MVP). Criar só por `create_approval`; sem conta, só por `public_approval(token)` e `decide_approval(...)` (ver `docs/04-modelo-de-dados.md`). Testes em `tests-pglite/aprovacoes.test.ts`. No app: "Pedir aprovação" na Prova do painel (`components/prova/approval-request.tsx`, ação `requestApproval` em `moldes/[patternId]/prova/actions.ts`; bloqueado com alterações do editor por salvar), lista no molde (`approvals-list.tsx`, cancelar link) e a página pública **`/aprovar/[token]`** (sem login, `noindex`; resposta por `decideApproval`). Regras e textos em `lib/prova/approval.ts`. As 4 imagens vão numa Server Action (limite de 1 MB do Next): por isso o teto de 150 KB por imagem no app.
  - `seams.ts`: costuras (`seams`: pares de segmentos, sentido `opposite`/`same`). Referenciam o segmento pelo índice: operação que renumera segmentos (em `edit.ts`) chama `remapSeams`; dividir ou juntar o segmento costurado desfaz a costura. `continuationSegments` acha, pelas costuras, os segmentos que continuam um segmento (barra da frente → barra das costas).
  - `seam-allowance.ts`: margem de costura por aresta (canto em ponta, chanfro em canto agudo).
  - `grading.ts`: gradação (passo por ponto, valor por tamanho, `setSizes`, `setBaseSize`, `applyGrade`). **Trocar o base nunca muda um tamanho** (teste de propriedade em `grading.test.ts`); edita-se o desenho só no tamanho base.
  - `edit.ts`: operações de edição do molde (criar parte, mover ponto/alça/parte, inserir e apagar ponto, reta↔curva, margens, `moveSegment`: desloca um segmento para fora/dentro, o ajuste da Prova). Puras: devolvem documento novo, nunca alteram o original.
  - `bezier.ts`, `polygon.ts`: curvas e polígonos. `fixtures.ts` só para testes.
- `packages/cloth`: Prova 3D (simulação do tecido), TypeScript puro para rodar em Web Worker; mesmas regras de `packages/geometry`.
  - `simulation.ts`: `createSimulation` (XPBD, passos pequenos), **referência em CPU**: uma versão WebGPU futura deve ser conferida contra ela. Unidades **mm, g, s** (gravidade 9810 mm/s²). Esticamento por aresta com rigidez pela direção do fio, flexão por vértices opostos, costura puxando cada ponto ao correspondente do outro lado (pelo `t`, fechando a `seamClosingSpeed`), colisão pela interface `Collider` (`collider.ts`). O Worker fica no app; o pacote não usa tipos de navegador.
  - `body/`: corpos da Prova pelo contrato comum `Body` (`types.ts`): malha para desenhar, `Collider`, ajuste às medidas e pontos de referência. Coordenadas mm, **Y para cima, chão em 0, frente em +Z, esquerda do corpo em +X**. Hoje: `createMannequin` (manequim procedural: tronco por seções superelípticas em que busto, cintura e quadril batem a medida por construção; membros por cones arredondados; poses `em-pe` e `passo`). `readMeasurements` lê a tabela por nome e lista o que foi estimado, ignorado ou recusado. O corpo realista (MakeHuman, só assets CC0 oficiais) entra depois pelo mesmo contrato.
  - `place.ts`: `placeGarment` enrola cada parte numa elipse em volta do corpo (lado, altura de referência, comprimento do molde preservado) para a posição inicial. Parte de cortar par fica na sua metade (`pieceHalf`: perna da posição, ou desenhada à esquerda e cópia à direita); com `placement.leg`, abaixo do gancho a parte se enrola na perna (`landmarks.legs`, `legAt`), com transição de `LEG_BLEND`. **"Ombro" = alto da linha do ombro (`landmarks.neck.y`)**, não a ponta: mais baixo, a alça fecharia dentro do tronco.
  - Fase de costura (`sewingTime`): sem gravidade até as costuras fecharem; sem ela o top de alças cai antes de a alça se fechar. A Prova usa 2 s (`PROVA_SEWING_TIME`).
  - `test-garments.ts` (só testes): calça (cortar par, perna, gancho) e top de alças para o manequim padrão; `garments.test.ts` simula os dois. Limitação conhecida: no manequim o braço se sobrepõe ao tronco na axila (~15 mm), e a lateral de um top justo fica alguns mm dentro ali (o corpo realista resolve).
  - Simulação: `maxStretch` por tecido (limite de esticamento) e `iterations`; as costuras são resolvidas depois do limite, para não abrirem.
  - `maps.ts`: mapas da Prova por vértice, pressão (`vertexStretch`) e folga (`vertexClearance`, só contra o corpo), e `summarizeMaps`. Para mostrar, use `highStretch` (98% da área abaixo dele), não `maxStretch`: o máximo é um pico local junto às costuras. As cores ficam no app (`lib/prova/colors.ts`).
  - `fabrics.ts`: presets malha, plano leve e jeans. **Valores a calibrar**; os testes garantem só as relações entre eles.
  - `mesh.ts`: `meshPiece` gera a malha triangular da **linha de costura** (sem margem). Borda reamostrada por segmento (vértices `0..boundaryCount-1`, com segmento e `t` de origem, base das costuras), miolo em grade alinhada ao fio, Delaunay com a borda forçada (Delaunator + Constrainautor, ISC) e suavização só na faixa junto à borda.- `packages/export`: exportação, carregada sob demanda no navegador (`@alinhavo/export/dxf`, `@alinhavo/export/pdf`).
  - `dxf.ts`: DXF-AAMA (R12 ASCII). Camadas fixas 1 corte, 2 quinas, 3 curva, 7 fio, 14 costura; uma BLOCK por peça×tamanho. **O Y é invertido** (DXF cresce para cima): sem isso a peça sai espelhada. Testes leem o arquivo com `dxf-parser` (leitor independente).
  - `pdf.ts`: PDF 1:1 em folhas A4 com folha de conferência (quadrado de 10 cm); pula folhas vazias. Espessuras e tracejados em mm (a escala do `drawSvgPath` vale para eles).
- `apps/web/src/components/editor/`: editor 2D (SVG em mm). `canvas.tsx` desenha e trata o ponteiro por **delegação** (`data-hit`, `data-piece`…); `pattern-editor.tsx` guarda o histórico e o painel. Lógica de molde nova vai para `packages/geometry`, não para o componente.
- Interface mostra **cm com vírgula**; converta só por `src/lib/units.ts` (`formatCm`, `parseCmToMm`).
- Moldes de exemplo em `src/lib/examples.ts` (saia-base, calça com cortar par e perna, conjunto calça + top), grade P/M/G que veste a tabela de demonstração e o corpo padrão; `examples.test.ts` confere costuras com lados iguais e simula o conjunto. Molde novo no painel pode "começar de" um exemplo (vira a versão 1).
- `/experimentar`: editor público sem salvar (demonstração e teste manual sem login), com seletor de exemplo. O botão "Provar" leva o molde (pela sessionStorage, `lib/prova/handoff.ts`) para **`/experimentar/prova`**.
- Prova no painel: `/painel/[orgId]/moldes/[patternId]/prova`, com as medidas da tabela ligada ao molde (`lib/prova/measurements.ts`). O "Provar" do editor leva as alterações não salvas pela sessionStorage, por molde e versão (`handoff.ts`); se a versão mudou, vale a salva.
- Prova 3D no app: `components/prova/scene.ts` (three, MIT; cena em metros, dados em mm; a roupa é desenhada 4 mm para fora só no visual), `prova-studio.tsx` (painel) e `lib/prova/prova.worker.ts` (corpo, `garmentAtSize`, `meshPiece`, `placeGarment` e simulação no Worker; protocolo em `protocol.ts`). Parâmetros validados nos testes do cloth: malha de 30 mm e 2 iterações por subpasso (com 1 iteração a saia escorrega do corpo). **Não ponha `paths` do Constrainautor no tsconfig do app** (ver `packages/cloth/types/constrainautor.d.ts`).
- Coleção (Fase 3): tabelas `collections`, `products` (status `ideia → modelagem → prova → aprovado → producao`, `pattern_id` único: um molde por produto, o vínculo mora no produto) e `milestones` (prazo, responsável membro, concluída). Escrita para owner, admin, modelista **e estilista** (`private.can_edit_products`, `canEditProducts`); moldes seguem sem a estilista. Telas em `/painel/[org]/colecoes`, `/colecoes/[id]` e `/produtos/[id]`; regras puras (atraso, sugestão de "aprovado" quando o cliente aprova o molde, datas) em `src/lib/collection.ts`.
- Ficha técnica (Fase 3): `fabrics` (largura em mm, g/m², preço em centavos por metro, preset da Prova), `products.fabric_id`, `product_trims` (aviamentos) e `tech_packs` (versionada e imutável, só por `create_tech_pack`, aponta para a versão do molde; dados em jsonb formato 1). `cutPieces` (geometry) dá peças de corte com quantidade, dobra e área; `@alinhavo/export/tech-pack` monta a ficha (`buildTechPack`: **consumo estimado** = área ÷ aproveitamento 80% ÷ largura, marcado como estimativa até o Encaixe) e `@alinhavo/export/tech-pack-pdf` gera o PDF no navegador (texto fora da WinAnsi vira "?"). Dinheiro: `src/lib/money.ts`.
- `supabase/`: Supabase (Postgres 17 + RLS, Auth, Storage, Realtime, Edge Functions). Migrações em `supabase/migrations/`, testes de RLS em `supabase/tests-pglite/`.

## Banco
- **Toda mudança de banco é uma migração nova** em `supabase/migrations/` (nome `AAAAMMDDHHMMSS_descricao.sql`). Nunca edite uma migração já aplicada em produção.
- **Testes de RLS rodam sem Docker**: PGlite (Postgres em WASM) aplica as migrações sobre uma imitação mínima do Supabase (`tests-pglite/db.ts`). Toda tabela ou política nova ganha teste em `tests-pglite/`.
- Entrar numa organização só pelas funções `create_org` e `accept_invite`; não existe política de insert em `org_members`.
- Funções usadas nas políticas ficam no schema `private`, com `security definer` e `set search_path = ''`.
- CLI do Supabase: `npx supabase <comando>` (está nas dependências de `@alinhavo/supabase`).
- **Tipos do banco** em `apps/web/src/lib/supabase/database.types.ts`. Hoje escritos à mão: toda migração nova atualiza esse arquivo. Quando houver projeto Supabase, passam a ser gerados com `supabase gen types`.

## App web (login e acesso)
- Login por e-mail e senha em `/entrar` (abas Entrar e Criar conta; regras e mensagens em `src/lib/password-auth.ts`), com o link mágico como opção (`/entrar` → e-mail → `/auth/callback`). Senha nunca vai para log nem para mensagem. Com "Confirm email" desligado no Supabase, o e-mail da conta não é verificado: o convite vale pelo token secreto (ver `docs/07-deploy.md`). `src/proxy.ts` só renova a sessão e manda quem não está logado de `/painel` para `/entrar`.
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
