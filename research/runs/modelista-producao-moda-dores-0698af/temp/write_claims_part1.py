import json, os

dir_path = "C:/Users/paulo/OneDrive/Desktop/Paulo Tech LTDA/Nova pasta/research/runs/modelista-producao-moda-dores-0698af/temp"

claims_data = {
  "m-o-d-a-p-a-l-a-v-r-a-e-p-e-r-i-ó-d-i-c-o-2": [
    {
      "claim": "A norma ABNT NBR 13377:1995 não foi construída a partir de um levantamento antropométrico da população brasileira, mas de um consenso entre representantes da cadeia têxtil e de confecção.",
      "stance": "supports",
      "stance_target": "Inadequação histórica das tabelas ABNT por falta de base antropométrica empírica",
      "evidence_type": "historical",
      "scope_conditions": "Indústria brasileira de confecção do vestuário; vigência da NBR 13377 (1995-2012)",
      "quoted_support": "De acordo com Sabrá, Santos e Dinis (2008), a norma NBR13377 não é resultado de um estudo antropométrico, mas de um acordo realizado entre representantes da cadeia têxtil e de confecção nacional.",
      "numbers": ["1995", "2008", "13377"],
      "entities": ["ABNT", "NBR 13377", "Sabrá, Santos e Dinis"],
      "time_period": "1995-2012",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "m-o-d-a-p-a-l-a-v-r-a-e-p-e-r-i-ó-d-i-c-o-2"
    },
    {
      "claim": "As normas ABNT NBR 15800 (vestuário infantil, com 53 participantes) e NBR 16060 (vestuário masculino, com 21 participantes) carecem de metodologia de medição antropométrica consistente quando comparadas ao estudo SizeBR do SENAI/CETIQT.",
      "stance": "supports",
      "stance_target": "Fragilidade metodológica das normas ABNT frente a levantamentos antropométricos tridimensionais",
      "evidence_type": "empirical",
      "scope_conditions": "Normalização do vestuário infantil e masculino no Brasil",
      "quoted_support": "Com base na proposta de projeto que originou as normas de vestuário da ABNT, mais especificamente a NBR15800 e NBR16060, pode-se perceber uma limitação da pesquisa por não abordar uma metodologia de medição antropométrica consistente, diferente do projeto que está em desenvolvimento pelo SENAI/CETIQT.",
      "numbers": ["53 pessoas", "21 participantes", "NBR 15800", "NBR 16060"],
      "entities": ["ABNT", "ABIT", "ABRAVEST", "Draft Manequins Industriais", "SENAI/CETIQT"],
      "time_period": "2009-2017",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "m-o-d-a-p-a-l-a-v-r-a-e-p-e-r-i-ó-d-i-c-o-2"
    },
    {
      "claim": "A adesão das confecções brasileiras às tabelas da ABNT é baixa porque a adoção das normas é facultativa e cada marca estabelece suas próprias medidas e gradações para seu nicho.",
      "stance": "supports",
      "stance_target": "Predominância de tabelas próprias sobre normas ABNT nas confecções brasileiras",
      "evidence_type": "empirical",
      "scope_conditions": "Mercado brasileiro de vestuário",
      "quoted_support": "O projeto da NBR15800 (REVISTA ÉPOCA, 2011), por sua vez, apresenta uma tabela com o nome de 53 pessoas e as instituições às quais elas estão vinculadas, e são principalmente as empresas do setor de confecção que fazem parte desse projeto, contando ainda com a participação de membros da ABNT, ABIT, ABRAVEST e da Draft Manequins Industriais.",
      "numbers": ["53 pessoas", "54 parâmetros (NBR 15127:2004)"],
      "entities": ["ABNT", "NBR 15800", "NBR 15127", "Chicleteria", "YKZ Moda Infantil"],
      "time_period": "2004-2017",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "m-o-d-a-p-a-l-a-v-r-a-e-p-e-r-i-ó-d-i-c-o-2"
    }
  ],
  "instituto-federal-de-educação-ciência-e-tecnologia-do-sul-de-minas-gerais-passos": [
    {
      "claim": "Em teste experimental de modelagem plana tamanho 40, o protótipo construído pela NBR 13.377:1995 apresentou maior largura no busto e menor volume no quadril, enquanto o protótipo pela NBR 16.933:2021 (biótipo colher) teve maior volume e curvatura no quadril e melhor ajuste de cava.",
      "stance": "supports",
      "stance_target": "Evolução ergonômica da NBR 16.933:2021 em relação à NBR 13.377:1995 para o biótipo colher",
      "evidence_type": "empirical",
      "scope_conditions": "Vestido básico feminino tamanho 40 em tecido plano 100% poliéster sem elastano",
      "quoted_support": "O protótipo confeccionado a partir da NBR 13.377:1995 apresentou maior largura na região do busto, enquanto o desenvolvido segundo a NBR 16.933:2021 evidenciou maior volume na área do quadril, coerente com o biótipo “colher” adotado pela norma.",
      "numbers": ["tamanho 40", "1,5 cm (rebaixamento de cava)", "1 cm (decote frente)"],
      "entities": ["ABNT NBR 13.377:1995", "ABNT NBR 16.933:2021", "IFSULDEMINAS"],
      "time_period": "1995-2025",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "instituto-federal-de-educação-ciência-e-tecnologia-do-sul-de-minas-gerais-passos"
    },
    {
      "claim": "A ausência de medidas complementares na antiga NBR 13.377:1995 obrigava o modelista a recorrer a estimativas subjetivas, ao passo que a NBR 16.933:2021 reduz a subjetividade na modelagem ao fornecer medidas básicas e complementares para os biótipos retângulo e colher.",
      "stance": "supports",
      "stance_target": "Importância das medidas secundárias e de biótipo para evitar decisões subjetivas do modelista",
      "evidence_type": "empirical",
      "scope_conditions": "Modelagem plana industrial feminina no Brasil",
      "quoted_support": "Os resultados revelaram variações no volume do quadril e no ajuste das cavas, indicando que a NBR 16.933:2021 contempla de forma mais adequada a diversidade de silhuetas femininas e reduz a subjetividade na modelagem ao apresentar medidas básicas e complementares.",
      "numbers": ["2 biótipos (retângulo e colher)"],
      "entities": ["ABNT NBR 16.933:2021", "ABNT NBR 13.377:1995"],
      "time_period": "2021-2025",
      "region": "Brasil",
      "confidence": "high",
      "source_note_id": "instituto-federal-de-educação-ciência-e-tecnologia-do-sul-de-minas-gerais-passos"
    }
  ]
}

for nid, claims in claims_data.items():
    path = os.path.join(dir_path, f"claims-{nid}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(claims, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(claims)} claims to {path}")
