-- Documento do molde, formato 7: acabamentos novos `bordado` (imagem com
-- relevo, num retângulo) e `pedraria` (pedras ao longo de um segmento ou num
-- retângulo). Tipos novos dentro de `finishes`; a trava só passa a aceitar o
-- número 7.
--
-- Versões já gravadas (1 a 6) continuam como estão; o app as converte na
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
      or (document ->> 'schema' in ('2', '3', '4', '5', '6', '7') and jsonb_typeof(document -> 'seams') = 'array')
    ),
    false
  )
);
