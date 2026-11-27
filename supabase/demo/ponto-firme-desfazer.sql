-- Alinhavo · Desfaz o povoamento do "Ateliê Ponto Firme" (supabase/demo/ponto-firme.sql).
-- Roda à mão no SQL Editor do Supabase. Apaga só o que o povoamento criou: as 5 coleções e o que está
-- nelas (produtos, moldes, versões, aprovações, comentários, histórico de estágios), as 5 pessoas
-- fictícias e a atividade delas. O que o ateliê já tinha fica. Os números de Resultados ficam (o
-- povoamento só os grava quando estão vazios, e não dá para saber de quem são).

do $undo$
declare
  v_org constant uuid := 'a70b71c6-d1a0-4630-bb5a-ff5f7302fd2c';
  v_people constant uuid[] := array[
    '5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000003',
    '5eed0000-0000-4000-8000-000000000004', '5eed0000-0000-4000-8000-000000000005']::uuid[];
  v_names constant text[] := array['Outono 2026', 'Inverno 2026', 'Primavera 2026', 'Resort 2026', 'Alto Verão 2027'];
  v_cols uuid[];
  v_prods uuid[];
  v_pats uuid[];
  v_apprs uuid[];
begin
  select coalesce(array_agg(id), '{}') into v_cols from public.collections where org_id = v_org and name = any (v_names);
  select coalesce(array_agg(id), '{}') into v_prods from public.products where org_id = v_org and collection_id = any (v_cols);
  select coalesce(array_agg(pattern_id), '{}') into v_pats from public.products where id = any (v_prods) and pattern_id is not null;
  select coalesce(array_agg(id), '{}') into v_apprs from public.approvals where pattern_id = any (v_pats);

  delete from public.activity_log
   where org_id = v_org
     and (user_id = any (v_people) or entity_id = any (v_cols || v_prods || v_pats || v_apprs || v_people));
  delete from public.products where id = any (v_prods);       -- comentários e histórico vão junto
  delete from public.patterns where id = any (v_pats);        -- versões e aprovações vão junto
  delete from public.collections where id = any (v_cols);     -- cronograma vai junto
  delete from public.org_members where org_id = v_org and user_id = any (v_people);
  delete from public.activity_log where org_id = v_org and action = 'membro_saiu' and entity_id = any (v_people);
  delete from auth.users where id = any (v_people);           -- perfis vão junto
end;
$undo$;
