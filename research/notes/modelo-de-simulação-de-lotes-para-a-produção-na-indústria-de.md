---
title: Modelo de Simulação de Lotes para a Produção na Indústria de
id: modelo-de-simulação-de-lotes-para-a-produção-na-indústria-de
tags:
- modelista-producao-moda-dores-0698af
- modelagem
- processo-produtivo
- desenvolvimento-de-produto
created: '2026-11-27T02:48:44.210139Z'
source: http://www.aedb.br/seget/arquivos/artigos07/1183_Modelo%20de%20Simulacao%20de%20Lotes%20para%20a%20Producao%20na%20Industria%20de%20Confeccao.pdf
source_domain: www.aedb.br
fetched_at: '2026-11-27T02:47:03.668941Z'
fetch_provider: crawl4ai
status: draft
type: note
deprecated: false
summary: Modelo de Simulação de Lotes para a Produção na Indústria de
---

1 
Modelo de Simulação de Lotes para a Produção na Indústria de 
Confecção 
 
Reynaldo Pinto Henriques 
Antonio Augusto Gonçalves 
Harvey Cosenza 
Universidade Estácio de Sá - UNESA 
 
RESUMO 
Este artigo apresenta um modelo de simulação de lotes para produção na indústria de confecção. O 
modelo é uma solução para a decisão sobre a programação da produção de curto prazo, tendo como 
referencial teórico a Teoria das Restrições e conceitos e ferramentas de modelagem e simulação de 
processos, com recursos de computação visual e interativa. O modelo foi aplicado, através de um 
projeto experimental, numa confecção no Rio de Janeiro, produzindo resultados relevantes e 
consistentes com a sua proposta original. 
Palavras-chave: Simulação, Confecção, Teoria das Restrições (TOC), Apoio à Decisão. 
1. INTRODUÇÃO 
A indústria de confecção constitui um setor relevante da indústria têxtil e se encontra 
disseminada em praticamente todas as economias do mundo, o que a torna extremamente 
competitiva. 
A produção de indústrias de confecção em geral é feita por lotes, e o controle dos 
tempos de produção dos lotes é de fundamental importância para as entregas de pedidos de 
clientes. 
Atrasos nas entregas podem ocorrer pela combinação de dois fatores. O primeiro é a 
forte dependência de mão-de-obra, uma característica desta manufatura. O segundo é a 
diversidade de modelos das roupas, uma exigência do negócio. 
A dependência de mão-de-obra está associada ao fato de que a atividade mais crítica e 
menos automatizada do processo de produção de uma confecção é a costura. Esta tarefa é 
realizada em máquinas que ainda são operadas de maneira semelhantes às primeiras, 
construídas no século dezenove, requerendo a presença constante de operadoras. O trabalho 
de costura depende da habilidade das costureiras, o que o aproxima do artesanal, dificultando 
as estimativas de prazos de execução e o seu controle. 
A diversidade de modelos determina diferenciação para a competitividade. Se por um 
lado a maior variedade de modelos tende a alavancar as vendas, por outro lado o fechamento 
de pedidos torna-se mais crítico. Se faltarem peças de roupas de diferentes modelos, mesmo 
que poucas, um pedido não será fechado e despachado para o seu comprador na data 
aprazada. 
A exclusividade das roupas de uma confecção pode ser obtida com a aplicação de 
acabamentos complementares. Estes acabamentos ressaltam a criatividade dos estilistas de 


---

 
 
