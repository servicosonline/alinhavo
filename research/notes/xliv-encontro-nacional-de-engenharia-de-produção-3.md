---
title: XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO
id: xliv-encontro-nacional-de-engenharia-de-produção-3
tags:
- modelista-producao-moda-dores-0698af
- desenvolvimento-de-produto
- processo-produtivo
- risco-trabalhista
created: '2026-11-27T02:48:44.070722Z'
source: http://www.abepro.org.br/biblioteca/TN_WG_413_2028_47702.pdf
source_domain: www.abepro.org.br
fetched_at: '2026-11-27T02:45:07.587381Z'
fetch_provider: crawl4ai
status: draft
type: note
deprecated: false
summary: XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO
---

XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
 
 
COMPARAÇÃO DE SOFTWARE E MÉTODOS 
HEURÍSTICOS PARA OTIMIZAÇÃO DE CORTE 
BIDIMENSIONAL: ESTUDO EM FÁBRICA DE PEÇAS 
ÍNTIMAS EM FORTALEZA/CE  
Mariana Silva Mendes (Universidade de Fortaleza) 
Antônio Ananias Pinho Mendes (Universidade de Fortaleza) 
Rommel Dias Saraiva (Universidade de Fortaleza) 
Emmanuelle de Oliveira Sancho (Universidade de Fortaleza) 
João Marcelo Carneiro (Universidade de Fortaleza) 
 
 
 
O setor têxtil desempenha um papel essencial na economia brasileira, 
convertendo matéria-prima, como o algodão, em produtos finais, como 
vestidos, para os consumidores. Dentro das indústrias de confecção, o 
setor de risco e corte é importante para otimizar o uso da matéria-prima, 
pois é responsável por preparar o tecido e cortar as peças necessárias 
para a produção. No entanto, o processo de corte frequentemente resulta 
em desperdícios. Neste contexto, este estudo de caso se concentra em 
uma indústria de confecção de peças íntimas, onde são utilizados dois 
softwares: o Audaces Encaixes, que requer uma licença mensal, e o 
Deepnest.IO, uma opção gratuita que utiliza um método de otimização 
baseado em Algoritmo Genético. O objetivo é comparar a eficácia 
desses dois softwares. Por meio de simulações computacionais divididas 
em duas baterias de testes, os resultados mostram que o Audaces 
Encaixes alcança resultados superiores em comparação com o 
Deepnest.IO. Além disso, uma análise financeira é proposta para 
determinar se o desperdício gerado pelo Deepnest.IO compensa o custo 
da licença mensal do Audaces Encaixes. Os resultados da análise 
indicam que o Audaces Encaixes é a opção mais vantajosa. Isso ressalta 
a importância de considerar não apenas a eficácia do software, mas 
também o custo-benefício ao tomar decisões sobre qual ferramenta 
utilizar na indústria de confecção de peças íntimas. 
Palavras-chave: Setor têxtil, Pesquisa Operacional, Problema de corte 
bidimensional. 
 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
1 
 
1. Introdução 
 
A representação virtual da realidade por meio de softwares tornou-se uma necessidade na 
sociedade moderna, refletindo a crescente competitividade do mercado. Esse cenário 
impulsionou o desenvolvimento de soluções tecnológicas para representar detalhadamente a 
realidade, especialmente em setores como a indústria têxtil e de confecção, que desempenha 
um papel significativo na economia brasileira, gerando empregos e injetando capital. No 
entanto, as empresas enfrentam desafios para alcançar competitividade, exigindo maior 
produtividade, qualidade e redução de custos. Para isso, é essencial otimizar o aproveitamento 
da matéria-prima, minimizando desperdícios. 
O setor de risco e corte em uma indústria de confecção é fundamental para o aproveitamento 
eficiente da matéria-prima, sendo responsável por definir como as peças serão cortadas a partir 
do tecido. Tradicionalmente, esse processo é realizado de forma manual, dependendo da 
habilidade do operador para desenhar os moldes sobre o tecido, o que pode resultar em 
desperdício significativo de matéria-prima. Uma alternativa é o uso de softwares específicos 
que digitalizam os moldes e geram um layout de corte, otimizando o uso do tecido. No entanto, 
o custo desses softwares licenciados pode ser proibitivo para pequenas empresas, levando à 
busca por alternativas acessíveis. A competitividade do mercado impulsiona os gestores a 
buscar soluções eficazes e acessíveis para garantir resultados promissores diante dos desafios 
enfrentados na indústria têxtil e de confecção. 
Este estudo visa comparar a eficácia de um software gratuito (Deepnest.IO), baseado em meta-
heurísticas, com um software licenciado (Audaces Encaixes) para o processo de risco 
computadorizado. O objetivo é determinar se a solução gratuita é tão eficiente quanto a 
licenciada, considerando o impacto no desperdício de matéria-prima.  
 
