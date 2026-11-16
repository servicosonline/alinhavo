-- Perfil: o app grava com `upsert` (supabase-js), que no PostgREST vira
-- `insert ... on conflict (user_id) do update set user_id = excluded.user_id, ...`.
-- O Postgres exige UPDATE em toda coluna do `set`, e o user_id não tinha:
-- foto, nome/CPF, boas-vindas e primeiros passos falhavam com 42501
-- ("Você só pode mudar a sua própria conta.").
--
-- Seguro: a política profiles_update_own exige user_id = auth.uid() antes e
-- depois, então o user_id só pode ser "trocado" por ele mesmo.

grant update (user_id) on public.profiles to authenticated;