2 
moda, mas contribuem ainda mais para o comprometimento dos prazos de entrega, devido à 
disparidade que causam nos tempos de execução de diferentes modelos de uma mesma 
coleção. 
Pelas razões acima relacionadas, o controle sobre os lotes em produção é fator crítico 
de sucesso na indústria de confecção, e motiva o presente trabalho.  
O objetivo principal do presente trabalho é desenvolver uma solução para o controle 
da produção no curto prazo na indústria de confecção de roupas. Este problema é influenciado 
pela dinâmica da entrada de pedidos na fábrica e por decisões sobre precedências entre 
pedidos. 
Para tratar o controle da produção é preciso conhecer antecipadamente os prazos 
consumidos para produzir lotes de peças de roupas. Um modelo capaz de simular as 
condições reais de produção pode prover o conhecimento dos tempos do processo produtivo, 
notadamente no processo de costura, o mais crítico na indústria de confecção. Conhecidos os 
tempos, podem ser tomadas decisões tempestivas, definindo o que será produzido a cada dia. 
A figura 1 mostra os processos da indústria de confecção, indicando o destaque sobre a 
costura, que é o foco do presente trabalho. 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Figura 1 - Processos da Indústria de Confecção (Extraída de Henriques, 2006) 
No âmbito da costura são requeridas decisões sobre as políticas operacionais, 
referentes a instalações e equipamentos, horas extras de trabalho, roteiros de produção 
alternativos e utilização de fabricação terceirizada. 
2. METODOLOGIA 
O método de pesquisa utilizado foi o estudo de caso. Este método apresenta como 
vantagens a manutenção das características principais de eventos da vida real e a garantia de 
preservação de uma visão holística do problema estudado (YIN, 2003 p. 20). De acordo com 
esta referência, três condições devem ser atendidas para a escolha do estudo de caso como 
método de pesquisa: 
− A pesquisa define “como” definir lotes de produção adequados aos prazos de entregas, 
com base num modelo de simulação da produção que determina os tempos consumidos na 
produção das peças de vestuário. 
Processos da Indústria de Confecção
Criação da coleção 
e vendas; 
recebimento de 
pedidos.
Planejamento e 
programação da 
produção.
Compras, 
recebimento e corte 
dos tecidos.
Montagem de kits - 
tecidos cortado, 
aviamentos e 
acessórios.
Montagem (costura)
Fechamento de 
pedidos e 
expedição.
Modelo de 
Simulação 


---

 
 
3 
− A análise dos resultados do modelo de simulação, que reproduz o processo de produção da 
etapa de costura, explica “porque” a produção de um lote de roupas consome um 
determinado tempo de produção. 
− O pesquisador não exerceu qualquer interferência no processo e nas decisões de produção. 
O trabalho de pesquisa foi desenvolvido numa confecção do Rio de Janeiro, que se 
encontra em operação regular, caracterizando um fenômeno contemporâneo e da vida real. 
No processo de produção de uma confecção importa identificar as restrições que o 
sistema produtivo e as instalações da fábrica lhe impõem. Particularmente no caso do modelo 
de simulação desenvolvido, é preciso identificar os gargalos no processo de costura, que 
poderão comprometer seus tempos de execução. 
A Teoria das Restrições (TOC - Theory of Constraints), desenvolvida pelo físico 
israelense Eliyahu Goldratt oferece instrumental para a compreensão e identificação do 
gargalo, e sugere um processo de melhoria contínua dos processos de produção para a redução 
das restrições. 
Segundo Goldratt (2003), restrições são os obstáculos que limitam o melhor 
desempenho do sistema com relação à meta. Todo sistema possui pelo menos uma, e não mais 
que poucas restrições ou fatores limitantes. A identificação das restrições é a oportunidade 
para a melhoria contínua, pois permite que se enfoque o fator limitante, e que esforços sejam 
empreendidos no sentido de explorá-lo. 
A aplicação da TOC ocorre através de um processo com cinco passos, (BURTON-
HOULE, 2001). 
– 
1. Identificar a restrição (gargalo). 
– 
2. Decidir sobre como explorar a restrição. 
– 
3. Subordinar e sincronizar todos os outros elementos do processo à restrição. 
– 
4. Elevar o desempenho do recurso que representa a restrição. 
– 
5. Se a restrição mudar para outro ponto do processo, retornar ao passo um. 
Não deixar a inércia se transformar na próxima restrição. 
Vários autores abordam os temas simulação e modelagem. Banks e Carson (1984) 
definem técnica de simulação como a imitação de um processo ou sistema do mundo real 
através do tempo, podendo ser realizada manualmente ou utilizando computadores. 
Para Shannon (1975), a simulação é um processo para projetar o sistema real e 
conduzir experimentos, com o propósito de entender o comportamento do sistema e avaliar as 
várias estratégias para sua operação. 
Projetos e experimentos de simulação requerem modelos. Pidd (2001, p. 25) define 
modelo como “uma representação externa e explícita de parte da realidade vista pela pessoa 
que deseja usar aquele modelo para entender, mudar, gerenciar e controlar parte daquela 
realidade”. 
Segundo Pidd (2001), na Modelagem Visual Interativa (VIM - Visual Interactive 
Modeling) o computador é usado como um dispositivo para construir um modelo. O analista 
desenvolve um modelo simples, com representações na tela do computador. O modelo é então 
executado no computador, gerando resultados, que num processo de aproximações sucessivas, 
levam ao aperfeiçoamento do modelo, até ser considerado válido para o objetivo proposto. 
Bell e O’Keef (1987) definem a Simulação Visual Interativa (VIS - Visual Interactive 
Simulation) com a integração de visualização de dados e da pilotagem do experimento de 


