# Calibração dos tecidos da Prova 3D

**Status (16/11/2026):** fase B pronta (arquivo de medidas, script de ajuste e testes em `packages/cloth/src/calibration/`). A flexão passou a ser **de curvatura**, com o **comprimento de flexão** (mm) por tecido, ajustado pela régua (ver "Flexão de curvatura" abaixo). Nenhuma medida real ainda: falta a fase A, e os 12 comprimentos de flexão de `fabrics.ts` são estimativas.

## O que a fase B descobriu (antes de qualquer medida)

1. **A flexão da simulação não segurava tecido plano** (resolvido em 16/11/2026, ver "Flexão de curvatura"). Ela era uma distância entre os vértices opostos de dois triângulos vizinhos. Com o tecido plano, dobrar um pouco quase não muda essa distância, então ela não resistia. Na régua (15 cm para fora da mesa), toda tira caía quase reta: o jeans caía 147 mm, e mesmo com a flexão mais firme possível caía 132 mm. Era o que uma estilista notou na Prova: o tricoline caía como a malha.
2. **Com os valores de hoje, toda tira com 500 g chega no limite de esticamento.** Quem segura o tecido é o `maxStretch`, não a complacência: ela está mais mole que qualquer tecido plano real. O ajuste resolve isso com a primeira medida.
3. **A malha de 30 mm não resolve as dobras do disco.** Com a flexão antiga, ela deixava o tecido mais armado (coeficiente 0,61 contra 0,26 em 10 mm). Com a de curvatura, a régua quase não muda com a malha, mas no disco os tecidos fluidos caem **mais** na malha de 30 mm que na de 10 mm (malha 0,20 contra 0,52; viscose 0,13 contra 0,47), porque as ondas são mais finas que os triângulos. Os armados quase não mudam (jeans 0,97 e 0,87; sarja 0,90 e 0,93). O `resultado.json` mostra os dois números por tecido; uma malha mais fina na Prova esbarrou na convergência (ver "Malha mais fina: o que travou").

## Flexão de curvatura (16/11/2026)

A flexão de `packages/cloth/src/simulation.ts` é a energia quadrática de curvatura de Bergou, Wardetzky, Harmon, Zorin e Grinspun (2006): para cada aresta interna, os 4 vértices em volta, com pesos pelas cotangentes do molde. Ela é zero no tecido plano e mede o quanto ele saiu do plano, então segura tecido plano. Pela área dos triângulos, a energia de um cilindro bate com a da placa contínua em qualquer malha (teste em `bending.test.ts`).

O tecido diz o **comprimento de flexão** `bendingLength` (mm), o número que o teste da régua mede (Peirce; ASTM D1388). A rigidez é B = gramatura × gravidade × comprimento³. Com o mesmo comprimento, o caimento não muda com a gramatura. Na régua simulada, a fórmula de Peirce devolve o comprimento dado com 1 a 6% de erro com 150 mm para fora; com só 100 mm para fora, a malha de 30 mm põe 3 triângulos no balanço e o erro chega a ~11%. O ajuste é feito na malha da Prova, o que compensa isso.

Os 12 comprimentos de hoje são **estimativa**: só a ordem de grandeza tem referência (a ASTM D1388 dimensiona a tira para tecidos de 1 a 3+ cm, e o exemplo de algodão dos manuais do teste dá 2,5 a 2,7 cm). Do mais fluido ao mais armado: chiffon 10, viscose 16, malha e crepe 18, ribana 20, plano leve 22, tricoline 28, moletom 30, linho 32, sarja 38, jeans com elastano 42, jeans 50. O caimento 1–5 do cadastro (`drape`) divide a rigidez por 2,8 a cada ponto (o comprimento, pela raiz cúbica).

## Malha mais fina: o que travou (16/11/2026)

Tentativa de simular a qualidade "alta" numa malha mais fina (a "leve" ficando em 30 mm). Medido na bancada, com a flexão de curvatura:

| Malha | Disco: malha | viscose | chiffon | tricoline | Régua e esticamento |
|---|---|---|---|---|---|
| 30 mm | 0,20 | 0,13 | −0,06 | 0,70 | jeans com elastano no fio 8,9% (errado) |
| 25 mm | 0,33 | 0,18 | 0,01 | 0,74 | perto de 20 mm |
| 20 mm | 0,45 | 0,34 | 0,19 | 0,78 | igual a 15 mm |
| 15 mm | 0,51 | 0,44 | 0,27 | 0,81 | — |

