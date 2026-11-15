-- Tabelas de medidas prontas: de qual modelo a tabela partiu (id em
-- apps/web/src/lib/size-chart-templates.ts). Com ele, a grade mostra as
-- medidas do modelo mesmo antes de ter valor, com o jeito de medir.
-- Só na criação; depois não muda (a tabela é da confecção).

alter table public.size_charts
  add column template text check (template is null or template ~ '^[a-z0-9-]{1,40}$');

grant insert (template) on public.size_charts to authenticated;