---

 
 
4 
simulação. Num ambiente VIS os parâmetros e variáveis de um modelo, assim como os 
recursos de apresentação visual podem ser modificados durante a experiência, com impacto 
imediato no processo de simulação. 
Devido ao aumento do interesse na simulação computacional, têm sido desenvolvidos 
softwares amigáveis de simulação por eventos discretos, que permitem que o analista se 
concentre no modelo, tendo já disponível através desses softwares a programação de 
computação. 
A modelagem computacional utiliza no desenvolvimento e simulação de um modelo, 
os componentes, interagindo como indicado na figura 2. 
Figura 2 - Componentes de um Modelo (adaptado de Shannon,1975) 
Elder (1992) define que “rodar uma simulação” significa executar o programa de 
computador de forma a se ter as facilidades visuais e interativas ao vivo, permitindo a 
interface entre o modelo matemático básico, inserido em programas de computador, e o 
usuário da simulação. 
3. RESULTADOS 
O processo de costura da indústria de confecção se inicia quando são formados lotes 
para costura, compostos de kits contendo as matérias primas necessárias à confecção das 
roupas nas quantidades definidas nos pedidos. 
Os kits são processados em células onde é executada a costura das roupas. As roupas 
que não requerem acabamento complementar saem das células diretamente para a área de 
fechamento dos pedidos e expedição. As roupas que terão processamento adicional são 
encaminhadas para unidades de acabamento complementar, específicas para este fim. O 
fechamento dos pedidos somente ocorre quando as roupas prontas são entregues à área de 
expedição pelas células e unidades de acabamentos. 
As restrições na produção se caracterizam quando a capacidade de produção da fábrica 
é excedida, função dos prazos de pedidos concorrentes. Agrava-se a pressão sobre prazos 
quando há uma quantidade substancial de peças de roupas que requerem processamento 
complementar, porque aí há fortes indícios de ocorrência de um gargalo na produção. 
Conhecidas as quantidades de peças de cada pedido a ser produzido, os prazos de 
entrega, e a capacidade de produção da fábrica, é possível, com base num modelo 
computacional, simular variações nos recursos de produção e nos turnos de trabalho, 
identificando os estouros e as antecipações de prazos. 
Deve-se buscar o melhor aproveitamento da mão-de-obra disponível, procurando 
reduzir as horas extraordinárias, por um lado, e a ociosidade por outro lado. A pontualidade 
ENTIDADES
ATRIBUTOS
ATIVIDADES
EVENTOS
ESTADO DO 
SISTEMA
Possuem
interagem
gerando
que modificam