Em 20 mm o caimento chega perto do convergido. Mas **com 2 iterações por subpasso a roupa vestida perde a firmeza**: a calça do conjunto de salto desaba ainda na fase de costura (o alto termina a 216 mm do chão, contra 994 mm em 30 mm), a calça do conjunto e o short ficam abaixo do quadril, e a axila da camiseta abre 6 a 11 mm. Mais arestas em série convergem menos no XPBD com poucas iterações. Medido (calça do conjunto, de salto, ms por quadro nesta máquina):

| Malha e iterações | Calça | ms/quadro |
|---|---|---|
| 30 mm, 2 | segura (994) | 48 |
| 25 mm, 2 | segura (973), mas no conjunto e no short fica 3 a 5 mm abaixo do limite do teste | 64 |
| 20 mm, 2 | cai até o chão | 97 |
| 20 mm, 3 | segura (973) | ~140 a 200 |
| 20 mm, 4 | segura (994) | ~390 |

A Prova ficou em 30 mm. Caminhos: 20 mm com 3 iterações só na "alta" (3 a 4× o custo de hoje), um resolvedor que converge melhor com as mesmas iterações (ex.: ordem das restrições, Gauss-Seidel por cor, ou um passo de Chebyshev), ou a simulação em WebGPU, que precisaria ser conferida contra a de CPU.

## Por que

Os 12 tecidos de `packages/cloth/src/fabrics.ts` foram escolhidos de olho. Os testes de hoje garantem só as relações entre eles (o jeans é mais firme que a malha, a trama cede mais que o urdume), não que o caimento na tela bate com o tecido de verdade. Sem calibrar, a Prova mostra um caimento **plausível**. Calibrada, ela mostra um caimento **medido**, com a margem de erro conhecida. Só aí dá para dizer a uma estilista até onde confiar.

O método tem três passos:

1. **Medir** amostras reais com testes simples de bancada.
2. **Ajustar**: um script roda o mesmo teste na simulação e procura os valores que reproduzem a medida.
3. **Validar** com o que não entrou no ajuste (as ondas do disco) e com uma peça de verdade.

Invariante da empresa: **nenhum número entra sem fonte.** Cada valor de tecido calibrado aponta para a amostra, a foto e a data da medida.

## O que cada parâmetro é e como medir

| Parâmetro em `Fabric` | O que faz na simulação | Teste | Como entra |
|---|---|---|---|
| `density` | massa por área (peso) | gramatura | direto |
| `thickness` | distância mínima ao corpo e entre camadas | espessura | direto |
| `bendingLength` | comprimento de flexão: resistência a dobrar (armado × fluido) | régua na borda da mesa | ajustado pelo script |
| `stretch.warp/weft/bias` | quanto cede no fio, na trama e no viés | tira com peso (500 g) | ajustado pelo script |
| `maxStretch` | limite de esticamento (mapa de pressão) | tira com peso maior (2 kg) | direto |
| `friction` | quanto a roupa escorrega no corpo | plano inclinado | direto (prioridade baixa) |
| — | diferença fio × trama | régua no fio e na trama | aviso |
| — | conferência | coeficiente e ondas do disco | só validação, com aviso |

Atenção a um detalhe da simulação: o esticamento é por aresta da malha, e as dobras finas dependem do tamanho dela, então tudo é ajustado no espaçamento da Prova (`PROVA_MESH_SPACING`, 30 mm, e `PROVA_ITERATIONS`). A flexão de curvatura quase não depende da malha na régua, mas o disco sim. Se a malha da Prova mudar, a calibração precisa rodar de novo. O script refaz isso sozinho a partir das medidas.

## Material (cerca de R$ 150)

- Balança de cozinha com precisão de 0,1 g.
- Paquímetro (o digital simples serve).
- Régua de 50 cm, trena, fita crepe e caneta para tecido.
- Mesa com a borda reta e um transferidor (ou um esquadro de 45°).
- Prato ou tampa de 18 cm de diâmetro, apoiado num copo mais estreito que ele (o disco do caimento).
- Celular num tripé (ou numa pilha de livros) e uma régua fotografada junto em toda foto.
- Pesos: garrafas d'água (500 g e 2 kg) e dois prendedores largos (os de papel, tipo *binder*).
- Uma tábua lisa com uma folha de EVA ou silicone (imita a pele no teste de atrito).

## Amostras

