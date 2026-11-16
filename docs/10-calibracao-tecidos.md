# Calibração dos tecidos da Prova 3D

**Status (16/11/2026):** fase B pronta (arquivo de medidas, script de ajuste e testes em `packages/cloth/src/calibration/`). Nenhuma medida real ainda: falta a fase A.

## O que a fase B descobriu (antes de qualquer medida)

1. **A flexão da simulação não segura tecido plano.** Ela é uma distância entre os vértices opostos de dois triângulos vizinhos. Com o tecido plano, dobrar um pouco quase não muda essa distância, então ela não resiste. Na régua (15 cm para fora da mesa), toda tira cai quase reta: o jeans cai 147 mm, e mesmo com a flexão mais firme possível cai 132 mm (149 mm numa malha de 10 mm). Por isso **a flexão é ajustada pelo disco**, onde o tecido já está curvo e a flexão responde (coeficiente de 0,16 a 0,94 conforme o valor). A régua continua no protocolo: mede a diferença entre fio e trama e será o alvo de uma flexão por ângulo. Um teste (`limitação conhecida da flexão`) falha de propósito no dia em que a flexão passar a segurar a tira plana.
2. **Com os valores de hoje, toda tira com 500 g chega no limite de esticamento.** Quem segura o tecido é o `maxStretch`, não a complacência: ela está mais mole que qualquer tecido plano real. O ajuste resolve isso com a primeira medida.
3. **A malha de 30 mm deixa o tecido bem mais armado do que ele é.** No mesmo tecido, o disco dá coeficiente 0,61 na malha da Prova e 0,26 numa malha de 10 mm. A calibração compensa isso na malha da Prova, que é o certo para a Prova de hoje, mas confirma que a malha grossa esconde muito do caimento. O `resultado.json` mostra os dois números por tecido.

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
| `bend` | resistência a dobrar (armado × fluido) | caimento no disco | ajustado pelo script |
| `stretch.warp/weft/bias` | quanto cede no fio, na trama e no viés | tira com peso (500 g) | ajustado pelo script |
| `maxStretch` | limite de esticamento (mapa de pressão) | tira com peso maior (2 kg) | direto |
| `friction` | quanto a roupa escorrega no corpo | plano inclinado | direto (prioridade baixa) |
| — | diferença fio × trama, flexão futura | régua na borda da mesa | aviso e registro |
| — | conferência | ondas do disco | só validação |

Atenção a um detalhe da simulação: a flexão é aplicada por par de vértices da malha, então **o valor de `bend` depende do espaçamento da malha**. Tudo é ajustado no espaçamento da Prova (`PROVA_MESH_SPACING`, 30 mm, e `PROVA_ITERATIONS`). Se a malha da Prova mudar, a calibração precisa rodar de novo. O script refaz isso sozinho a partir das medidas.

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

### 3. Régua na borda da mesa: diferença fio × trama (15 min)

Hoje não ajusta a flexão (ver "O que a fase B descobriu"): o script compara com a simulação e avisa quando fio e trama diferem mais de 2×. Continua no protocolo porque é barato e é o alvo da flexão por ângulo.

Para as tiras de 25 × 250 mm, no fio e na trama:

1. Ponha a tira sobre a mesa com **150 mm para fora da borda** e segure o resto com um livro.
2. Fotografe de lado, com o celular na altura da mesa e a régua em pé na borda.
3. Meça na foto **quanto a ponta caiu** (mm abaixo do tampo) e o **ângulo da ponta**.
4. Vire a tira (o direito para baixo) e repita. Use a média dos dois lados.

Por que essa versão e não a da norma (ASTM D1388, que procura o comprimento em que a ponta toca uma rampa de 41,5°): com o pedaço para fora fixo, o mesmo teste é fácil de montar na simulação (uma tira presa numa ponta) e a comparação fica direta. Para um tecido muito fluido (chiffon, viscose), use 80 mm para fora, senão a ponta cai na vertical e o teste não diferencia.

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

### 6. Caimento no disco: flexão (15 min, obrigatório)

É a versão caseira do teste de Cusick, a medida clássica de caimento.

1. Centre o círculo de 30 cm sobre o disco de 18 cm (direito para cima, fio marcado).
2. Espere 1 minuto e fotografe **de cima, a 1 m de altura**, com a régua no plano do disco e um fundo de cor diferente do tecido.
3. Repita com o círculo girado 90° e com o avesso para cima.

Na foto, conte as **ondas** (quantas dobras se formam) e meça a **área da sombra** do tecido (o script mede a partir da foto, ou a pessoa contorna num app de imagem). Coeficiente de caimento:

```
CC = (área da sombra − área do disco) ÷ (área do círculo − área do disco)
```