---

 
 
5 
requer então decisões no âmbito das políticas operacionais, referentes à jornadas de trabalho, 
roteiros de produção alternativos e utilização de terceirização. 
Estas condições determinaram a pergunta crucial a ser respondida pelo modelo de 
simulação: quais os tempos consumidos na etapa de costura e de acabamentos 
complementares no processo de produção das roupas? 
Esta situação problemática confirma o objetivo do modelo, expresso na introdução 
deste estudo, qual seja: desenvolver uma solução para a melhoria do controle da produção no 
curto prazo para a indústria de confecção de roupas. 
A solução será um modelo de simulação baseado em recursos de computação, gráficos 
e interativos, caracterizando-se como um Sistema de Apoio à Decisão (SAD). A figura 3 
ilustra o modelo conceitual da produção de uma confecção. 
Figura 3 – Modelagem do processo de produção (extraída de Henriques, 2006) 
Os elementos utilizados no modelo conceitual são entidades e instalações. A figura 3 
mostra a entidade de entrada do processo de transformação, representada pelo lote de kits de 
tecido, aviamentos e acessórios para costura, e as instalações fila, célula de montagem e 
montagem complementar. As entidades que representam o resultado final do processo são 
roupa e roupa com acabamento complementar. 
A coleta de dados foi realizada com base na experiência dos especialistas em produção 
da fábrica. 
Um ponto chave no processo de simulação corresponde à determinação das funções 
densidade de probabilidade para as variáveis a serem simuladas. Existem muitas funções que 
podem ser utilizadas. De acordo com Kelliher e Mahoney (apud PAIXÃO et al, 2005) há 
alguns passos para se determinar qual a distribuição se enquadra mais perfeitamente a cada 
variável. No caso de existirem dados históricos válidos, existe a possibilidade de que seja 
encontrada a distribuição que mais se adequa àquela variável utilizando softwares específicos 
de simulação. Contudo, mesmo com dados históricos à disposição, grande parte da seleção de 
distribuições de freqüências é dirigida pela subjetividade e experiência do analista. 
Bressan (apud ASSIS et al) afirma que a distribuição triangular é usada, mais 
comumente, quando o objetivo é obter uma aproximação na ausência de dados, a qual permite 
ajustar uma distribuição mais adequada, ou quando se conhece apenas os valores mais 
prováveis, mínimo e máximo da variável, mas não se conhece muito sobre a distribuição 
L OT E S de kits - 
tecidos, aviamentos 
e acessórios
Processo de Montagem
EXIT
Fechamento
de Pedidos
Fila celulas
de produção 
Acabamentos e acessórios
Montagem 
Complementar
Fila Mont. Compl. 
Costura
Célula de 
montagem 
Célula de 
montagem 
Célula de 
montagem 
Célula de 
montagem 
ENTRADA
X% roupa c/ acab. complem.
Y% roupa
X%


---

 
 
