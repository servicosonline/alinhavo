-- Documento do molde, formato 3: por parte, `fold` (segmento da dobra) e
-- `placement` (posição na Prova). Os dois são opcionais e moram dentro de
-- cada parte; a trava só passa a aceitar o número 3.
--
-- Versões já gravadas (1 e 2) continuam como estão; o app as converte na
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
      or (document ->> 'schema' in ('2', '3') and jsonb_typeof(document -> 'seams') = 'array')
    ),
    false
  )
);