2. Fundamentação Teórica 
2.1. Setor de confecção 
Aqui são abordadas as principais etapas do setor de confecção, que incluem modelagem, risco, 
enfesto e corte. 
Na fase inicial de modelagem, fundamental para a produção de vestuário, são desenvolvidos os 
padrões que determinam as dimensões, formas e características detalhadas das peças. Tanto a 
abordagem manual, por meio de moldes físicos, quanto a digital, mediante o emprego de 
softwares específicos, são empregadas nesse contexto. A utilização de ferramentas 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
2 
 
computacionais modernas possibilita a elaboração de modelos tridimensionais, conferindo 
celeridade ao processo e facilitando a visualização das peças. 
Subsequentemente, na etapa de risco, busca-se otimizar a utilização do tecido e minimizar o 
desperdício. Esta etapa pode ser conduzida manualmente, com esboços diretos sobre o tecido, 
ou de forma computadorizada, mediante a utilização de softwares especializados. Esta última 
abordagem proporciona maior precisão e eficácia, reduzindo a variabilidade no processo e 
possibilitando uma visualização prévia do padrão. 
No enfesto, o tecido é estratificado em camadas sobre uma mesa de corte, permitindo o corte 
simultâneo de várias peças. Tal procedimento é importante para evitar desperdícios e otimizar 
o aproveitamento do tecido. O emprego de softwares e equipamentos automatizados contribui 
significativamente para a eficácia dessa fase, incrementando a produtividade do processo. 
Por fim, a etapa de corte envolve a transposição dos padrões para o tecido e o corte preciso das 
peças. Máquinas específicas, como cortadoras manuais ou automáticas, são empregadas para 
tal finalidade. Ademais, medidas de segurança são essenciais durante essa etapa, sendo que a 
utilização de maquinário moderno pode aprimorar a eficiência do processo. 
2.2. Pesquisa operacional 
A Pesquisa Operacional (PO) teve sua origem durante a Segunda Guerra Mundial, quando foi 
necessária uma alocação eficiente dos recursos escassos disponíveis. O sucesso da PO no meio 
militar despertou interesse em outros setores, especialmente durante o crescimento industrial 
pós-guerra. A partir da década de 1950, com o avanço da computação, a PO teve um grande 
impulso, pois problemas complexos demandavam processamento mais rápido e capacidade de 
armazenamento (Andrade, 2015). 
A abordagem da PO assemelha-se ao método científico, iniciando com a coleta de dados e 
construção de modelos matemáticos para representar os problemas reais. Esses modelos passam 
por validação e, se aprovados, são solucionados para oferecer ideias e soluções. A PO visa 
simplificar sistemas complexos, identificando as variáveis mais significativas que influenciam 
o funcionamento do sistema como um todo (Hillier & Lieberman, 2013). 
As fases da PO, ilustradas na Figura 1, incluem a definição do problema, construção do modelo, 
solução do modelo, validação, implementação da solução e avaliação final. Cada fase é 
importante para garantir a eficácia e aplicabilidade das soluções propostas. Existem três 
subáreas na PO: modelos determinísticos, modelos estocásticos e outras técnicas. Cada uma 
dessas subáreas possui ferramentas específicas para lidar com diferentes tipos de problemas e 
cenários (Belfiore & Fávero, 2013). 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
3 
 
