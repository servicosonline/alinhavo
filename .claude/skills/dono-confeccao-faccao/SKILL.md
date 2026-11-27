---
name: dono-confeccao-faccao
description: Base de conhecimento empírica sobre a realidade, vocabulário técnico, dores operacionais/financeiras e critérios de decisão de proprietários de confecção de roupas, modelistas, cortadores e donos de facção de costura no Brasil. Use SEMPRE que estiver projetando funcionalidades, telas, UX, regras de negócio, cálculos têxteis (modelagem, gradação, encaixe, risco, enfesto, corte, ficha técnica, minuto costurado, OP, controle de facção) ou textos/copy para o app Alinhavo ou para o setor de confecção e vestuário.
---

# Persona & Domínio: Proprietário de Confecção, Modelista e Faccionista (Brasil)

Esta skill incorpora a realidade empírica das micro, pequenas e médias confecções e facções de costura brasileiras (baseada em 66 fontes acadêmicas e setoriais: USP, UNICAMP, UDESC, UNILAB, ENEGEP, ABIT, IEMI, SEBRAE e RAIS/MTE).

---

## 1. Quem é o Usuário (Perfil Real e Diferença entre Confecção e Facção)

### 1.1. O Cenário Brasileiro em Números Reais
- **Pulverização extrema:** O Brasil possui mais de **20.036 confecções formais** (além de dezenas de milhares de oficinas informais nos polos do Agreste-PE, Vale do Itajaí-SC, Fortaleza/Barreira-CE, Brás/Bom Retiro-SP, Cianorte/Maringá-PR, Goiânia-GO e Sul de Minas). **95% a 97% são Micro e Pequenas Empresas (MPEs)** com até 49 funcionários.
- **O dono sobrecarregado ("Euquipe" ou Gestão Familiar Centralizada):** Nas pequenas confecções (10 a 30 costureiras), o proprietário/gestor acumula compras de tecido, desenvolvimento/modelagem, negociação com facções, financeiro e resolução de problemas minuto a minuto no chão de fábrica. Ele **não tem tempo para alimentar sistemas burocráticos**.
- **Escolaridade e formação prática no chão de fábrica:** Nas facções, cerca de 60% dos donos têm ensino fundamental e 80% aprenderam o ofício na prática familiar ou trabalhando em outras oficinas. Os operadores de costura e corte leem pouco texto longo: **tudo precisa ser visual, direto, com ícones/cores claros e números grandes**.

### 1.2. Confecção vs. Facção (Nunca confunda no produto!)
- **Confecção (Marca Própria / Atacado / Modinha / Private Label):**
  - Compra o rolo de tecido (que representa **50% a 70% do custo da peça**) e os aviamentos.
  - Faz (ou contrata) **Modelagem → Gradação → Encaixe/Risco → Enfesto → Corte**.
  - Costura internamente e/ou envia pacotes cortados para **facções externas**.
  - **Medo nº 1:** Perder tecido no corte (retalho), errar na modelagem/grade e a peça encalhar, ou tomar calote/atraso de facção e lojista.
- **Facção de Costura (Oficina Terceirizada / Faccionista):**
  - **Não compra tecido.** Recebe os pacotes já cortados (com ou sem aviamentos) da confecção tomadora.
  - Vende **tempo de máquina / minuto costurado** (cobra por peça pronta, ex.: R$ 2,50 para fechar uma camiseta ou R$ 8,00 num jeans).
  - **Medo nº 1:** Trabalhar o mês inteiro no prejuízo porque o preço por peça pago pelo tomador não cobre o custo-minuto (energia elétrica, linha, manutenção, folha), ficar sem serviço na entressafra ou ter o lote descontado por defeito de costura.

---

## 2. Vocabulário Obrigatório do Chão de Fábrica (Fale a língua do confeccionista)

Ao escrever interfaces, labels, relatórios, tooltips ou mensagens no **Alinhavo**, use sempre os termos reais do setor no Brasil:

| Termo Técnico Real | O que significa na prática da fábrica | Termos genéricos/errados a EVITAR |
|---|---|---|
| **Molde / Partes do Molde** | Cada peça geométrica que compõe a roupa (frente, costas, manga, gola, revel, cós, bolso, vista, pala, braguilha). | "Shape", " polígono", "elemento gráfico" |
| **Fio do Tecido (Urdume / Trama / Viés)** | Direção longitudinal do rolo de tecido (paralela à ourela). O molde deve respeitar a seta do fio para a roupa não torcer após lavar. | "Eixo X/Y", "orientação do vetor" |
| **Ourela** | As bordas laterais de acabamento do rolo de tecido (frequentemente furadas ou mais grossas, descontadas da largura útil). | "Margem lateral do material" |
| **Gradação (ou Graduação / Ampliação)** | Processo de aumentar e diminuir o molde-base (ex.: M ou 40) para toda a **Grade** (PP, P, M, G, GG, XG / 36 ao 54). | "Escalonamento", "redimensionamento" |
| **Grade (de Corte / de Pedido)** | Proporção de tamanhos em um lote (ex.: Grade 1-2-2-1 para P-M-G-GG). | "Mix de tamanhos", "distribuição" |
| **Encaixe e Risco** | Posicionamento estratégico dos moldes da grade dentro da largura útil do tecido para gastar o mínimo possível de metros e gerar o menor desperdício. | "Nesting", "layout de peças" |
| **Aproveitamento / Eficiência do Encaixe (%)** | Percentual da área do tecido efetivamente ocupada pelos moldes (ex.: 84% de aproveitamento = 16% de quebra/retalho). | "Taxa de ocupação" |
| **Enfesto (e Folhas do Enfesto)** | Camadas de tecido empilhadas na mesa de corte (ex.: um enfesto de 40 folhas com 2 moldes de tamanho M no risco gera 80 peças M cortadas). | "Pilha de material", "camadas de lote" |
| **Enfesto Par vs. Folha Única / Direito com Direito** | Forma de estender o tecido que determina se moldes simétricos (manga esquerda/direita, perna esquerda/direita) precisam ser espelhados no risco. | "Simetria de camada" |
| **Estampa Corrida / Pé de Galinha / Estampa Barrada** | Tecidos com sentido único (pelo, veludo, estampa com pé) ou desenho na borda (barrado) que proíbem girar o molde em 180° ou 90°. | "Restrição de rotação de textura" |
| **Pique e Furo de Marcação** | Pequenos cortes na borda do molde (piques) que guiam a costureira para encaixar manga na cava, meio da frente ou pences sem usar fita métrica. | "Marcador de alinhamento" |
| **Peça-Piloto (Pilotagem)** | Primeira peça física costurada a partir do molde para testar caimento, vestibilidade, sequência operacional e consumo real antes de liberar o corte em série. | "Protótipo MVP", "amostra beta" |
| **Ficha Técnica** | Documento mestre da peça contendo desenho técnico (frente/costas), tecidos, aviamentos, consumo, tabela de medidas, risco/corte e sequência operacional. | "Especificação de produto", "BOM" |
| **Sequência Operacional** | Lista ordenada de cada operação de costura (ex.: 1. Unir ombros na overloque; 2. Pregar gola na galoneira; 3. Rebater gola na reta) com máquina e tempo padrão. | "Roteiro de manufatura" |
| **Pacote (ou Fardo / Lote)** | Conjunto de partes cortadas amarradas por cor e tamanho que circula junto pelo chão de fábrica ou vai para a facção. | "Sub-lote", "batch unitário" |
| **Ordem de Produção (OP) / Ordem de Corte (OC)** | Documento que autoriza e rastreia o corte e a costura de uma referência em determinada grade e cor. | "Job", "Work Order" |
| **Romaneio (de Corte / de Facção / de Expedição)** | Relação detalhada de peças por cor e tamanho enviada para a facção ou entregue ao cliente. | "Packing list" |
| **Minuto Costurado / Custo-Minuto** | Custo de manter 1 costureira produzindo por 1 minuto (Despesas Fixas + Folha ÷ Minutos Produtivos do mês). Base real para precificar facção e confecção. | "Taxa horária de mão de obra" |
| **Segunda Qualidade (2ª Qualidade)** | Peça com defeito leve de costura, mancha de óleo ou furo de agulha que não pode ser vendida pelo preço cheio (ou é descontada da facção). | "Refugo parcial", "item não-conforme" |

---

## 3. Dores Reais, Gargalos Técnicos e Parâmetros Numéricos (Regras de Negócio)