6 
empírica dos dados. Este é o caso do presente estudo, no qual há grande diversidade de 
modelos de roupas num lote de produção, o que torna impossível medir individualmente os 
tempos de produção. 
Um modelo uma vez concebido e desenvolvido será codificado através de linguagens 
de programação de computadores. No presente estudo optou-se por utilizar um software em 
lugar de desenvolver programas de computador para realizar a simulação do modelo. Foi 
selecionado o Promodel, por sua facilidade de uso, versatilidade e oferta de recursos para 
modelagem e simulação. 
O Promodel trabalha com entidades permanentes (que se convencionou chamar 
instalações) - e com entidades temporárias (chamadas entidades). As primeiras são as 
instalações físicas e equipamentos utilizados no processo de costura; e as entidades são 
objetos do processo de transformação industrial, desde as matérias primas (kits). 
Todas as condições definidas no modelo conceitual puderam ser informadas no 
Promodel, cujas funcionalidades gráficas facilitam a visualização e a construção do modelo.  
O modelo computacional foi validado e verificado. 
A verificação serve para confirmar a adequação do software selecionado para o 
modelo, testando se o modelo computacional executa a simulação e produz resultados 
coerentes. 
Da Silva (2005) recomenda alguns procedimentos na verificação de um modelo: (a) 
usar duas ou mais pessoas, (b) rodar o programa para um conjunto variado de situações 
procedendo a análises dos dados de saída, (c) rastrear o programa verificando a execução dos 
procedimentos, (d) observar a animação, e (e) comparar os valores gerados pelo uso de 
distribuições aos observados em sistemas reais. 
A validação vai além da homologação, porque não apenas verifica se o modelo 
funciona e produz resultados, mas procura confirmar se o modelo de fato representa a situação 
real que se procurou simular. Um dos ferramentais mais poderosos para a validação de um 
modelo é a realização de análises de sensibilidade. Deste modo, verificam-se como os 
resultados da simulação se modificam mediante alterações dos valores das variáveis de 
entrada e parâmetros do sistema. 
A aplicação do modelo foi realizada através de um Projeto Experimental, 
desenvolvido para a indústria na qual se desenvolveu o presente estudo de caso. O modelo 
computacional do projeto experimental é mostrado na figura 4 a seguir. 


---

 
 
7 
Figura 4 – Modelo computacional para simulação (extraído de Henriques, 2006). 
Para cada cenário a ser simulado se deseja medir os tempos de produção e taxas de 
utilização das entidades permanentes. As simulações neste projeto experimental devem 
responder a seguinte pergunta: qual o prazo para produzir um lote de 3200 peças de vestuário, 
sendo que 20% das roupas produzidas requerem acabamento complementar?  
Esta pergunta será respondida através do modelo de simulação, em quatro cenários: no 
cenário 1 se considera a capacidade instalada existente (quatro células de costura e uma 
unidade de acabamento); no cenário 2 é adicionada mais uma unidade de célula de costura; no 
terceiro cenário é adicionada mais uma unidade de acabamento complementar; e no cenário 4 
simula-se o aumento de capacidade simultâneo, nas células de costura e no acabamento 
complementar. 
Os resultados do modelo de simulação, obtidos após a realização dos experimentos, 
são apresentados. Inicialmente são mostrados os tempos de produção indicados pelo modelo, 
para cada cenário formulado (quadro 1). Em seguida são apresentados no quadro 2 os 
percentuais de utilização das instalações – células de costura e unidades de acabamento 
complementar. 
 
 
 
 
 
 
 
 
 
 
 
Horas:minutos
Minutos
Roupa pronta = 80% 
do lote              
(minutos)
Roupa c/ acabamento 
complementar = 20% 
do lote
CENÁRIO 1 -  4 células produção, 1 
unid. acabamento complementar
 170hs 39min
10.239
CENÁRIO 2
5 él l
d
ã
1
id
Cenário
Tempo informado pelo PROMODEL 
(minutos)
Tempo de execução informado no modelo 
(minutos)


---

 
 
8 
 
 
 
 
 
 
 
 
 
 
 
