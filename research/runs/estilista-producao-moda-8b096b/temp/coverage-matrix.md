## Coverage Matrix — query phrase → atomic item mapping

| Query phrase (verbatim) | Mapped atomic item(s) | Scope check | Gap? |
|---|---|---|---|
| "responsabilidades" | Sub-Q1: Quais são as responsabilidades de uma estilista num processo de produção de moda? / Entity `estilista.responsabilidades` | OK — cobre atribuições estratégicas, criativas, técnicas e de gestão de coleção | No |
| "tarefas" | Sub-Q2: Quais tarefas a estilista executa em cada etapa do desenvolvimento de coleção, da pesquisa à produção? / Entity `estilista.tarefas por etapa` | OK — cobre tarefas operacionais ponta a ponta (pesquisa, planejamento, desenho, ficha técnica, matéria-prima, pilotagem/prova, aprovação, acompanhamento de produção) | No |
| "estilista" | Entity: `estilista` (designer de moda / estilista de confecção, tanto em PMEs quanto em marcas maiores, e sua distinção/sobreposição com modelista e analista de produto) | OK — escopo completo no contexto brasileiro e internacional | No |
| "processo de produção" | Sub-Q2 (etapas do desenvolvimento à produção) e Sub-Q3 (interfaces com modelagem, pilotagem, facção, comercial, fornecedores) | OK — abrange desenvolvimento de produto de moda (PDP) e interface com produção industrial/facção | No |
| "moda" | Scope condition: `moda e vestuário; mercado brasileiro preferencial, com fontes internacionais como apoio` | OK — indústria de confecção e moda | No |
| "suas dores no processo" | Sub-Q4: Quais são as dores da estilista nesse processo? / Entity `estilista.dores` / Heading 4 e 5 | OK — cobre dores operacionais, técnicas, comunicacionais, criativo-comerciais, de ferramentas e de calendário | No |
