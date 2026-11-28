-- Resultados: o app grava com `upsert` (supabase-js), que no PostgREST vira
-- `insert ... on conflict (org_id) do update set org_id = excluded.org_id, ...`.
-- O Postgres exige UPDATE em toda coluna do `set`, e org_id (e month, em roi_months)
-- não tinha: o dono não conseguia salvar e a tela dizia "Só dono e admin mudam os resultados."
-- (42501). Mesmo caso do perfil em 20261115270000_perfil_upsert.sql.
--
-- Seguro: as políticas de update exigem dono ou admin da organização antes e depois,
-- então a linha nunca passa para uma organização em que a pessoa não manda.

grant update (org_id) on public.roi_settings to authenticated;
grant update (org_id, month) on public.roi_months to authenticated;