Quadro 1 - Resumo dos tempos de processamento (extraído de Henriques, 2006) 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Quadro 2 - Taxas de Utilização das Instalações (extraído de Henriques, 2006) 
4. CONCLUSÕES 
A primeira conclusão obtida com o projeto experimental é que o recurso crítico do 
processo de costura é a unidade de acabamento complementar – que opera com uma taxa de 
utilização sempre próxima de 100% - e que se obtêm ganhos substancias nos prazos de 
produção quando este recurso é aumentado. Conclui-se também que o aumento de capacidade 
nas células de costura, que não são o recurso crítico do processo, não leva à superação da 
restrição. 
Conhecidos os resultados do modelo nos quatro cenários formulados no Projeto 
Experimental, são examinados seus efeitos em três alternativas de utilização da mão-de-obra: 
alternativa I na qual a produção ocorre na jornada de trabalho padrão (8,8 hs/dia útil); 
alternativa II com a adição de mais 4 horas por dia útil de trabalho; e a alternativa III, em 
horário padrão, mas direcionadas para terceiros 30% das peças que não requerem acabamento 
complementar. 
O cruzamento das alternativas de utilização da mão-de-obra e dos cenários simulados 
enseja análises sob dois enfoques: o da eficácia e o da eficiência, como se verá adiante. 
Do ponto de vista da eficácia, o quadro 3 mostra os tempos consumidos na produção 
do lote, no qual se verifica que a combinação de alternativas e cenários que produz os 
menores prazos, é a que aumenta as jornadas de trabalho e acrescenta mais uma unidade de 
acabamento complementar, respectivamente (alternativa II com os cenários 3 e 4). Também 
Células de costura
Unidades de 
acabamento 
complementar
C 1 - Capacidade atual
86,51
99,94
C 2 - Aumento de capacidade nas 
células de costura
86,43
99,97
C 3 - aumento de capacidade no 
acabamento complementar
86,17
99,67
C 4 - aumento de capacidade nas 
células e no acabamento 
complementar
85,78
99,81
Cenário
Utilização das Instalações (%)


---

 
 
9 
se constata que a terceirização parcial não contribui para reduzir a restrição identificada na 
unidade de acabamento complementar. 
 
Quadro 3: Tempos de Produção do Lote por Cenário e Alternativa (extraído de Henriques, 2006) 
Sendo medida de eficácia a pontualidade nas entregas, ressalva-se que ela não está 
necessariamente associada ao menor prazo de produção, mas ao prazo suficiente para realizar 
as entregas sem atraso. Por esta razão nem sempre a alternativa a ser escolhida é a que 
apresentar o menor tempo de execução. Esta perspectiva traz a conveniência de adotar um 
outro elemento de análise: a verificação da eficiência de cada alternativa estudada, o que se 
mede pelo seu custo.  
Para avaliar as alternativas sob o enfoque da eficiência, serão calculados os custos da 
mão-de-obra utilizada, nos mesmos cenários e alternativas em estudo. Foram considerados os 
seguintes parâmetros: cada célula de costura e unidade de acabamento opera com oito 
costureiras; a hora-padrão de costureira vale R$ 3,60 e a hora-extra R$ 5,40 (cinco reais e 
quarenta centavos). 
O quadro 4 resume os custos da mão-de-obra para execução do lote definido no 
projeto experimental. Neste quadro se evidencia que os menores custos de cada alternativa 
estão no cenário 3. 
 
Alternativa I - Horário Padrão        
(8,8 hs/dia)
Alternativa II - Horário Estendido 
(12,8hs/dia)
Alternativa III - Horario Normal 
(8,8hs/dia) + Terceirização
Lote produzido na fábrica =  3.200 
unid., acabam. Complem. 640 peças
Lote produzido na fábrica =  3.200 
unid., acabam. Complem. 640 peças
Lote produzido na fábrica           
= 2.432 unid.; produção terceirizada  
= 768 unid.
Tempo de produção (dias úteis)
Tempo de produção (dias úteis)
Tempo de produção (dias úteis)
C 1 - Capacidade atual
19,4
13,3
19,4
C 2 - Aumento de 
capacidade nas células 
de costura
19,4
13,3
19,4
C 3 - aumento de 
capacidade no 
acabamento 
complementar
9,6
6,6
9,3
C 4 - aumento de 
capacidade nas células e 
no acabamento 
complementar
9,4
6,5
9,8
Cenário


---

 
 
