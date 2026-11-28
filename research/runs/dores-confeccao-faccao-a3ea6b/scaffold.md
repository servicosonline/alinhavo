# Scaffold — dores-confeccao-faccao-a3ea6b

## User Prompt (VERBATIM — gospel)

preciso saber as necessidades, dificuldades de um proprietário de confecção (fábrica de roupas, facção).

## Run Config
- `vault_tag`: `dores-confeccao-faccao-a3ea6b`
- `query_file_path`: `research/runs/dores-confeccao-faccao-a3ea6b/query.md`
- `modality`: `synthesize` (com elementos estruturados de `collect` e `compare` entre confecção marca própria/verticalizada e facção terceirizada)
- `language`: `pt-BR` (português do Brasil)

## Modality Classification Rationale
A pergunta pede um levantamento profundo e analítico das necessidades e dificuldades reais de proprietários de confecção (fábricas de roupas e facções). Embora exija catalogação estruturada das dores operacionais, financeiras, trabalhistas, comerciais e tecnológicas, uma resposta de alto nível precisa ir além de uma lista genérica: deve sintetizar e defender teses sobre quais gargalos realmente destroem margem, onde há diferença estrutural entre confecção de marca própria/private label e facção de costura terceirizada, e onde as soluções tradicionais (ERPs legados, CADs caros, planilhas) falham.

## Tier Rationale
Classificado como `full` + `structured`. A pergunta exige cobertura profunda e multidimensional de um setor complexo e fragmentado (confecção de marca própria/private label vs. facção de costura terceirizada no Brasil), envolvendo tensões reais (ex.: formalização vs. sobrevivência no Simples/MEI, terceirização vs. internalização e risco trabalhista/fiscal, adoção de CAD/ERP vs. barreiras de custo e qualificação). Um levantamento superficial (`light`) perderia dados empíricos de APLs, pesquisas SEBRAE/ABIT/IEMI e as diferenças críticas entre fábrica e facção.

## Wrapper Requirements
- Caminho final do relatório: `research/notes/final_report_dores-confeccao-faccao-a3ea6b.md`
- Idioma: Português do Brasil
- Citações verificadas no formato do pipeline
