# 05 · Roadmap

Cada fase termina com algo usável e testável. Executar em passos, com checkpoint ao fim de cada um.

## Fase 0 · Fundação
- Repositório no GitHub, monorepo, Next.js, Tailwind, shadcn/ui.
- Projeto Supabase, migrações iniciais (orgs, membros, convites), RLS.
- Login, criação de organização, convite de membro.
- CI (lint, tipos, testes, build) e deploy na Vercel com prévia por PR.

**Pronto quando:** dois usuários de organizações diferentes não enxergam os dados um do outro (teste automatizado de RLS).

## Fase 1 · Molde
- Tabelas de medidas e grades.
- Editor 2D: partes, retas, curvas, piques, fio.
- Gradação por regras e visualização da grade sobreposta.
- Margem de costura e medição de costura.
- Versões do molde; exportação PDF em escala e DXF-AAMA.

**Pronto quando:** uma saia-base graduada em 5 tamanhos é exportada em DXF e abre corretamente num visualizador DXF-AAMA; PDF impresso em A4 confere com régua.

## Fase 2 · Prova (MVP fecha aqui)
- Corpo paramétrico ajustado às medidas da tabela.
- Malha das partes, posicionamento, costuras, simulação XPBD com colisão.
- Mapa de pressão e de folga.
- Três presets de tecido (malha, plano leve, jeans) e duas poses.
- Ajuste na Prova vira nova versão do molde.
- Captura de imagem e link público de aprovação.

**Pronto quando:** o fluxo do vídeo de referência (calça + top, +4 cm na barra, −3 cm na alça) é refeito ponta a ponta sem sair do navegador.

## Fase 3 · Coleção
- Coleções, cronograma com alertas, status do produto.
- Ficha técnica gerada dos dados do molde e do tecido.
- Comentários em tempo real.

## Fase 4 · Encaixe (feita)
- Motor de encaixe em Web Worker; demanda por tamanho; aproveitamento.
- Fila de encaixes; exportação DXF/HPGL.
- Consumo de tecido alimentando a ficha técnica.

## Fase 5 · Scan, look e acabamentos
- Digitalização por foto com marcadores.
- Look com várias peças e camadas; prova da grade inteira.
- Acabamentos (pesponto, zíper, estampa); vídeo 360°.

## Fase 6 · IA e integrações
- Ficha e descrição de produto por IA.
- API pública e webhooks para ERP.
- Fotos de catálogo geradas a partir da Prova.
