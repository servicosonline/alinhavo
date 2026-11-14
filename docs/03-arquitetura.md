# 03 · Arquitetura

## Visão geral

```
Navegador (Next.js na Vercel)
 ├─ UI (React, shadcn/ui)
 ├─ Editor 2D (canvas/SVG)        ← packages/geometry
 ├─ Prova 3D (Three.js + WebGPU)  ← packages/cloth
 ├─ Web Worker de encaixe         ← packages/nesting
 └─ Web Worker de scan            ← packages/scan (js-aruco2 + TS próprio)
        │  supabase-js (sessão do usuário, RLS)
        ▼
Supabase
 ├─ Postgres  (dados, RLS por organização)
 ├─ Auth      (e-mail, Google; convites)
 ├─ Storage   (texturas, manequins, capturas, exportações)
 ├─ Realtime  (status da coleção, comentários)
 └─ Edge Functions (webhooks ERP, IA, links públicos, exportações pesadas)
```

## Decisões principais

**1. Cálculo pesado no navegador, não no servidor.**
Simulação de tecido e encaixe consomem muita CPU/GPU e muitos segundos. Funções da Vercel têm limite de tempo e custam por execução; o computador do modelista é gratuito para nós. Por isso a simulação roda em WebGPU (com fallback em WASM para máquinas sem suporte) e o encaixe roda em Web Worker.
*Alternativa descartada:* simular no servidor com GPU. Caro e lento para interação em tempo real.
*Scan sem OpenCV (Fase 5):* o OpenCV.js são ~14 MB de WebAssembly para baixar e é ruim de testar no Vitest; o Scan só precisa de detectar marcadores (js-aruco2, MIT, ~400 KB) e de operações simples (homografia, limiar, contorno), escritas em TypeScript e testadas com fotos sintéticas.
*Válvula de escape:* a fila de encaixes da Fase 4 pode ganhar um worker dedicado (container fora da Vercel) lendo uma tabela `nest_jobs` do Supabase, se encaixes grandes ficarem lentos demais no navegador.

**2. O molde é um documento JSON versionado.**
Cada molde é salvo como JSON (pontos, curvas, regras de gradação, costuras) numa tabela de versões. Prova, Encaixe e Ficha leem a mesma versão. Um ajuste feito na Prova grava uma nova versão; nada é exportado/importado entre módulos.

**3. Geometria em pacote puro, testável.**
`packages/geometry` não depende de React nem do navegador: gradação, margem, comprimento de costura e DXF são funções puras com testes (Vitest) e casos de referência. É onde um erro custa tecido de verdade.

**4. Manequim paramétrico.**
Um corpo-base com rig e alvos de forma (morph targets), ajustado por medidas (busto, cintura, quadril, altura, comprimentos). O ajuste resolve os pesos dos alvos para bater as medidas da tabela. Fonte do corpo: base com licença comercial livre (ver [riscos](06-riscos-e-licencas.md)).

**5. Simulação XPBD.**
Malha triangular gerada de cada parte do molde; restrições de distância (esticamento por direção do fio), flexão e costura (pares de arestas puxadas até se unirem); colisão com o corpo por campo de distância. O mapa de pressão é a deformação de cada triângulo frente ao seu tamanho original.

**6. Multi-empresa com RLS.**
Toda tabela tem `org_id`; políticas RLS só liberam linhas de organizações das quais o usuário é membro. A chave de serviço do Supabase só existe nas Edge Functions, nunca no navegador.

**7. Links públicos de aprovação.**
Uma Edge Function valida um token com expiração e devolve só os dados daquela aprovação (imagens + comentários), sem expor a organização.
*Hoje (MVP, Fase 2):* sem Edge Function. As imagens (até 4, ≤ 600 KB) ficam no banco e a página pública lê pelas funções `public_approval`/`decide_approval` (`security definer`, só com o token), chamadas com a chave publicável. Motivo: o app não usa a chave de serviço, que é a única que assina URL do Storage para quem não tem conta. Quando entrar o vídeo 360° (Fase 5), as capturas vão para o Storage e a leitura pública passa para a Edge Function, sem mudar a tela.

## GitHub e CI

- Monorepo npm workspaces + Turborepo.
- A cada PR: lint (ESLint), tipos (`tsc --noEmit`), testes (Vitest), build do Next.
- Migrações SQL em `supabase/migrations`, aplicadas por `supabase db push` num workflow ao fazer merge na `main`.
- Vercel com prévia automática por PR (cada PR ganha uma URL) e produção na `main`.
- Ambientes: Supabase de desenvolvimento (local via `supabase start`), de prévia e de produção.

## Desempenho e limites

- Simulação: meta de 30 fps com uma peça de ~8 partes e ~15 mil vértices numa GPU integrada recente.
- Editor 2D: interação a 60 fps com grade de 8 tamanhos sobreposta.
- Arquivos grandes (texturas, capturas) vão direto para o Storage com URL assinada, sem passar pela Vercel.