Figura 1 - Fases de um estudo de Pesquisa Operacional 
 
Fonte: Andrade (2015) 
2.3. Heurísticas 
As heurísticas, segundo Goldbarg, Goldbarg e Luna (2017), são técnicas computacionais que 
buscam soluções viáveis para problemas de otimização com um esforço computacional 
razoável. Hillier e Lieberman (2013) complementam, destacando que essas técnicas devem ser 
eficientes o suficiente para lidar com problemas complexos. Meta-heurísticas, como a têmpera 
simulada, a otimização por colônia de formigas e os algoritmos genéticos, são métodos gerais 
que fornecem estrutura e diretrizes para o desenvolvimento de soluções específicas para 
diferentes problemas de otimização. 
O Algoritmo Genético (AG) é uma técnica de otimização inspirada nos princípios da evolução 
biológica, em que populações de soluções são submetidas a operadores genéticos, como 
seleção, crossover e mutação, para encontrar soluções promissoras para problemas de 
otimização. Cada solução é representada por um cromossomo, composto por genes que podem 
ter diferentes valores. A avaliação de cada solução é realizada por meio de uma função de 
aptidão, que atribui um valor representativo da qualidade da solução (Linden, 2008). 
Os AGs operam em etapas, representadas pela Figura 2, começando com a inicialização de uma 
população de cromossomos, seguida pela avaliação do fitness de cada indivíduo e a seleção de 
pares de cromossomos para reprodução. Durante a reprodução, os cromossomos pais cruzam 
seus genes para gerar cromossomos filhos, que podem sofrer mutações. Esse processo é 
repetido por várias gerações até que um critério de parada seja atingido, como um número 
máximo de gerações ou um limite de tempo computacional. O AG retorna então a melhor 
solução encontrada (Linden, 2008) 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
4 
 
Figura 2 - Fluxograma de um algoritmo genético básico 
 
Fonte: Elaborado pelos autores (2024) 
A operação de crossover envolve a troca de partes dos cromossomos pais para criar novos 
cromossomos filhos, enquanto a mutação introduz pequenas alterações nos cromossomos para 
explorar novas soluções no espaço de busca. Esses operadores genéticos permitem que os AGs 
explorem o espaço de solução de forma eficiente (Linden, 2008). 
2.4. Problema de corte bidimensional irregular 
O Problema de Corte e Empacotamento (PCE) é um conjunto de desafios de otimização 
combinatória encontrados em diversas indústrias, como as de vidro, granito e madeira 
(Wäscher, Haussner & Schumann, 2007). No contexto dos problemas de corte, o objetivo é 
cortar itens, como peças de granito, em um objeto, como uma chapa de granito, de maneira a 
otimizar um critério, como a minimização do desperdício de material (Iori et al., 2021). Por 
outro lado, nos problemas de empacotamento, os itens, como caixas, devem ser alocados dentro 
de um objeto, como um contêiner, também otimizando uma função objetivo (Bortfeldt & 
Wäscher, 2013). 
Uma variante dos PCEs é o Problema de Corte Irregular Bidimensional, conhecido como Two-
Dimensional Irregular Strip Packing Problem (2DISPP) na literatura estrangeira. Nesse 
problema, um conjunto de itens deve ser cortado em uma faixa retangular de largura fixa e 
comprimento ilimitado, sem que ocorra sobreposição, de modo a minimizar o comprimento 
total da faixa (Gomes & Oliveira, 2006). A Figura 3 apresenta um exemplo dos dados de entrada 
para o problema, enquanto a Figura 4 uma possível solução. 
 
 
 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
5 
 
Figura 3 - Dados de entrada do setor têxtil 
 
Fonte: Oliveira, Gomes e Ferreira (2000) 
 
Figura 4 - Possível plano de corte para dados de entrada do setor têxtil 
 
