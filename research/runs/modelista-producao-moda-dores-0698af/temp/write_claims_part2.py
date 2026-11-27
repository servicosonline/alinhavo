import json, os

dir_path = "C:/Users/paulo/OneDrive/Desktop/Paulo Tech LTDA/Nova pasta/research/runs/modelista-producao-moda-dores-0698af/temp"

claims_data = {
  "número-1-volume-10-jan-jun-2022": [
    {
      "claim": "A aferição de um manequim técnico de modelagem tamanho 48 (marca Draft) revelou discrepância de 9 cm na circunferência da cintura em relação à tabela de medidas padrão de mercado para o mesmo tamanho.",
      "stance": "supports",
      "stance_target": "Descompasso entre manequins técnicos industriais, tabelas de medidas e corpos reais plus size",
      "evidence_type": "empirical",
      "scope_conditions": "Modelagem feminina plus size tamanho 48 em laboratório de modelagem (IFSC Araranguá)",
      "quoted_support": "As medidas relativas ao manequim de modelagem e a tabela padrão são semelhantes, exceto na cintura, onde existe uma diferença de 9 cm.",
      "numbers": ["9 cm", "tamanho 48"],
      "entities": ["Draft", "IFSC Araranguá"],
      "time_period": "2021-2022",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "número-1-volume-10-jan-jun-2022"
    },
    {
      "claim": "Protótipos tamanho 48 em tecido plano (100% algodão) construídos a partir de tabela padrão apresentaram sobra de 8 cm no gancho traseiro da calça, falta de 5 cm para fechar na cintura/quadril de uma modelo real e exigiram ampliar as costas da blusa em 5 cm e descer a cava em 4 cm.",
      "stance": "supports",
      "stance_target": "Inviabilidade de obter modelagem plus size por simples ampliação linear de grades menores",
      "evidence_type": "empirical",
      "scope_conditions": "Provas de vestibilidade de blusa e calça tamanho 48 em tecido plano 100% algodão em duas modelos reais",
      "quoted_support": "Na blusa, foi descido 2 cm no decote da frente, foi ampliado o tamanho do molde das costas em 5 cm, além de baixar 4 cm na cava, redesenhando a mesma. A calça ficou grande no gancho, sobrando 8 cm, em sua maioria, na parte das costas.",
      "numbers": ["8 cm (sobra no gancho)", "5 cm (ampliação costas)", "4 cm (rebaixamento cava)", "2 cm (decote frente)", "5 cm (falta no quadril/cintura)", "6 cm (sobra cintura modelo 1)"],
      "entities": ["IFSC", "PUC-Rio"],
      "time_period": "2021-2022",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "número-1-volume-10-jan-jun-2022"
    }
  ],
  "15º-congresso-brasileiro-de-pesquisa-e-desenvolvimento-em-design-manaus-am": [
    {
      "claim": "Embora o mercado brasileiro plus size tenha crescido cerca de 75% em 10 anos e a NBR 16933:2021 vá do tamanho 34 ao 62, a norma contempla apenas os biótipos retângulo e colher, deixando desassistidos os biótipos oval e diamante (nos quais a circunferência da cintura/abdômen supera busto e quadril).",
      "stance": "supports",
      "stance_target": "Insuficiência da NBR 16933:2021 para representar a morfologia do corpo gordo feminino brasileiro",
      "evidence_type": "empirical",
      "scope_conditions": "Vestuário feminino plus size no Brasil; análise da NBR 16933:2021",
      "quoted_support": "Já o biótipo diamante foi classificado por Carvalho e Poci (2023) como aquele que apresenta uma circunferência de cintura maior em relação as circunferências de busto e quadril, sobressaindo muito mais o abdômen nas dimensões de largura desta estrutura corporal. Com relação as normas de medidas direcionadas para ao corpo feminino, temos a NBR 16933/2021, lançada no final de 2021 e que apresenta um apanhado das medidas corporais femininas contemplando o biótipo retângulo, com uma tabela de medidas configurada do tamanho 34 até o tamanho 62.",
      "numbers": ["75% (crescimento em 10 anos)", "tamanho 34 ao 62"],
      "entities": ["ABNT NBR 16933:2021", "ABPS (Associação Brasil Plus Size)", "PUC-Rio"],
      "time_period": "2013-2024",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "15º-congresso-brasileiro-de-pesquisa-e-desenvolvimento-em-design-manaus-am"
    }
  ],
  "instituto-federal-de-educação-ciência-e-tecnologia-do-sul-de-minas-gerais-pass-2": [
    {
      "claim": "A adaptação de bases de modelagem plana para os sete biótipos corporais (ampulheta, colher, retângulo, oval, triângulo, triângulo invertido e diamante) exige alterações estruturais específicas nas linhas de cintura, quadril e tórax em vez de gradação uniforme.",
      "stance": "supports",
      "stance_target": "Necessidade de ajustes geométricos por biótipo na modelagem plana",
      "evidence_type": "theoretical",
      "scope_conditions": "Adaptação de moldes de vestuário feminino para múltiplos biótipos",
      "quoted_support": "O ajuste para o biótipo retângulo é o de aumentar a largura da cintura nas laterais, comparando a medida do contorno da cintura do molde com o biótipo. O foco aqui é garantir que a cintura do molde coincida com a cintura do biótipo, valorizando a parte mais fina do corpo Berg (2019).",
      "numbers": ["7 biótipos"],
      "entities": ["IFSULDEMINAS", "SENAI CETIQT"],
      "time_period": "2025",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "instituto-federal-de-educação-ciência-e-tecnologia-do-sul-de-minas-gerais-pass-2"
    }
  ],
  "ergonomia-do-vestuário-para-idosas-de-60-a-75-anos": [
    {
      "claim": "Mulheres idosas de 60 a 75 anos sofrem alterações anatômicas — curvatura da coluna, aumento do abdômen e redução de estatura, busto e glúteos — que tornam inadequados os padrões de modelagem adulta e as tabelas da ABNT ou das marcas.",
      "stance": "supports",
      "stance_target": "Inadequação das tabelas ABNT e de mercado para a antropometria da mulher idosa",
      "evidence_type": "empirical",
      "scope_conditions": "Grupos focais com mulheres ativas de 60 a 75 anos na Zona Sul do Rio de Janeiro",
      "quoted_support": "Na Figura 1, percebe-se as alterações nos corpos conforme o avanço da idade, como a curvatura da coluna – o que causa uma má postura –, o aumento do abdômen e a diminuição da altura, do busto e dos glúteos. As lojas de vestuário utilizam, na sua maioria, tabelas de medidas de padrões oficiais brasileiros, como da ABNT, ou dos estabelecidos pelas próprias marcas, e as participantes não se sentem inseridas nessas métricas.",
      "numbers": ["60 a 75 anos", "60 a 68 anos (subgrupo 1)", "69 a 75 anos (subgrupo 2)"],
      "entities": ["ABNT", "IBGE", "PUC-Rio"],
      "time_period": "2018-2019",
      "region": "Rio de Janeiro, Brasil",
      "confidence": "high",
      "source_note_id": "ergonomia-do-vestuário-para-idosas-de-60-a-75-anos"
    },
    {
      "claim": "Na usabilidade do vestuário para idosas de 60 a 75 anos, fechos nas costas, zíperes (para quem tem artrite), decotes rentes ao pescoço e calças compridas com modelagem padrão figuram entre as principais causas de desconforto e rejeição.",
      "stance": "supports",
      "stance_target": "Demandas ergonômicas de vestir/desvestir e mobilidade na modelagem para idosas",
      "evidence_type": "empirical",
      "scope_conditions": "Grupos focais com mulheres de 60 a 75 anos no Rio de Janeiro",
      "quoted_support": "Não foi mencionada uma preferência no modo de vestir e desvestir as blusas, mas foi ressaltado que muitas idosas não se sentem confortáveis com decotes muito próximos ao pescoço, e que elas têm dificuldades em manusear roupas com fecho nas costas. As calças compridas são um problema no que concerne encontrar a modelagem própria para cada corpo, ou o modelo que as idosas julguem mais adequado à nova faixa etária.",
      "numbers": ["60 a 75 anos"],
      "entities": ["PUC-Rio"],
      "time_period": "2018-2019",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "ergonomia-do-vestuário-para-idosas-de-60-a-75-anos"
    }
  ],
  "v18-n44-2025": [
    {
      "claim": "Ao atualizar sua tabela de medidas em 2022 segundo a ABNT (NBR 16933), a revista Manequim aumentou a cintura de todos os tamanhos em 4 cm, mas reduziu o tamanho máximo da tabela do 62 (cintura 118 cm) para o 54 (cintura 110 cm), regredindo ao patamar de 1996.",
      "stance": "supports",
      "stance_target": "Exclusão prática de corpos gordos e inconsistência na aplicação comercial da NBR 16933",
      "evidence_type": "empirical",
      "scope_conditions": "Análise documental das tabelas de medidas e moldes da Revista Manequim (1991, 1996 e duas edições de 2022)",
      "quoted_support": "Nesta edição, a revista atualizou sua tabela de medidas conforme as regras da ABNT e sua consultora Cristiane Laira, (Revista Manequim, 2022, p. 52). Dessa forma, para a consumidora saber se o tamanho EG realmente veste uma cintura com a medida de 110 centímetros, é necessário que esse molde seja copiado em um papel específico para modelagem e conferida as suas medidas antes de produzir a roupa.",
      "numbers": ["tamanho 50 / cintura 92 cm (1991)", "tamanho 56 / cintura 110 cm (1996)", "tamanho 62 / cintura 118 cm (2022 ed. 1)", "tamanho 54 / cintura 110 cm (2022 ed. 2 pós-ABNT)", "+4 cm na cintura", "61,7% (excesso de peso adulto no Brasil)", "26,8% (obesidade adulta PNS 2019)"],
      "entities": ["Revista Manequim", "ABNT", "NBR 16933", "IBGE PNS 2019"],
      "time_period": "1991-2025",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "v18-n44-2025"
    }
  ],
  "instituto-federal-de-educação-ciência-e-tecnologia-do-sul-de-minas-gerais-2": [
    {
      "claim": "A norma ABNT NBR 16933:2021 inicia a faixa de baixa estatura em 1,50 m (até 1,57 m), excluindo mulheres petite entre 1,42 m e 1,49 m e gerando falhas ergonômicas críticas em medidas verticais como altura de corpo frente (35,1 cm no tam. 34), altura do busto (21,5 cm), cava (21,5 cm) e gancho (25,5 cm).",
      "stance": "supports",
      "stance_target": "Inadequação das tabelas padrão e da NBR 16933:2021 para o biótipo petite nas proporções verticais",
      "evidence_type": "empirical",
      "scope_conditions": "Mulheres brasileiras petite (1,42 m a 1,62 m); comparação entre NBR 16933:2021, Rosa (2017) e Berg (2017)",
      "quoted_support": "Porém, mesmo após a nova análise corporal, a ABNT ainda exclui uma boa parcela das mulheres petite de seus padrões de medida uma vez que o recorte para mulheres petite foi estipulado entre 1,42m até 1,62m e o recorte da ABNT para o mesmo público inicia-se em 1,50m. Na ABNT, a menor altura do corpo frente, seria equivalente ao tamanho 34 e corresponde a 35,1 cm enquanto, a altura do busto é de 21,5 cm.",
      "numbers": ["1,42 m a 1,62 m (faixa petite)", "1,50 m a 1,57 m (baixa estatura ABNT)", "1,60 m (estatura média brasileira)", "35,1 cm (altura corpo frente tam. 34)", "21,5 cm (altura busto e cava tam. 34)", "25,5 cm (altura gancho tam. 34)", "0,2 cm a 0,5 cm (gradação entre tamanhos)"],
      "entities": ["ABNT NBR 16933:2021", "IFSULDEMINAS", "Stefania Rosa", "Ana Laura Marchi Berg"],
      "time_period": "2017-2024",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "instituto-federal-de-educação-ciência-e-tecnologia-do-sul-de-minas-gerais-2"
    }
  ]
}

for nid, claims in claims_data.items():
    path = os.path.join(dir_path, f"claims-{nid}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(claims, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(claims)} claims to {path}")