CC perto de 1 é armado (o tecido quase não cai); perto de 0, muito fluido. O **CC ajusta a flexão**; as **ondas** não entram no ajuste e servem de conferência (o script avisa quando a simulação erra por mais de 1). Na malha da Prova a borda do círculo tem poucos pontos, então a contagem de ondas da simulação é aproximada.

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
2. **Tira com peso:** tira de 90 × 300 mm presa em cima, carga na borda de baixo na mesma proporção por largura da tira real. É resolvida como **equilíbrio estático** (Newton) das mesmas restrições da simulação: esticamento por aresta pela direção do fio, pares de flexão e o limite. Rodar a simulação com 500 g pendurados numa tira de ~1 g não converge com 2 iterações por subpasso, e a tira esticaria por erro numérico, não pelo tecido. As três complacências andam juntas: a cada rodada, cada uma é multiplicada pela razão medido ÷ simulado da sua direção.
3. **Disco:** a simulação da Prova como ela roda (malha de 30 mm, 2 iterações, gravidade), até assentar. Bissecção da flexão em escala logarítmica (de 1e-7 a 1e-1) até o CC medido.
4. **Régua:** simulada só para registro (com a flexão de hoje, a tira cai quase reta).

O resultado vai para `packages/cloth/calibration/resultado.json`: os valores por amostra, o simulado contra o medido, a média por preset (média geométrica nas complacências, aritmética no resto), o preset atual ao lado e o disco também numa malha de 10 mm.

Quem atualiza `fabrics.ts` é uma pessoa, depois de ler os avisos. Cada preset ganha um comentário com as amostras de onde saiu. Os avisos que o script dá:

- a medida ficou fora do que a simulação alcança (esticamento ou disco);
- com 500 g a tira já chega no limite (o limite manda, não a complacência);
- fio e trama diferem mais de 2× na régua (uma flexão só erra muito);
- as ondas do disco erram por mais de 1;
- espessura acima de 2,5 mm.

## O teste que fica

`packages/cloth/src/calibration/calibration.test.ts` roda no CI, como os outros:

- o `medidas.json` do repositório lê sem problema, e as amostras erradas são recusadas;
- os colisores da bancada (mesa e disco) dão a distância exata;
- a tira com peso: a trama cede mais que o fio, o esticamento é proporcional à carga e por largura, e nunca passa do limite;
- o ajuste acha de volta as complacências e a flexão de um tecido conhecido;
- a **limitação conhecida da flexão**, que falha de propósito quando a flexão passar a segurar tecido plano;
- **cada preset com amostras medidas reproduz a média delas** dentro das tolerâncias (`CALIBRATION_TOLERANCE` em `fit.ts`). Medida nova e preset atualizado vão juntos no mesmo PR, senão o CI falha.

Um teste do app (`apps/web/src/lib/prova/calibration-sync.test.ts`) confere que a malha e as iterações da Prova são as da calibração (`CALIBRATION_SPACING`, `CALIBRATION_ITERATIONS`).

Tolerâncias iniciais (a revisar quando houver as primeiras medidas):

| Medida | Tolerância |
|---|---|
| Gramatura e espessura | ±10% |
| Esticamento a 500 g | ±20% |
| Coeficiente de caimento (disco) | ±0,08 |
| Ondas (disco) | ±1, só aviso |

Se um preset não bate depois do ajuste, a falha é do **modelo**, não dos números. Isso vira um item no roadmap (flexão por ângulo, flexão por direção, malha mais fina).

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
| E | No cadastro do tecido (`/tecidos/[id]`), oferecer o "teste do prato": a confecção mede o caimento no disco e a Prova ajusta a flexão daquele tecido (o "teste da régua" quando a flexão for por ângulo) | produto + engenharia | a decidir |

A fase E é o que transforma a calibração em diferencial: hoje o cadastro ajusta o caimento numa escala de 1 a 5 de olho (`drape` em `tuneFabric`). Com o prato, a confecção mede o tecido dela em 15 minutos e a Prova usa o valor medido. O ajuste da flexão pelo disco leva cerca de 15 s e pode rodar no navegador, num Worker.

Candidata a entrar antes da fase D: **trocar a flexão por distância por uma flexão por ângulo** (diedro). Ela segura tecido plano, que é o que falta para uma gola, um cós ou uma saia de sarja armarem na Prova. Muda o caimento de todas as roupas, então vem com a recalibração.

## O que a calibração não resolve

Fica registrado para ninguém vender a mais:

- **A roupa não colide com ela mesma**: dobras de babado ou de saia muito ampla podem se atravessar.
- **A malha de 30 mm não mostra ruga fina** nem franzido.
- **Não tem movimento**: as poses são paradas.
- **O manequim é procedural**: na axila o braço entra uns 15 mm no tronco.
- **A flexão é uma só para todas as direções** e, sendo por distância, **não segura tecido plano** (gola, cós e painel armado caem mais do que deveriam).
- **O tecido é elástico**: não guarda vinco nem memória de dobra.

Com a calibração feita, a frase honesta passa a ser: "o caimento da Prova bate com o tecido medido dentro de X% no teste do disco". Antes dela, é "um caimento plausível para esse tipo de tecido".