Fonte: Amaro Junior, Pinheiro e Saraiva (2013) 
Uma abordagem comum na literatura para o 2DISPP é o conceito de No-fit Polygon (NFP), que 
determina a região onde dois itens se tocam. Dado um item A fixo, para se verificar a situação 
do corte de outro item B, computa-se o NFPAB utilizando o ponto de referência em B. Se B é 
cortado de tal forma que PB está no interior de NFPAB, então há sobreposição entre os itens; se 
PB está no contorno de NFPAB, então os itens se tocam; por fim, se PB está fora de NFPAB, 
então ambos os itens não se sobrepõem ou tocam. A posição onde o item B será cortado na 
faixa retangular pode então ser escolhida como algum ponto do NFPAB (Adamowicz & Albano, 
1976). Com base no NFP, métodos exatos e heurísticos foram propostos para resolver o 
2DISPP. A Figura 5 apresenta um exemplo. 
Figura 5 - Aplicação do NFP 
 
Fonte: Amaro Junior, Pinheiro e Saraiva (2013) 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
6 
 
Métodos exatos, como modelos de Programação Linear Inteira, podem encontrar a solução 
ótima do problema, mas podem ser computacionalmente custosos para problemas grandes 
devido ao aumento da complexidade (Carravilla, Ribeiro & Oliveira, 2003; Ribeiro & 
Carravilla, 2008; Fischetti & Luzzi, 2009). Para contornar essas limitações, foram 
desenvolvidas heurísticas que não garantem a otimalidade, mas oferecem soluções aproximadas 
de forma mais eficiente (Burke et al., 2006; Egeblad, Nielsen & Odgaard, 2007; Sato, Martins 
& Tsuzuki, 2012). 
Essas abordagens heurísticas geralmente definem uma ordem de corte dos itens e uma estratégia 
de posicionamento sobre a faixa retangular, como o bottom-left (Amaro Junior, Pinheiro & 
Coelho, 
2017). 
Essas 
heurísticas 
proporcionam 
soluções 
viáveis 
em 
tempo 
computacionalmente mais eficiente do que os métodos exatos para problemas grandes de 
2DISPP. 
 
3. Metodologia 
Optou-se por um método de estudo de caso, conforme definido por Yin (2015). Esse método 
permite investigar fatos com base em experiências e observações, sem depender 
exclusivamente de teorias ou métodos científicos estabelecidos. 
Para conduzir o estudo de caso, seguiram-se três etapas principais. Primeiro, projetou-se a 
pesquisa para definir o percurso que seguiríamos, com o objetivo de reunir um conjunto inicial 
de perguntas e um conjunto final de respostas sobre essas questões. Em seguida, realizou-se a 
coleta de evidências, buscando informações em várias fontes, como documentação, registros de 
arquivo, entrevistas, observação direta, observação participante e artefatos físicos. Esta etapa 
foi essencial para garantir a credibilidade do estudo de caso. Por fim, analisou-se as evidências 
coletadas, examinando detalhadamente os registros por meio de técnicas específicas, como 
adequação ao padrão, construção de explicações, análise de séries temporais, modelos lógicos 
e síntese de casos cruzados. 
Seguindo a classificação de Gil et al. (2002), este estudo se enquadra como exploratório. Por 
meio de uma revisão bibliográfica, buscou-se coletar bases teóricas e acadêmicas para o 
desenvolvimento da pesquisa. Além disso, conduziu-se uma análise comparativa entre um 
software comercial (Audaces Encaixes) e uma aplicação de código aberto (Deepnest.IO), que 
utiliza um Algoritmo Genético (AG) para otimização do corte no setor de uma fábrica de peças 
íntimas. 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
7 
 
