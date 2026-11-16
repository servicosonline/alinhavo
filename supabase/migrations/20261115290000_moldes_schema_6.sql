-- Documento do molde, formato 6: por parte, `placement.arm` (a parte veste um
-- braço: manga). Campo opcional dentro das partes; a trava só passa a aceitar
-- o número 6.
--
-- Versões já gravadas (1 a 5) continuam como estão; o app as converte na
-- leitura (migratePattern em packages/geometry).

alter table public.pattern_versions drop constraint pattern_versions_document_check;

alter table public.pattern_versions add constraint pattern_versions_document_check check (
  -- coalesce: campo ausente dá NULL, e CHECK com NULL passaria. Aqui reprova.
  coalesce(
    document ->> 'unit' = 'mm'
    and jsonb_typeof(document -> 'sizes') = 'array'
    and jsonb_typeof(document -> 'pieces') = 'array'
    and pg_column_size(document) < 2000000
    and (
      document ->> 'schema' = '1'
      or (document ->> 'schema' in ('2', '3', '4', '5', '6') and jsonb_typeof(document -> 'seams') = 'array')
    ),
    false
  )
);
