-- Documento do molde, formato 4: por parte, `cutPair` (cortar par, a
-- segunda peça espelhada) e `placement.leg` (a parte veste uma perna), e a
-- costura de um segmento com o próprio par. Tudo opcional, dentro das
-- partes e das costuras; a trava só passa a aceitar o número 4.
--
-- Versões já gravadas (1, 2 e 3) continuam como estão; o app as converte na
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
      or (document ->> 'schema' in ('2', '3', '4') and jsonb_typeof(document -> 'seams') = 'array')
    ),
    false
  )
);