No caso do Deepnest.IO, cada cromossomo representante de uma solução é composto por duas 
partes: a primeira a ordem das peças a serem encaixadas; a segunda é a orientação a ser seguida. 
Um exemplo de cromossomo está presente na Figura 6, onde os quatro primeiros números 
correspondem aos identificadores das peças a serem cortadas. Neste contexto, a sequência 
estabelecida foi 2, 1, 4 e 3, representando as peças a serem cortadas. Os últimos quatro números 
determinam a orientação das peças em graus, ou seja, 90, 270, 180 e 0, indicando a direção em 
que as peças devem ser cortadas. A população do AG consiste em n cromossomos seguindo a 
descrição mencionada, onde n é um parâmetro de entrada fornecido pelo usuário. O algoritmo 
então opera de maneira evolutiva, de geração em geração, utilizando operadores de seleção, 
crossover e mutação conforme já detalhado, até que um critério de parada seja alcançado, como, 
por exemplo, o tempo de execução. O cromossomo que produz o melhor arranjo de corte 
representa a solução viável encontrada, utilizada para fins de comparação com aquela obtida 
pelo software Audaces Encaixes. 
Figura 6 - Exemplo de cromossomo no Deepnest.IO 
 
Fonte: Elaborado pelos autores (2024) 
Durante o processo evolutivo, o Deepnest.IO emprega o conceito de NFP como heurística de 
corte. Isso significa que, dado um par de peças A e B, onde a primeira já está cortada, a peça B 
será posicionada em um ponto do NFPAB de modo a satisfazer algum critério de otimização. O 
Deepnest.IO utiliza três critérios distintos: Gravity, Bounding box e Squeeze. 
A estratégia Gravity prioriza a redução do comprimento do tecido, buscando posicionar a peça 
B de forma a minimizar o desperdício de material ao longo do corte. Por sua vez, a estratégia 
Bounding box tenta cortar a peça B dentro de retângulos de tecido, com o objetivo de fornecer 
layouts mais compactos, maximizando a utilização da área disponível. 
Por fim, a estratégia Squeeze opera de forma semelhante ao modo Bounding box, porém, ela 
ignora a necessidade de retangularizar os layouts, o que pode resultar em arranjos mais 
eficientes em termos de aproveitamento de espaço. Uma ilustração do processo de encaixe das 
três estratégias para um mesmo conjunto de três peças pode ser observada na Figura 7. 
 
 
 
 
 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
8 
 
Figura 7 - Estratégias Gravity (1), Bounding box (2) e Squeeze (3) 
 
Fonte: Software Deepnest.IO (2024) 
3.1. Projeto de pesquisa 
A pesquisa foi realizada em uma fábrica de peças íntimas localizada em Fortaleza, que possui 
cerca de 30 colaboradores, mais de 30 produtos em seu catálogo e uma capacidade produtiva 
mensal de aproximadamente 30.000 peças. O setor de corte foi selecionado como foco do 
estudo devido à sua importância para o aproveitamento eficiente do tecido e, consequentemente, 
para a produção de peças. 
3.2. Coleta de dados 
Os dados foram coletados utilizando moldes em papel específico para modelagem, digitalização 
dos moldes por meio do software Audaces DigiFlash e conversão para um formato vetorial para 
uso no software Deepnest.IO. Além disso, foram utilizados relatórios gerados pelo software 
Audaces Encaixes, que fornecem informações sobre os moldes utilizados, largura do tecido, 
grade de tamanhos e gramatura do tecido. Os dados de entrada e saída do Deepnest.IO são 
diferentes dos do Audaces, o que demandou uma adaptação na coleta e análise dos dados. Estes 
dados de entrada estão contidos na Figura 8 e os dados de saída, contidos na Figura 9, para fins 
de ilustração. 
Figura 8 - Dados de entrada do Deepnest.IO 
 
Fonte: Elaborado pelos autores (2024) 
 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
9 
 
Figura 9 - Dados de saída do Deepnest.IO 
 
Fonte: Elaborado pelos autores (2024) 
 
