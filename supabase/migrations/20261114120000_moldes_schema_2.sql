-- Documento do molde, formato 2: acrescenta as costuras (lista `seams`).
--
-- As versões já gravadas continuam no formato 1 e nunca são reescritas
-- (versão de molde é imutável); o app as converte na leitura
-- (migratePattern em packages/geometry). Versões novas saem no formato 2.

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
      or (document ->> 'schema' = '2' and jsonb_typeof(document -> 'seams') = 'array')
    ),
    false
  )
);
