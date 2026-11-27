# Scaffold — estilista-producao-moda-8b096b

## User Prompt (VERBATIM — gospel)

> preciso fazer uma pesquisa sobre quais são as responsabilidades e tarefas de uma estilista num processo de produção, moda e suas dores no processo.

## Run Config

- **vault_tag**: `estilista-producao-moda-8b096b`
- **query_file_path**: `research/runs/estilista-producao-moda-8b096b/query.md`
- **modality**: `synthesize` (combined with structured collection of responsibilities/tasks per production stage and deep analytical synthesis of structural/operational pain points in fashion product development)
- **language**: Portuguese (`pt-BR`)
- **wrapper_requirements**:
  - Save path: `research/notes/final_report_estilista-producao-moda-8b096b.md`
  - Citation format: `[[note-id]]` inline vault note references
  - Terminal sections: as determined by step 1 decomposition

## Modality Classification Rationale

The query asks both for a comprehensive mapping of responsibilities and operational tasks of a fashion designer/stylist (*estilista*) across the garment production and collection development workflow, AND an analytical investigation of their pain points (*dores no processo*) — such as creative vs. commercial tension, communication gaps with patternmakers (*modelistas*) and seamstresses (*piloteiras* / *facções*), tech pack (*ficha técnica*) rework, fit/sample approval bottlenecks, calendar compression, and tooling fragmentation. Combining structured task taxonomy with evidence-backed thesis synthesis (`synthesize` + `collect`) yields the highest utility.

## Tier Rationale

Classificado como `full` + `structured`. Embora a pergunta peça um mapeamento de responsabilidades e tarefas (`survey`), a investigação das **dores reais no processo de produção** exige cruzar literatura acadêmica de Processo de Desenvolvimento de Produto (PDP) no vestuário (SENAI CETIQT, Colóquio de Moda, periódicos de design/produção) com relatos práticos da indústria brasileira de confecção, tensões entre criação, modelagem, pilotagem e facção, e gargalos de ficha técnica e aprovação. O pipeline `full` garante investigação profunda dos loci de atrito operacional e validação empírica das dores.