4. Desenvolvimento 
O desenvolvimento e os resultados deste estudo têm como objetivo central investigar a eficácia 
do software gratuito Deepnest.IO em comparação com o software licenciado Audaces Encaixes 
no processo de corte de tecido, com o intuito de minimizar o desperdício de matéria-prima. Para 
isso, foram conduzidas duas instâncias de testes.  
4.1 Primeira bateria de testes 
A simulação foi realizada para um único modelo de calcinha, com 10 unidades por folha de 
tecido enfestado. Primeiramente, foi executada no Audaces Encaixes para obter o comprimento 
de tecido necessário para encaixar as 30 peças de tecido utilizadas na produção dessas 10 
unidades de calcinhas. Em seguida, a simulação foi repetida no Deepnest.IO, utilizando o 
mesmo comprimento como parâmetro de entrada. A Figura 10 revela o molde adotado. 
Figura 10 - Molde utilizado na primeira bateria. Modelo 10702. 
 
Fonte: Elaborado pelos autores (2024) 
Na primeira rodada de testes, a simulação de 1 minuto no Audaces Encaixes resultou em um 
comprimento de 55,94 cm. No entanto, o Deepnest.IO não conseguiu encaixar as mesmas 30 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
10 
 
peças para esse comprimento, obtendo no máximo 28 peças encaixadas, como apresentado na 
Tabela 1. 
Tabela 1 - Resultados do Deepnest.IO para o tempo de 1 minuto (primeira bateria) 
 
Fonte: Elaborado pelos autores (2024) 
Posteriormente, foram realizadas novas simulações com um tempo de processamento de 5 
minutos. Os resultados, conforme apresentados na Tabela 2, mostraram uma melhora sutil na 
performance do Deepnest.IO, especialmente para os modelos de encaixe Bounding box e 
Squeeze. Apesar disso, ainda não foi possível alcançar uma solução melhor do que a do Audaces 
Encaixes.  
Tabela 2 - Resultados do Deepnest.IO para o tempo de 5 minutos (primeira bateria) 
 
Fonte: Elaborado pelos autores (2024) 
Diante disso, o comprimento do risco obtido no Audaces Encaixes foi aumentado em 5%, 
totalizando 58,74 cm. Uma nova rodada de simulações foi realizada no Deepnest.IO utilizando 
esse novo comprimento. Os resultados, conforme descritos na Tabela 3, indicaram que os 
métodos de encaixe Squeeze e Bounding box foram capazes de cortar as 30 peças no 
comprimento aumentado. 
Tabela 3 - Resultados do Deepnest.IO para comprimento aumentado (primeira bateria) 
 
Fonte: Elaborado pelos autores (2024) 
4.2 Segunda bateria de testes 
Na segunda bateria de testes, foram simuladas 10 unidades de uma calcinha composta por três 
partes (Figura 11). 
 
 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
11 
 
Figura 11 - Molde utilizado na segunda bateria. Modelo 10602. 
 
Fonte: Elaborado pelos autores (2024) 
O Deepnest.IO foi executado usando o mesmo comprimento como entrada, que foi de 177,4 
cm. Os resultados obtidos com o Deepnest.IO estão nas Tabelas 4 (tempo de 1 minuto) e 5 
(tempo de 5 minutos). 
Tabela 4 - Resultados do Deepnest.IO para o tempo de 1 minuto (segunda bateria) 
  
Fonte: Elaborado pelos autores (2024) 
 
Tabela 5 - Resultados do Deepnest.IO para o tempo de 5 minutos (segunda bateria) 
 
Fonte: Elaborado pelos autores (2024) 
Como o Deepnest.IO não foi capaz de cortar as 30 peças no comprimento utilizado pelo 
Audaces Encaixes, o comprimento foi aumentado em 5% para 186,31 cm, e o Deepnest.IO foi 
executado novamente. Os resultados estão na Tabela 6. 
Tabela 6 - Resultados do Deepnest.IO para comprimento aumentado (segunda bateria) 
 
Fonte: Elaborado pelos autores (2024) 
Observa-se que tanto a estratégia Bounding box quanto a Squeeze foram capazes de encaixar as 
30 peças no Deepnest.IO com o comprimento aumentado. Embora as soluções geradas pelo 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
12 
 
