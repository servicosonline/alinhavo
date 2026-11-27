# Orchestrator Notes — estilista-producao-moda-8b096b

## Hipóteses Iniciais e Estrutura de Análise

1. **Polivalência vs. Especialização da Estilista (Sub-Q1)**:
   - Na literatura acadêmica e em grandes marcas/varejistas, o papel da estilista é frequentemente descrito como focado em pesquisa estética, criação de conceito e desenho.
   - Na realidade das micro, pequenas e médias confecções brasileiras (que representam mais de 80% do setor segundo dados da ABIT/SEBRAE), a estilista acumula funções de analista de produto, compradora de matéria-prima, redatora de ficha técnica, coordenadora de pilotagem, acompanhante de facção e até produtora de catálogo.

2. **Tarefas por Etapa do Processo de Desenvolvimento de Produto - PDP (Sub-Q2)**:
   - Pré-desenvolvimento / Planejamento: análise de histórico de vendas com comercial, definição de mix (básicos, fashion, imagem), cronograma de coleção e parâmetros de custo.
   - Pesquisa e Conceituação: pesquisa de tendências (comportamento, cartela de cores, tecidos, aviamentos), moodboard, definição de tema.
   - Geração de Alternativas e Desenho: croquis criativos, seleção de matérias-primas e testes de toque/caimento, tradução em **desenho técnico plano** (frente, costas, detalhes construtivos).
   - Especificação / Ficha Técnica: preenchimento de aviamentos, códigos de tecido, sequência operacional preliminar, medidas referenciais e orientações de acabamento para a modelagem.
   - Modelagem e Prototipagem (Pilotagem): passagem do desenho para a modelista, interpretação do molde, corte da peça piloto e costura pela piloteira.
   - Prova de Caimento (Fitting) e Aprovação: vestibilidade no manequim ou modelo de prova, identificação de defeitos de caimento/proporção, ajustes de molde, cálculo de consumo/custo na ficha técnica definitiva e reunião de aprovação comercial (lacre da peça piloto).
   - Produção e Pós-desenvolvimento: liberação de ficha técnica final para encaixe/corte/facção, controle de qualidade da cabeça de série, suporte a dúvidas de facção.

3. **Interfaces Críticas e Tensões (Sub-Q3 & Sub-Q4)**:
   - **Estilista ↔ Modelista**: principal ponto de ruído técnico. O desenho técnico bidimensional muitas vezes ignora limites físicos do tecido (elasticidade, gramatura, caimento) ou omite acabamentos internos, gerando múltiplas idas e vindas na pilotagem.
   - **Estilista ↔ Comercial/Custos**: tensão entre ousadia autoral/criativa e viabilidade comercial/meta de margem.
   - **Estilista ↔ Pilotagem/Facção**: fichas técnicas em planilhas ou PDFs desatualizados que não acompanham as alterações feitas durante a prova da peça piloto.

## Lote 5 (Recuperação de Rate Limit) e Fontes Setoriais

Enquanto os 9 subagentes da Wave 1 estão em execução em background, vou processar diretamente o Lote 5 (que sofreu rate limit 429 no início) e buscar fontes institucionais brasileiras complementares (SEBRAE, SENAI CETIQT, ABIT, CBO) para garantir que nenhum lote fique para trás.

## Síntese Preliminar das Primeiras Fontes Coletadas (Lote 6/7 e Lote 1-35)

- **Campos (2021, 2025, DAPesquisa/UDESC)**: Documenta a transição histórica da figura do estilista/criador para o designer subordinado às restrições industriais e comerciais, cunhando o conceito de **"insustentabilidade criativa"** no fast fashion (compressão de prazos, padronização e esgotamento criativo), bem como ferramentas projetuais como a Matriz de Aderência Conceitual (MAC).
- **Yang & Baytar (2024, Cornell / Fashion and Textiles)**: Estudo empírico em sessões reais de prova de caimento (*fitting sessions*) mostrando que >90% das peças exigem 2 a 3 rodadas de prova física (8 a 20 peças por sessão). Revela atritos diretos entre estilistas, designers técnicos/modelistas e modelos de prova: (1) troca de tecido em modelagem campeã altera completamente o caimento; (2) falhas de vestibilidade prática só aparecem no corpo real; (3) limitações severas do CAD 3D (CLO3D, Browzwear, Optitex) na simulação de compressibilidade e tradução de mapas de tensão em medidas exatas de folga (*ease*) no molde.
- **Choi (2022, Fashion and Textiles)**: Mostra um contraponto crucial sobre tecnologia 3D nas confecções: embora o CLO3D reduza amostras físicas ao substituir desenhos técnicos 2D nas fichas técnicas (*tech packs*), em **pequenas e médias empresas a economia de protótipos é anulada pelo aumento de tempo de operação e custo de mão de obra**, exigindo que a estilista acumule profundo domínio de modelagem (*pattern-cutting*) e costura.
- **Zhang & Liu (2024, JTAER/MDPI)**: Avalia IA generativa (Midjourney, 667 imagens) no trabalho do estilista — excelente para ideação rápida (<60s), mas incapaz de gerar vistas traseiras consistentes, manter estrutura técnica fiel ao tecido ou editar detalhes construtivos sem retrabalho manual em CAD/Illustrator.
- **Goulart et al. (2021, Projética/UEL)**: Estudo na Rovitex (SC, 82 facções terceirizadas) evidenciando como a sazonalidade das coleções criadas pelo estilo exige controle rigoroso de fichas técnicas, prazos e conformidade trabalhista (*Fashion Law*) junto às oficinas de costura.