Sempre que projetar cálculos, validações, alertas ou fluxos no **Alinhavo**, considere estas verdades empíricas comprovadas na literatura e no chão de fábrica:

### 3.1. Sala de Corte, Modelagem, Gradação e Encaixe (Onde o lucro vaza primeiro)
1. **15% a 20% do tecido vira lixo (retalho) no corte convencional:**
   - O tecido representa **50% a 70% do custo direto da peça**. Qualquer ganho de 3% a 8% na eficiência do encaixe representa aumento direto na margem líquida da confecção.
   - Em um estudo experimental da USP (Kauvauti, 2022), cortar 100 calças (enfesto de 50 folhas em tecido de 1,50 m) no encaixe convencional consumiu **114,5 m de tecido** (17% de perda = **19 metros jogados fora**), enquanto um encaixe otimizado reduziu o consumo para **90 m** (economia de **24,5 metros de tecido em uma única OP**).
2. **A armadilha da Variação de Largura do Rolo (Ourela a Ourela):**
   - Fornecedores entregam rolos com larguras diferentes (ex.: anunciado 1,50 m, mas chega com 1,44 m ou 1,38 m úteis descontando a ourela, ou varia entre partidas/cores).
   - **Regra para o Alinhavo:** Todo cálculo de encaixe/risco deve exigir ou alertar sobre a **Largura Útil Real do Rolo** (descontando ourelas e margem de segurança) e permitir recalcular rapidamente caso o rolo na mesa seja mais estreito.
3. **Restrições Físicas Inegociáveis do Tecido no Encaixe:**
   - **Sentido do Fio (Urdume):** Peças não podem ser rotacionadas livremente (ex.: 15° ou 45°) apenas para caber no espaço vazio, salvo se o modelo for explicitamente cortado no viés. Permite-se 0°/180° em tecidos comuns, ou **apenas 0° (sentido único)** em tecidos com pelo (veludo, moletom peluciado), brilho direcional ou estampa com pé.
   - **Estampa Barrada:** Em vestidos e peças com barra estampada, os moldes precisam alinhar a bainha na lateral do rolo (ou na barra da estampa), o que reduz drasticamente o aproveitamento e exige simulação visual cuidadosa.
   - **Direito/Avesso e Espelhamento:** Partes pares (manga dir./esq., frente dir./esq., perna dir./esq.) exigem espelhamento obrigatório no risco quando o enfesto é estendido em folha simples (direito para cima) ou enfesto ímpar.
4. **Gargalos de Gradação e Margem de Costura:**
   - Pequenas confecções erram ao ampliar linearmente do P ao GG/Plus Size sem compensar cavas, ganchos e elasticidade (ex.: cós de calça fitness em poliamida/elastano que cede ou aperta nos extremos da grade).
   - Moldes criados sem a **margem de costura específica de cada máquina** (ex.: 0,5 cm a 0,7 cm para overloque; 1,0 cm para reta; 1,5 cm a 2,0 cm para bainha na galoneira) geram peças menores ou maiores que a tabela de medidas.

### 3.2. PCP, Ficha Técnica, Qualidade e Gestão de Facções
1. **A Ficha Técnica não pode morar numa pasta de escritório:**
   - No chão de fábrica real, fichas em pastas físicas não são lidas pelas costureiras nem pelo acabamento.
   - **Erro clássico de chão de fábrica:** Troca de etiquetas de tamanho (costurar/taguear peça **P como M ou G**) ou misturar referências na mesa de dobra/embalagem. Qualquer tela ou impresso de OP/Acabamento do Alinhavo deve funcionar como um **Poka-Yoke visual** (separação cristalina por cor e tamanho P/M/G/GG).
2. **O impacto de organizar o fluxo (Kanban + Visibilidade de OP):**
   - Estudos empíricos em confecções brasileiras mostram que tirar as OPs do caderno e implantar controle visual (Kanban de pacotes, balanceamento entre costura interna e facção) reduz o *lead time* entre **30% e 82%**, corta o estoque em processo (WIP) em **20%** e aumenta a produtividade de facções entre **50% e 100%** sem contratar mais gente.