Deepnest.IO sejam inferiores às do Audaces Encaixes, uma análise será realizada para 
determinar se o valor do desperdício, em termos financeiros, compensa em comparação com o 
custo da licença do Audaces Encaixes. 
4.3 Análise financeira 
Para realizar a análise financeira, consideramos os valores da mensalidade do software Audaces 
Encaixes e os custos médios do tecido no mercado de Fortaleza em maio de 2023: 
• Mensalidade do software Audaces Encaixes: R$ 1.499,00. 
• Valor médio da microfibra de poliamida: R$ 68,00. 
• Rendimento médio da microfibra de poliamida: 3,5 m/kg. 
Supondo que a empresa em questão produza cerca de 30.000 peças mensais, com uma variedade 
de mais de 40 modelos de calcinhas e sutiãs, decidimos focar em apenas dois modelos para este 
estudo. A simulação considera a produção de uma semana, com 50% de cada modelo, 
resultando em 3.750 peças de cada modelo. 
No caso da primeira bateria de testes, onde o modelo de referência é o 10702, o Audaces 
Encaixes resultou em um comprimento de risco de 55,95 cm, enquanto o Deepnest.IO alcançou 
58,74 cm. Considerando a produção de 3.750 peças em uma semana, o custo unitário do tecido 
foi de R$ 1,13 para o Audaces Encaixes e R$ 1,18 para o Deepnest.IO. 
Para o modelo de referência 10602, referente à segunda bateria de testes, o Audaces Encaixes 
apresentou um comprimento de risco de 177,44 cm, enquanto o Deepnest.IO obteve 186,31 cm. 
Com a mesma produção de 3.750 peças em uma semana, o custo unitário do tecido foi de R$ 
3,48 para o Audaces Encaixes e R$ 3,66 para o Deepnest.IO. 
Com base nesses resultados, conclui-se que, para a produção dos modelos testados, o Audaces 
Encaixes é mais vantajoso financeiramente a partir de uma produção mensal de 29.980 peças 
para o modelo 10702 e 8.328 peças para o modelo 10602. 
 
5. Conclusão 
Neste estudo comparativo entre os softwares de encaixe Audaces Encaixes e Deepnest.IO, 
foram observadas diferenças significativas em termos de recursos, desempenho e custo-
benefício, fornecendo dados importantes para empresas que lidam com o corte de peças de 
vestuário. 
O Audaces Encaixes se destacou pela amplitude de recursos oferecidos, como a possibilidade 
de definir regras de encaixe e a integração com outras ferramentas da mesma empresa. Além 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
13 
 
disso, demonstrou ser mais eficiente em projetos de maior porte e complexidade, 
proporcionando precisão e rapidez na produção. 
Por outro lado, o Deepnest.IO mostrou-se uma opção mais acessível, com um plano gratuito e 
a possibilidade de uso em nuvem, o que o torna uma alternativa econômica para empresas de 
menor porte. Apesar de apresentar resultados satisfatórios nos testes realizados, o Deepnest.IO 
mostrou-se um pouco inferior ao Audaces Encaixes em termos de qualidade de encaixe, 
exigindo um acréscimo no comprimento do tecido para conseguir encaixar a mesma quantidade 
de peças. 
Em relação ao custo-benefício, a escolha entre os dois softwares dependerá das necessidades 
específicas de cada empresa. Para projetos de grande escala e alta complexidade, o Audaces 
Encaixes é mais adequado, apesar do custo mais elevado. Já para projetos menores e com menor 
demanda, o Deepnest.IO é uma opção mais vantajosa. 
Em suma, este estudo contribuiu para responder à questão de pesquisa inicial, demonstrando 
que o Deepnest.IO é uma opção viável para o corte e encaixe de peças de vestuário, 
especialmente para empresas de menor porte. No entanto, sugere-se que futuras pesquisas 
incluam um estudo comparativo com outros softwares similares, seguido de uma análise 
financeira detalhada para determinar qual oferece a melhor relação custo-benefício para 
empresas de diferentes tamanhos. 
 
REFERÊNCIAS 
ADAMOWICZ, M.; ALBANO, A. A solution of the rectangular cutting-stock problem. IEEE Transactions on 
Systems, Man, and Cybernetics, IEEE, n. 4, p. 302–310, 1976. 
 
