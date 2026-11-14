# Alinhavo

**Da tabela de medidas à mesa de corte, no navegador.**

Alinhavo é um software web para confecções que junta, num lugar só, o planejamento da coleção, a modelagem digital, a prova virtual em 3D e o encaixe para corte. O nome vem do *alinhavo*, o ponto provisório que a costureira dá para provar a peça antes da costura definitiva. É exatamente o que o produto faz: provar antes de cortar.

Referência de mercado analisada: **Audaces 360** (site oficial + vídeo "Como usar o 3D para simular e aprovar protótipos").

## Stack proposta

| Camada | Tecnologia |
|---|---|
| Código e CI | GitHub (monorepo npm workspaces + Turborepo, GitHub Actions) |
| App web | Next.js 16 (App Router) + TypeScript + Tailwind 4, hospedado na **Vercel** |
| Banco, login, arquivos, tempo real | **Supabase** (Postgres + RLS, Auth, Storage, Realtime, Edge Functions) |
| 3D e simulação de tecido | Three.js + simulação XPBD própria (WebGPU, com fallback em WASM) |
| Geometria 2D (moldes, margem, encaixe) | Clipper2 (offset e booleanas) + motor de encaixe próprio em Web Worker |
| Digitalização | Foto do celular + marcadores ArUco + OpenCV.js |

## Documentos

1. [Análise do Audaces 360](docs/01-analise-audaces-360.md): o que o produto faz, módulo a módulo, e o fluxo do vídeo.
2. [Produto Alinhavo](docs/02-produto-alinhavo.md): módulos, funcionalidades e o que entra no MVP.
3. [Arquitetura](docs/03-arquitetura.md): como as peças se encaixam no GitHub, Supabase e Vercel.
4. [Modelo de dados](docs/04-modelo-de-dados.md): tabelas do Supabase e regras de acesso.
5. [Roadmap](docs/05-roadmap.md): fases, entregas e critérios de pronto.
6. [Riscos e licenças](docs/06-riscos-e-licencas.md): o que pode dar errado e o que não podemos copiar.
7. [Deploy](docs/07-deploy.md): passo a passo para Supabase, GitHub e Vercel.

## Como rodar

Requer Node 24.

```bash
npm install
```

```bash
npm run dev
```

Antes de entregar qualquer mudança: `npm run check` (lint, tipos, testes e build).

## Estrutura do repositório

Já existem `apps/web`, `packages/geometry` e `.github/workflows`. O resto é criado nas fases seguintes.

```
alinhavo/
├─ apps/
│  └─ web/                 Next.js (Vercel)
├─ packages/
│  ├─ geometry/            moldes: curvas, gradação, margem de costura, DXF-AAMA
│  ├─ cloth/               simulação de tecido XPBD + mapa de pressão
│  ├─ nesting/             encaixe (no-fit polygon + busca genética)
│  ├─ scan/                digitalização por foto (OpenCV.js)
│  └─ ui/                  componentes compartilhados
├─ supabase/
│  ├─ migrations/          SQL versionado
│  └─ functions/           Edge Functions (webhooks ERP, IA, exportações)
├─ docs/                   estes documentos
└─ .github/workflows/      lint, testes, checagem de tipos, deploy de migrações
```