10 
Quadro 4 - Comparação dos custos de produção (extraído de Henriques, 2006) 
A análise conjunta dos resultados indica que as melhores combinações de prazo 
(eficácia) e custo (eficiência) estão no cenário 3, como se vê no quadro 5 abaixo. A escolha da 
melhor alternativa depende da decisão sobre os investimentos necessários à instalação de mais 
uma unidade de acabamento complementar. Não havendo investimentos, o cenário 1 é o único 
possível. 
Quadro 5 – Prazos e custos de produção do lote do projeto experimental (extraído de Henriques (2006) 
5. RECOMENDAÇÕES 
O presente trabalho foi realizado com o propósito de prover uma solução para o 
controle e decisão sobre a fabricação de lotes de roupas  numa confecção. A abordagem 
utilizada considerou dois elementos principais: a possibilidade de antecipação do 
conhecimento dos prazos para produção e a necessidade de identificação dos gargalos de 
Padrão (8,8 hs/dia)
Estendido (12,8 hs/dia)
Padrão (8,8 hs/dia)
253,44
426,24
253,44
Células 
costura 
(unid)
Acabam. 
complem. 
(unid)
CENÁRIO 1 
4
1
24.573,60
28.413,23
24.597,60
CENÁRIO 2 
5
1
29.517,12
34.129,17
29.522,88
CENÁRIO 3 
4
2
14.558,40
16.833,15
14.204,16
CENÁRIO 4 
5
2
16.675,68
19.281,26
17.330,88
Legenda
Alternativas  e cenários que requerem investimenmtos nas unidades de produção
Alternativa I - lote 3200 
pçs. (640 acabam. 
complem.)
Alternativa II - lote 3200 
pçs.  (640 acabam. 
complem.)
Alternativa III - lote 2432 
pçs. (640 acabam. 
complem.) + 768 terceiros 
Custo de Produção do Lote (mão-de-obra)
Instalações
Horário mão-de-obra própria
Custo/célula/dia (R$)
Alternativas (quant. peças produzidas)
Cenário
Células 
costura
Unid. 
acabam. 
complem.
Dias
R$
Dias
R$
Dias
R$
CENÁRIO 1 
4
1
19,4
24.573,60
13,3
28.413,23
19,4
24.597,60
CENÁRIO 2 
5
1
19,4
29.517,12
13,3
34.129,17
19,4
29.522,88
CENÁRIO 3 
4
2
9,6
14.558,40
6,6
16.833,15
9,3
14.204,16
CENÁRIO 4 
5
2
9,4
16.675,68
6,5
19.281,26
9,8
17.330,88
Cenário
Altern. I - lote        
3200 pçs.
Instalações
Horário
Custo/célula/dia
Padrão (8,8 h/dia)
253,44
Altern.II - lote          
3200 pçs.
Altern. III - lote       
2432 pçs.
Estendido (12,8 h/dia)
Padrão (8,8 h/dia)
426,24
253,44


---

 
 
11 
produção. Nesta abordagem trabalhou-se com conceitos de simulação computadorizada, e 
utilizou-se a Teoria das Restrições (TOC), respectivamente. 
A solução desenvolvida consubstanciou-se em um modelo de simulação do processo 
produtivo de uma confecção, que permite identificar o gargalo no processo e em conseqüência 
decidir sobre como explorar esta restrição, influenciando diretamente na programação da 
produção. Como visto no referencial teórico, com respeito à TOC, se entendermos que a 
pontualidade é uma das metas da empresa, a identificação do gargalo na produção e sua 
redução ou eliminação nos irá aproximar do atingimento desta meta. Reconhecida a restrição, 
é preciso decidir como explorá-la e subordinar a ela os demais recursos do sistema. 
O modelo de simulação desenvolvido é uma ferramenta de suporte à decisão (SAD – 
Sistema de Suporte à Decisão), no qual podem ser analisados cenários, obtendo-se de forma 
rápida respostas antecipadas sobre “o que aconteceria se....”. As respostas providas pelo 
modelo geram possibilidades de solução para o problema de controle dos lotes. 
Do ponto de vista de sua operação, o modelo de simulação tem duas propriedades 
relevantes: utiliza recursos gráficos e de animação, através dos quais o usuário do modelo 
“vê” o processo na tela do computador, dinamicamente; interage com o usuário, que informa 
parâmetros, “roda” simulações e obtém respostas do modelo. 
O trabalho poderá ter desdobramentos. Pode-se recomendar a aplicação do modelo de 
simulação em outros processos da confecção, por exemplo, ao processo de vendas, para 
apoiar as negociações dos prazos de entrega. A utilização em outras confecções também é 
recomendável porque, sendo o modelo parametrizado, é fácil a sua adequação à 
particularidades de diferentes processos produtivos. 
As recomendações finais são para que o modelo evolua para se tornar um sistema de 
gestão da produção em confecções; e para que ele seja adaptado para aplicação em outras 
indústrias, que guardem características semelhantes às de confecções, nas quais a produção é 
associada à pedidos de clientes (make-to-order); e onde a pontualidade é decisiva para a 
competitividade. 
 
6. REFERÊNCIAS BIBLIOGRÁFICAS 
 
ASSIS, J.P, NETO, D.D, NASS, L.L, MANFRON, P.A, BONNECARRÈRE, R.A.G.e 
MARTIN, T.N. Simulação estocástica de atributos do clima e da produtividade potencial de 
milho utilizando-se distribuição triangular. Pesquisa Agropecuária Brasileira, v. 41, n. 3, 
mar. 2006. 
 
BANKS, J.; CARSON, J. S. Discrete-event System Simulation. Prentice-Hall: Englewood 
Cliffs, N.J, 1984. 
 
BELL, P.C.; O’KEEF, R. M. Visual interactive simulation: history, recent developments and 
major issues. Simulation, 49, n. 3, p. 109-116, Sept. 1987. 
 
BOURTON-HOULE, T. The Theory of Constraints and its Thinking Processes: a brief 
introduction to TOC. New Haven: The Goldratt Institute, 2001. 
 
COSTA, R. S. Pontualidade total na produção sob encomenda: conceito, tecnologia e uso 
da simulação computacional na gestão do chão-de-fábrica. Tese (Doutorado em Ciências) – 
Coordenação dos Programas de Pós-graduação de Engenharia, Rio de Janeiro, mar. 1996. 


---

 
 
12 
 
ELDER, M. D. Visual interactive modelling: some guidelines for its implementation and 
some aspects of its potential impact on operational research. Tese (PhD Management Science) 
- University of Strathclyde, Glasgow, Scotland, 1992. 
 
GOLDRATT, E. M.e COX, J. A meta: um processo de melhoria contínua. São Paulo: Nobel, 
2003. 
 
HENRIQUES, R.P. Modelo de apoio à decisão para a pontualidade na indústria de 
confecção. Dissertação (Mestrado em Ciências) – Mestrado em Administração e 
Desenvolvimento Empresarial da Universidade Estácio de Sá, Rio de janeiro, nov. 2006. 
 
PAIXÃO, R.B, BRUNI, A.L., WOUTERS, S.J. Aperfeiçoando decisões de investimento em 
condições risco. Monte Carlo: um estudo no setor petroquímico. In: SEMINÁRIOS EM 
ADMINISTRAÇÃO FEA, 8., São Paulo. Anais... São Paulo: USP, 2005. 
 
PIDD, M. Modelagem empresarial: ferramentas para tomada de decisão. Porto Alegre: 
Artmed, 2001. 
 
SHANNON, R.E. System simulation: the art and science. Englewood Cliffs, N.J: Prentice 
Hall, 1975. 
 
DA SILVA, L.C. Verificação, validação e experimentação com modelos de simulação. 
Departamento de Engenharia Rural da Universidade Federal do Espírito Santo. Boletim 
Técnico MS 03/06, jun. 2006. 
 
YIN, R.K. Estudo de caso: planejamento e métodos. Porto Alegre: Artmed, 2005. 