Amaro Junior, B.; PINHEIRO, P. R.; SARAIVA, R. D. Tackling the irregular strip packing problem by 
hybridizing genetic algorithm and bottom-left heuristic. In: IEEE. 2013 IEEE Congress on Evolutionary 
Computation. [S.l.], 2013. p. 3012–3018. 
 
ANDRADE, E. L. Introdução à pesquisa operacional. [S.l.]: Grupo Gen-LTC, 2015. 
 
BELFIORE, P.; FÁVERO, L. P. Pesquisa Operacional para cursos de Engenharia. [S.l.]: 
Elsevier Brasil, 2013. v. 1.  
 
BORTFELDT, A.; WÄSCHER, G. Constraints in container loading–a state-of-the-art review. European 
Journal of Operational Research, Elsevier, v. 229, n. 1, p. 1–20, 2013. 
 


---

 
    XLIV ENCONTRO NACIONAL DE ENGENHARIA DE PRODUÇÃO 
 "Reindustrialização no Brasil" 
Porto Alegre, Rio Grande do Sul, Brasil, 22 a 25 de outubro de 2024. 
 
              
14 
 
BURKE, E.; HELLIER, R.; KENDALL, G.; WHITWELL, G. A new bottom-left-fill heuristic algorithm for 
the two-dimensional irregular packing problem. Operations Research, INFORMS, v. 54, n. 3, p. 587–601, 
2006. 
 
CARRAVILLA, M. A.; RIBEIRO, C.; OLIVEIRA, J. F. Solving nesting problems with nonconvex polygons 
by constraint logic programming. International Transactions in Operational Research, Wiley Online Library, v. 
10, n. 6, p. 651–663, 2003. 
 
EGEBLAD, J.; NIELSEN, B. K.; ODGAARD, A. Fast neighborhood search for two-and threedimensional 
nesting problems. European Journal of Operational Research, Elsevier, v. 183, n. 3, p. 1249–1266, 2007. 
 
FISCHETTI, M.; LUZZI, I. Mixed-integer programming models for nesting problems. Journal of Heuristics, 
Springer, v. 15, p. 201–226, 2009.  
 
GIL, A. C. et al. Como elaborar projetos de pesquisa. [S.l.]: Atlas São Paulo, 2002. v. 4. 
 
GOLDBARG, E.; GOLDBARG, M.; LUNA, H. Otimização combinatória e metaheurísticas: 
algoritmos e apliacações. [S.l.]: Elsevier Brasil, 2017. 
 
GOMES, A. M.; OLIVEIRA, J. F. Solving irregular strip packing problems by hybridising simulated 
annealing and linear programming. European Journal of Operational Research, Elsevier, v. 171, n. 3, p. 811–
829, 2006. 
 
HILLIER, F. S.; LIEBERMAN, G. J. Introdução à pesquisa operacional. [S.l.]: McGraw Hill Brasil, 2013. 
 
IORI, M.; LIMA, V. L. D.; MARTELLO, S.; MIYAZAWA, F. K.; MONACI, M. Exact solution techniques for 
two-dimensional cutting and packing. European Journal of Operational Research, Elsevier, v. 289, n. 2, p. 399–
415, 2021. 
 
LINDEN, R. Algoritmos genéticos (2a ediçao). [S.l.]: Brasport, 2008. 
 
SATO, A. K.; MARTINS, T. C.; TSUZUKI, M. S. G. An algorithm for the strip packing problem using 
collision free region and exact fitting placement. Computer-Aided Design, Elsevier, v. 44, n. 8, p. 766–777, 
2012. 
 
WÄSCHER, G.; HAUSSNER, H.; SCHUMANN, H. An improved typology of cutting and packing problems. 
European journal of operational research, Elsevier, v. 183, n. 3, p. 1109–1130, 2007. 
 
YIN, R. K. Estudo de Caso-: Planejamento e métodos. [S.l.]: Bookman editora, 2015. 
