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

## Fase 7 · O que a Audaces 3D tem e o Alinhavo não (análise de 15/11/2026)
Lista tirada da análise do concorrente (Audaces 360 / 3D). Situação em 15/11/2026; "pronto" sem merge significa que o código passou no `npm run check`, mas ainda não está na `main`.

- **Biblioteca de tecidos, poses (braço dobrado, braços abertos) e salto:** no ar (PR #13).
- **Manequim salvo com nome** (`body_presets`): pronto, branch `bases-e-manequim`. Ligar a um cliente da confecção depende de um cadastro de clientes, que ainda não existe.
- **Bases prontas sem manga** (blusa, vestido, short) e **manga no braço** (formato 6 do molde): pronto, branch `bases-e-manequim`. **Bases com manga** (manga base, camiseta, blusa com manga): escritas na mesma branch, em validação.
- **Presets de costura** (margem por tipo de costura, passos de gradação) e **acabamentos prontos** (pesponto duplo de jeans, zíper invisível, etiqueta de composição pelo tecido): pronto, branch `presets-costura`.
- **Kit de aprovação em um clique** (frente, costas, lado e vídeo 360°, botão "Montar kit de aprovação" nas Capturas): pronto, branch `kit-aprovacao`.
- **Pose sentada:** a fazer. Depende do manequim da branch `bases-e-manequim` (eixo do braço) entrar primeiro; pede um assento no colisor e teste da calça e da saia sentadas.
- **Zíper aberto ou fechado no look, lavagem do jeans, bordado e pedraria (formato 7 do molde):** pronto, branch `audaces-item-6`.
- **Corpo realista (MakeHuman) e play de movimentos** (andar, correr, dançar, acenar, sentar, agachar, deitar): estudado em `docs/09-estudo-corpo-e-movimento.md`. **M1 (play com os 7 movimentos no manequim atual): pronto, branch `audaces-item-6`. M2 (corpo realista MakeHuman, opção "Corpo: Manequim | Realista" na Prova): pronto, branch `corpo-realista`.** A fazer: M3 (movimentos capturados da CMU) e, no corpo realista, membro cortado, gestante e salto.

**Pronto quando:** as branches acima estão na `main` e a pose sentada veste a calça e a saia de exemplo sem atravessar o corpo nem o assento.