- **Por tecido da biblioteca:** pelo menos 2 tecidos reais diferentes (ex.: dois tricolines de fornecedores diferentes). Os 12 presets viram a média de amostras medidas.
- **De cada amostra:** 1 quadrado de 10 × 10 cm, 3 tiras de 25 × 250 mm (fio, trama e viés a 45°), 3 tiras de 50 × 300 mm (fio, trama e viés) e 1 círculo de 30 cm de diâmetro.
- Corte com o fio marcado com caneta. Antes de medir, deixe o tecido 24 h aberto e passe a ferro sem vapor se estiver amassado.
- Anote: nome comercial, composição, fornecedor e o que está escrito na etiqueta do rolo (gramatura e largura de fábrica, se tiver).

## Os testes

### 1. Gramatura (5 min)

Pese o quadrado de 10 × 10 cm. Gramatura (g/m²) = peso em gramas × 100. Confira com a etiqueta do rolo: se diferir mais de 10%, meça um segundo quadrado.

### 2. Espessura (5 min)

Dobre o quadrado em 4 camadas e meça com o paquímetro apertando só até encostar. Espessura = medida ÷ 4. Faça em 3 pontos e use a média.

### 3. Régua na borda da mesa: flexão (15 min, obrigatório)

É ela que **ajusta a flexão**: o script procura o comprimento de flexão que dá a queda média de fio e trama, e avisa quando os dois diferem mais de 2×.

Para as tiras de 25 × 250 mm, no fio e na trama:

1. Ponha a tira sobre a mesa com **150 mm para fora da borda** e segure o resto com um livro.
2. Fotografe de lado, com o celular na altura da mesa e a régua em pé na borda.
3. Meça na foto **quanto a ponta caiu** (mm abaixo do tampo) e o **ângulo da ponta**.
4. Vire a tira (o direito para baixo) e repita. Use a média dos dois lados.

Por que essa versão e não a da norma (ASTM D1388, que procura o comprimento em que a ponta toca uma rampa de 41,5°): com o pedaço para fora fixo, o mesmo teste é fácil de montar na simulação (uma tira presa numa ponta) e a comparação fica direta. O teste diferencia melhor com uns **2 × o comprimento de flexão** para fora: 150 mm para um tecido armado (jeans, sarja); para um tecido fluido (chiffon, viscose, malha), use 60 a 80 mm, senão a ponta cai na vertical e o teste não diferencia.

A simulação de hoje tem **uma flexão só** (igual em todas as direções). Medimos fio e trama para saber o tamanho do erro; o ajuste usa a média. Se a diferença passar de 2×, isso vira um item para a flexão por direção.

### 4. Tira com peso: esticamento (20 min)

Para as tiras de 50 × 300 mm, no fio, na trama e no viés:

1. Marque duas linhas a **200 mm** uma da outra, no meio da tira.
2. Prenda a tira por cima (prendedor largo na beira da mesa ou numa porta) e pendure o outro prendedor sozinho. Meça a distância entre as marcas (é o zero).
3. Pendure **500 g**, espere 1 minuto e meça. Depois **2 kg**, espere 1 minuto e meça.
4. Esticamento = (medida − zero) ÷ zero.

- O de **500 g** ajusta a complacência (`stretch.warp/weft/bias`).
- O de **2 kg** dá o limite (`maxStretch`). Na malha e na ribana, use o maior entre o de 2 kg e o que a mão consegue esticar sem forçar a costura (anote qual foi).

### 5. Plano inclinado: atrito (10 min, prioridade baixa)

Prenda um quadrado do tecido debaixo de um livro de peso conhecido, sobre a tábua coberta de EVA. Levante a tábua devagar até o livro escorregar e meça o ângulo. Atrito = tan(ângulo). O EVA não é pele; isso só ordena os tecidos (o chiffon escorrega mais que o moletom). Fica como medida aproximada.

### 6. Caimento no disco: conferência (15 min, obrigatório)

É a versão caseira do teste de Cusick, a medida clássica de caimento.

1. Centre o círculo de 30 cm sobre o disco de 18 cm (direito para cima, fio marcado).
2. Espere 1 minuto e fotografe **de cima, a 1 m de altura**, com a régua no plano do disco e um fundo de cor diferente do tecido.
3. Repita com o círculo girado 90° e com o avesso para cima.

Na foto, conte as **ondas** (quantas dobras se formam) e meça a **área da sombra** do tecido (o script mede a partir da foto, ou a pessoa contorna num app de imagem). Coeficiente de caimento:

```
CC = (área da sombra − área do disco) ÷ (área do círculo − área do disco)
```

CC perto de 1 é armado (o tecido quase não cai); perto de 0, muito fluido. Desde a flexão de curvatura, o disco é **conferência**: o script avisa quando o CC simulado erra por mais da tolerância e quando as ondas erram por mais de 1. Na malha da Prova a borda do círculo tem poucos pontos, então a contagem de ondas da simulação é aproximada, e os tecidos fluidos caem mais que na de 10 mm.

## Onde as medidas ficam

`packages/cloth/calibration/medidas.json`, uma entrada por amostra:

```json
{
  "id": "tricoline-fornecedorA-2026-11",
  "preset": "tricoline",
  "tecido": { "nome": "…", "composicao": "100% algodão", "fornecedor": "…" },
  "medidoEm": "2026-11-20",
  "medidoPor": "…",
  "gramatura": 118,
  "espessuraMm": 0.31,
  "regua": { "foraMm": 150, "fio": { "quedaMm": 74 }, "trama": { "quedaMm": 81 } },
  "peso": {
    "fio":   { "zeroMm": 200, "g500Mm": 201, "g2000Mm": 203 },
    "trama": { "zeroMm": 200, "g500Mm": 202, "g2000Mm": 206 },
    "vies":  { "zeroMm": 200, "g500Mm": 209, "g2000Mm": 226 }
  },
  "atrito": { "anguloGraus": 24 },
  "disco": { "cc": 0.62, "ondas": 6 },
  "fotos": ["calibration/fotos/tricoline-fornecedorA/regua-fio.jpg"]
}
```

Os números acima são **só um exemplo do formato**, não uma medida. As fotos ficam em `packages/cloth/calibration/fotos/`, junto.

## O script de ajuste

Código em `packages/cloth/src/calibration/`: `measurements.ts` (lê e confere o `medidas.json`, com as mensagens em português), `bench.ts` (os testes montados na simulação), `fit.ts` (o ajuste) e `ajustar.ts` (o script). Rodado à mão, não no CI:

```bash
npm run calibrate -w @alinhavo/cloth
```

Para cada amostra (cerca de 35 s cada):

1. Gramatura, espessura (até 2,5 mm, o que a Prova aceita), atrito e limite entram direto. O limite é o maior esticamento com 2 kg, e nunca abaixo do medido com 500 g.
2. **Tira com peso:** tira de 90 × 300 mm presa em cima, carga na borda de baixo na mesma proporção por largura da tira real. É resolvida como **equilíbrio estático** (Newton) das mesmas restrições da simulação: esticamento por aresta pela direção do fio e o limite (a flexão de curvatura não age com a tira plana). Rodar a simulação com 500 g pendurados numa tira de ~1 g não converge com 2 iterações por subpasso, e a tira esticaria por erro numérico, não pelo tecido. As três complacências andam juntas: a cada rodada, cada uma é multiplicada pela razão medido ÷ simulado da sua direção.
3. **Régua:** a tira deitada na mesa, presa atrás, com o mesmo pedaço para fora da medida, na malha da Prova e com a gravidade, até assentar. Bissecção do comprimento de flexão em escala logarítmica (de 2 a 300 mm) até a queda medida.
4. **Disco:** a simulação da Prova como ela roda, até assentar, só para conferir o CC e as ondas.

O resultado vai para `packages/cloth/calibration/resultado.json`: os valores por amostra, o simulado contra o medido, a média por preset (média geométrica nas complacências, aritmética no resto), o preset atual ao lado e o disco também numa malha de 10 mm.

Quem atualiza `fabrics.ts` é uma pessoa, depois de ler os avisos. Cada preset ganha um comentário com as amostras de onde saiu. Os avisos que o script dá:

- a medida ficou fora do que a simulação alcança (esticamento ou régua);
- o CC do disco simulado erra por mais da tolerância (a flexão vem da régua);
- com 500 g a tira já chega no limite (o limite manda, não a complacência);
- fio e trama diferem mais de 2× na régua (uma flexão só erra muito);
- as ondas do disco erram por mais de 1;
- espessura acima de 2,5 mm.

## O teste que fica

`packages/cloth/src/calibration/calibration.test.ts` roda no CI, como os outros:

