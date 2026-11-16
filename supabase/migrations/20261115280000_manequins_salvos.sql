-- Manequins salvos: o corpo ajustado na Prova (medidas e condições) guardado
-- com nome, por organização, para carregar de novo em qualquer molde.
--
--   * measurements: as medidas do corpo em mm (chave → número), as mesmas do
--     painel "Corpo do manequim" (packages/cloth, MEASUREMENT_KEYS). O app
--     confere os limites ao ler (lib/prova/saved-bodies.ts); o banco segura o
--     formato e o tamanho.
--   * conditions: gestante, membro cortado e salto (BodyConditions).
-- Todo membro lê; quem edita moldes (dono, admin, modelista) cria, renomeia,
-- atualiza e apaga. Até 100 por organização; nome único na organização.

create table public.body_presets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  measurements jsonb not null check (jsonb_typeof(measurements) = 'object' and pg_column_size(measurements) <= 4000),
  conditions jsonb not null default '{}' check (jsonb_typeof(conditions) = 'object' and pg_column_size(conditions) <= 2000),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);
create index body_presets_org_id_idx on public.body_presets (org_id);

create trigger body_presets_updated_at before update on public.body_presets
  for each row execute function private.set_updated_at();

-- Limite por organização (54000: a mensagem vai para a tela).
create function private.body_presets_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('body_presets:' || new.org_id::text));
  if (select count(*) from public.body_presets where org_id = new.org_id) >= 100 then
    raise exception 'Limite de 100 manequins salvos por organização. Apague um para salvar outro.'
      using errcode = '54000';
  end if;
  return new;
end;
$$;
revoke all on function private.body_presets_limit() from public, anon, authenticated;

create trigger body_presets_limit before insert on public.body_presets
  for each row execute function private.body_presets_limit();

alter table public.body_presets enable row level security;

create policy body_presets_select on public.body_presets for select to authenticated using (private.is_org_member(org_id));
create policy body_presets_insert on public.body_presets for insert to authenticated with check (private.can_edit_patterns(org_id));
create policy body_presets_update on public.body_presets for update to authenticated
  using (private.can_edit_patterns(org_id)) with check (private.can_edit_patterns(org_id));
create policy body_presets_delete on public.body_presets for delete to authenticated using (private.can_edit_patterns(org_id));

revoke all on public.body_presets from anon, authenticated;
grant select, delete on public.body_presets to authenticated;
grant insert (org_id, name, measurements, conditions) on public.body_presets to authenticated;
grant update (name, measurements, conditions) on public.body_presets to authenticated;