3. **A dor da Terceirização (Confecção ↔ Facção):**
   - Para a **Confecção**: enviar lotes para 5, 20 ou 80 facções sem controle digital gera perda de peças, falta de aviamentos enviados a menos, atraso invisível e risco trabalhista grave (responsabilidade subsidiária/solidária em fiscalizações do MTE/MPT quando há descontrole ou precarização).
   - Para a **Facção**: falta de peça-piloto/ficha clara enviada pelo tomador, máquinas paradas por falta de mecânico, disputa acirrada ("leilão") por costureiras qualificadas e **paradoxo da formalização** (70% das facções em polos estudados têm CNPJ/MEI, mas só 30% conseguem assinar CTPS porque muitos costureiros recusam registro formal para não perder benefícios sociais como Bolsa Família).

### 3.3. Precificação Real e Custo-Minuto (A Conta que o Dono Não Sabe Fazer)
- A maioria das MPEs do vestuário precifica copiando o concorrente ou aplicando um multiplicador cego (ex.: "custo do tecido × 2,5 ou × 3"), ignorando a complexidade de costura da peça.
- **Fórmula Real do Custo-Minuto que o Alinhavo deve dominar:**
  - $\text{Minutos Produtivos Disponíveis no Mês} = \text{Nº de Costureiras Diretas} \times \text{Minutos da Jornada Mensal} \times \text{Eficiência Real (tipicamente 70\% a 85\%)}$
  - $\text{Custo-Minuto da Fábrica} = \frac{\text{Folha + Encargos + Aluguel + Energia + Manutenção + Custos Fixos}}{\text{Minutos Produtivos Disponíveis no Mês}}$
  - $\text{Custo de Mão de Obra da Peça} = \text{Tempo Padrão Total da Sequência Operacional (min)} \times \text{Custo-Minuto}$

---

## 4. Diretrizes de Produto, UX e Copywriting para o App Alinhavo

Sempre que criar ou revisar uma funcionalidade no **Alinhavo**, aplique este checklist de validação:

1. **Regra dos 3 Minutos para o Dono Sobrecarregado:**
   - O dono da confecção não tem um departamento de engenharia de produto. Se criar uma Ficha Técnica, calcular um Encaixe/Consumo ou lançar uma Ordem de Produção (OP) exigir preencher 40 campos obrigatórios antes de ver resultado, ele vai abandonar o app.
   - Use **valores padrão inteligentes (smart defaults)** do setor têxtil brasileiro (ex.: larguras de tecido padrão 1,40 m / 1,50 m / 1,60 m; grades comuns P-M-G-GG ou 36-38-40-42-44; máquinas pré-cadastradas: Reta, Overloque 3 fios, Overloque 4 fios/Ponto Cadeia, Galoneira, Travete, Caseadeira, Botoneira).
2. **Outputs Prontos para o Mundo Real (Papel na Mesa de Corte + WhatsApp na Facção):**
   - O cortador trabalha em pé diante de uma mesa de corte de 6 a 12 metros cheia de pó de tecido; a faccionista trabalha no celular ao lado da máquina overloque.
   - Toda tela importante do Alinhavo deve gerar **saídas visuais limpas, com letras grandes, alto contraste e prontas para imprimir em A4/térmica ou enviar em 1 clique no WhatsApp (PDF/imagem/link leve)**.
3. **Linguagem de Ganho Imediato e Concreto (Em Metros de Tecido, Peças e Reais):**
   - Em vez de mostrar apenas métricas abstratas, traduza para a dor do bolso do confeccionista:
     - Bom: *"Aproveitamento: 86,4% — Economia de 14,2 metros de tecido (R$ 497,00 economizados neste enfesto)"*.
     - Ruim: *"Eficiência de nesting polimórfico: 0.864"*.
4. **Prevenção de Erros de Chão de Fábrica (Poka-Yoke Digital):**
   - Destaque visualmente alertas críticos antes do corte ou do envio para facção:
     - *"Atenção: Molde da manga não está espelhado (risco de cortar duas mangas do mesmo lado em enfesto folha única)!"*
     - *"Atenção: Rolo informado (1,42 m) é menor que a largura do risco atual (1,48 m)!"*
     - *"Atenção: Preço pago pelo cliente (R$ 3,50/peça) está abaixo do seu custo-minuto para 12 minutos de costura!"*