- o `medidas.json` do repositório lê sem problema, e as amostras erradas são recusadas;
- os colisores da bancada (mesa e disco) dão a distância exata;
- a tira com peso: a trama cede mais que o fio, o esticamento é proporcional à carga e por largura, e nunca passa do limite;
- o ajuste acha de volta as complacências e o comprimento de flexão de um tecido conhecido;
- a régua: a tira plana se segura conforme o tecido (o jeans fica para fora da mesa, o chiffon pende reto);
- **cada preset com amostras medidas reproduz a média delas** dentro das tolerâncias (`CALIBRATION_TOLERANCE` em `fit.ts`). Medida nova e preset atualizado vão juntos no mesmo PR, senão o CI falha.

Um teste do app (`apps/web/src/lib/prova/calibration-sync.test.ts`) confere que a malha e as iterações da Prova são as da calibração (`CALIBRATION_SPACING`, `CALIBRATION_ITERATIONS`).

Tolerâncias iniciais (a revisar quando houver as primeiras medidas):

| Medida | Tolerância |
|---|---|
| Gramatura e espessura | ±10% |
| Esticamento a 500 g | ±20% |
| Coeficiente de caimento (disco) | ±0,08 |
| Ondas (disco) | ±1, só aviso |

Se um preset não bate depois do ajuste, a falha é do **modelo**, não dos números. Isso vira um item no roadmap (flexão por direção, malha mais fina).

## A prova de verdade

Depois dos números, uma peça. Para 3 tecidos (um armado, um médio, um fluido):

1. Costurar a **saia-base** dos exemplos (`lib/examples.ts`) no tamanho M.
2. Vestir num manequim de loja com as medidas do M da tabela de demonstração, ou numa pessoa com essas medidas.
3. Fotografar de frente, de lado e de costas, a 2 m, na altura do quadril.
4. Tirar as mesmas capturas na Prova (o manequim ajustado às mesmas medidas).
5. Comparar: o comprimento visto de lado, a largura da barra de frente e o número e o lugar das dobras.

A comparação do passo 5 é da **modelista ou da estilista**, não de quem escreveu o código. O resultado (fotos lado a lado, o que bateu e o que não bateu) vai para `docs/` e é ele que diz o que o Comercial pode prometer.

## Ordem

| Fase | O que | Quem | Tempo |
|---|---|---|---|
| A | Medir 3 tecidos (malha, tricoline, jeans) para testar o protocolo | Paulo ou uma confecção parceira | 1 tarde |
| B | `medidas.json`, script de ajuste e os testes (**pronta**, 16/11/2026) | engenharia | feito |
| C | Ajustar os 3, rodar o disco e a prova da saia; revisar o protocolo e as tolerâncias | engenharia + modelista | 1–2 dias |
| D | Medir os outros 9 (2 amostras cada) e atualizar `fabrics.ts` | Paulo ou parceira + engenharia | 1 semana |
| E | No cadastro do tecido (`/tecidos/[id]`), oferecer o "teste da régua": a confecção mede a queda da tira e a Prova ajusta o comprimento de flexão daquele tecido (o disco de conferência) | produto + engenharia | a decidir |

A fase E é o que transforma a calibração em diferencial: hoje o cadastro ajusta o caimento numa escala de 1 a 5 de olho (`drape` em `tuneFabric`). Com a régua, a confecção mede o tecido dela em 15 minutos com uma régua e uma mesa, e a Prova usa o valor medido. O ajuste pela régua é uma bissecção de poucos segundos e pode rodar no navegador, num Worker.

Feito em 16/11/2026, antes da fase D: a flexão por distância foi trocada pela **de curvatura** (ver acima), que segura tecido plano. Uma flexão pelo ângulo entre os triângulos (diedro) também seguraria, mas custa mais e fica instável com o tecido dobrado quase por inteiro.

## O que a calibração não resolve

Fica registrado para ninguém vender a mais:

- **A roupa não colide com ela mesma**: dobras de babado ou de saia muito ampla podem se atravessar.
- **A malha de 30 mm não mostra ruga fina** nem franzido, e nos tecidos fluidos faz o caimento cair mais que o real (ver o item 3 do começo).
- **Não tem movimento**: as poses são paradas.
- **O manequim é procedural**: na axila o braço entra uns 15 mm no tronco.
- **A flexão é uma só para todas as direções** (fio e trama dobram igual; o ajuste usa a média da régua).
- **O tecido é elástico**: não guarda vinco nem memória de dobra.

Com a calibração feita, a frase honesta passa a ser: "o caimento da Prova bate com o tecido medido dentro de X% no teste do disco". Antes dela, é "um caimento plausível para esse tipo de tecido".
