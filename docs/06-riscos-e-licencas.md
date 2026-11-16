# 06 · Riscos e licenças

## Riscos técnicos

| Risco | Impacto | Como reduzir |
|---|---|---|
| Simulação de tecido instável ou lenta | Alto: é o coração do produto | Começar a Fase 2 por uma prova de conceito isolada (um retângulo caindo sobre uma esfera, depois uma saia); medir fps em máquina modesta antes de construir a interface |
| WebGPU ausente em parte das máquinas | Médio | Fallback em WASM com malha mais grossa; aviso de desempenho |
| Precisão do DXF-AAMA | Alto: erro vira tecido perdido | Testes com arquivos de referência; validar em plotter real com um parceiro antes de vender |
| Realismo do caimento comparado ao físico | Médio | Calibrar presets com amostras reais (teste de caimento/drapeado) e deixar claro que é aproximação |
| Escopo enorme | Alto | MVP fechado na Fase 2; nada de Encaixe, Scan ou IA antes de validar a Prova com modelistas |

## Licenças e propriedade intelectual

- **Não copiar a marca, nomes de módulos, telas, ícones nem textos da Audaces.** Funcionalidade não é protegida; identidade visual e código são. O Alinhavo tem nome, fluxo e interface próprios.
- **Nome "Alinhavo":** antes de investir em marca, pesquisar no INPI (classes 9 e 42) e conferir domínio e redes sociais.
- **Corpo 3D:** não usar SMPL/SMPL-X (licença não comercial). Usar base com licença comercial livre, como os modelos do MakeHuman (saídas em CC0), e documentar a origem. **(feito, Fase 7 M2)** Ver "Corpo realista (MakeHuman)" abaixo.
- **Corpo realista (MakeHuman), conferido em 16/11/2026.** Só **dados** do MakeHuman entram, convertidos por um script nosso (`packages/cloth/scripts/makehuman-convert.mjs`) no arquivo `packages/cloth/src/body/makehuman-data.ts`. **Nenhum código do MakeHuman (AGPLv3)** foi lido, copiado ou executado: a leitura da malha, dos targets, do esqueleto e dos pesos, o ajuste às medidas, o colisor e a pele são nossos. Não confundir com o MB-Lab/ManuelbastioniLAB (AGPL até nos dados): nada dele entra.
  - **Origem:** repositório oficial `https://github.com/makehumancommunity/makehuman`, commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482` (26/06/2024), pasta `makehuman/data/`. A lista exata dos arquivos usados vai também dentro do próprio arquivo convertido (`origem.arquivos`), conferida por teste em `realistic.test.ts`.
  - **Licença geral:** `LICENSE.md`, seção C ("The license for the bundled assets"): "the base mesh and proxies, targets and modifiers, textures, clothes, poses and expressions" e, de modo geral, "any data contributing to the graphical output" estão em **CC0 1.0 Universal** (texto em `LICENSE.ASSETS.md`). O código (seção B) é AGPL e fica de fora.
  - **Esqueleto e pesos** (não citados pelo nome na seção C): os próprios arquivos declaram `"license": "CC0"`: `rigs/default.mhskel` ("MakeHuman default skeleton", © 2020 Data Collection AB, Joel Palmius, Jonas Hauquier) e `rigs/default_weights.mhw` ("MakeHuman weights", © 2021 os mesmos).
  - **Malha e targets:** cada arquivo traz no cabeçalho "This asset was explicitly released as CC0 in september 2020". 45 dos targets dizem "Original copyright (C) 2014 Manuel Bastioni", com a nota de que o direito foi transferido à equipe do MakeHuman em 2016, que os liberou em CC0 em 2020; valem como CC0.
  - **Arquivos usados (48), todos CC0:**

    | Arquivo (em `makehuman/data/`) | Para quê |
    |---|---|
    | `3dobjs/base.obj` | Malha base (hm08): pele (grupo `body`) e os vértices auxiliares das articulações |
    | `rigs/default.mhskel` | Posição das articulações (quadril, joelho, tornozelo, ombro, cotovelo, punho, pescoço, cabeça) |
    | `rigs/default_weights.mhw` | Pesos de pele, somados em 13 grupos (tronco, braço, antebraço, mão, coxa, canela, pé) |
    | `targets/macrodetails/{african,asian,caucasian}-{female,male}-young.target` | Corpo de partida feminino e masculino (média das três) |
    | `targets/macrodetails/universal-male-young-averagemuscle-averageweight.target` | Corpo de partida masculino |
    | `targets/macrodetails/universal-{female,male}-young-averagemuscle-{max,min}weight.target` | Peso (mais cheio, mais magro) |
    | `targets/measure/measure-{bust,waist,hips,neck,wrist,thigh,knee,ankle,upperarm}-circ-{incr,decr}.target` | Voltas da tabela |
    | `targets/measure/measure-{waisttohip-dist,shoulder-dist,upperarm-length,lowerarm-length,upperleg-height,lowerleg-height}-{incr,decr}.target` | Alturas e comprimentos da tabela |
    | `targets/torso/torso-vshape-{incr,decr}.target` | Largura das costas |
    | `targets/stomach/stomach-pregnant-{incr,decr}.target` | Barriga (guardado para a gestante no corpo realista, ainda não usado) |
  - **Tamanho:** ~1,2 MB de dados (~610 KB no download, num pedaço à parte, só quando a pessoa escolhe "Realista"). Teste em `realistic.test.ts` segura o limite.
- **Encaixe:** Deepnest e SVGnest são referências úteis para estudo, mas o Deepnest é GPL; não copiar código. Implementar o próprio motor usando Clipper2 (licença Boost, permissiva) para as operações de polígono. **(feito, Fase 4a)** Motor próprio em `packages/nesting` sobre o port `clipper2-ts` (BSL-1.0, TypeScript puro); nada do Deepnest/SVGnest foi copiado.
- **OpenCV.js:** Apache 2.0, uso comercial permitido. (Não usado: o Scan saiu sem OpenCV.)
- **js-aruco2** (Scan, detecção dos marcadores): MIT. O dicionário usado (ARUCO_MIP_36h12) está no próprio `aruco.js` (MIT).
- **Texturas e presets de tecido:** só de fontes com licença comercial (ex.: CC0) ou produzidas por nós.
- **IA:** conferir os termos de uso comercial do provedor de imagem escolhido antes da Fase 6.

## Riscos de negócio

- **Concorrência estabelecida** (Audaces no Brasil; CLO3D, Browzwear, Optitex e Gerber lá fora). Diferencial do Alinhavo: navegador, preço acessível, colaboração com o cliente por link, ajuste 3D que volta ao molde.
- **Confiança do modelista**: o profissional precisa ver o molde exportado bater com o papel. Programa piloto com 3 a 5 modelistas na Fase 1.
