-- Alinhavo · Fase 1 · Tabelas de medidas, tamanhos e moldes versionados.
--
-- Regras:
--   * Leitura: qualquer membro da organização.
--   * Escrita de medidas e moldes: owner, admin e modelista.
--   * Apagar um molde (e todo o histórico): só owner e admin.
--   * Vínculos entre tabelas carregam org_id (FK composta), então nada de uma
--     organização aponta para outra, nem para quem participa das duas.
--   * Versões de molde são imutáveis e só nascem por save_pattern_version.
--   * Medidas em mm.

create function private.can_edit_patterns(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_org_role(p_org_id, array['owner', 'admin', 'modelista']::public.org_role[]);
$$;

revoke all on function private.can_edit_patterns(uuid) from public;
grant execute on function private.can_edit_patterns(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Clientes (de quem a confecção desenvolve)
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id)
);
create index clients_org_id_idx on public.clients (org_id);

-- ---------------------------------------------------------------------------
-- Tabelas de medidas, tamanhos e medidas
-- ---------------------------------------------------------------------------

create table public.size_charts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  client_id uuid,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  foreign key (client_id, org_id) references public.clients (id, org_id) on delete set null (client_id)
);
create index size_charts_org_id_idx on public.size_charts (org_id);

create table public.sizes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  size_chart_id uuid not null,
  label text not null check (char_length(btrim(label)) between 1 and 20),
  position integer not null check (position >= 0),
  is_base boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  unique (size_chart_id, label),
  foreign key (size_chart_id, org_id) references public.size_charts (id, org_id) on delete cascade
);
create index sizes_org_id_idx on public.sizes (org_id);
create unique index sizes_um_base_por_tabela on public.sizes (size_chart_id) where is_base;

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  size_id uuid not null,
  name text not null check (name = lower(btrim(name)) and char_length(name) between 1 and 60),
  value_mm numeric(8, 1) not null check (value_mm > 0 and value_mm < 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (size_id, name),
  foreign key (size_id, org_id) references public.sizes (id, org_id) on delete cascade
);
create index measurements_org_id_idx on public.measurements (org_id);

-- ---------------------------------------------------------------------------
-- Moldes e versões
-- ---------------------------------------------------------------------------

create type public.pattern_origin as enum ('editor', 'prova', 'scan', 'importacao');

create table public.patterns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  size_chart_id uuid,
  current_version integer not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  foreign key (size_chart_id, org_id) references public.size_charts (id, org_id) on delete set null (size_chart_id)
);
create index patterns_org_id_idx on public.patterns (org_id);

create table public.pattern_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  pattern_id uuid not null,
  number integer not null check (number >= 1),
  -- coalesce: campo ausente dá NULL, e CHECK com NULL passaria. Aqui reprova.
  document jsonb not null check (
    coalesce(
      document ->> 'schema' = '1'
      and document ->> 'unit' = 'mm'
      and jsonb_typeof(document -> 'sizes') = 'array'
      and jsonb_typeof(document -> 'pieces') = 'array'
      and pg_column_size(document) < 2000000,
      false
    )
  ),
  origin public.pattern_origin not null,
  message text check (char_length(message) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (pattern_id, number),
  foreign key (pattern_id, org_id) references public.patterns (id, org_id) on delete cascade
);
create index pattern_versions_org_id_idx on public.pattern_versions (org_id);

-- Versão salva não muda nunca (nem pelo dono do banco, por engano).
create function private.block_version_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Versões de molde não podem ser alteradas.' using errcode = 'insufficient_privilege';
end;
$$;

create trigger pattern_versions_imutavel
  before update on public.pattern_versions
  for each row execute function private.block_version_update();

create trigger clients_updated_at before update on public.clients
  for each row execute function private.set_updated_at();
create trigger size_charts_updated_at before update on public.size_charts
  for each row execute function private.set_updated_at();
create trigger sizes_updated_at before update on public.sizes
  for each row execute function private.set_updated_at();
create trigger measurements_updated_at before update on public.measurements
  for each row execute function private.set_updated_at();
create trigger patterns_updated_at before update on public.patterns
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.clients enable row level security;
alter table public.size_charts enable row level security;
alter table public.sizes enable row level security;
alter table public.measurements enable row level security;
alter table public.patterns enable row level security;
alter table public.pattern_versions enable row level security;

-- Leitura: qualquer membro. Escrita: quem edita moldes.
create policy clients_select on public.clients for select to authenticated using (private.is_org_member(org_id));
create policy clients_insert on public.clients for insert to authenticated with check (private.can_edit_patterns(org_id));
create policy clients_update on public.clients for update to authenticated
  using (private.can_edit_patterns(org_id)) with check (private.can_edit_patterns(org_id));
create policy clients_delete on public.clients for delete to authenticated using (private.can_edit_patterns(org_id));

create policy size_charts_select on public.size_charts for select to authenticated using (private.is_org_member(org_id));
create policy size_charts_insert on public.size_charts for insert to authenticated with check (private.can_edit_patterns(org_id));
create policy size_charts_update on public.size_charts for update to authenticated
  using (private.can_edit_patterns(org_id)) with check (private.can_edit_patterns(org_id));
create policy size_charts_delete on public.size_charts for delete to authenticated using (private.can_edit_patterns(org_id));

create policy sizes_select on public.sizes for select to authenticated using (private.is_org_member(org_id));
create policy sizes_insert on public.sizes for insert to authenticated with check (private.can_edit_patterns(org_id));
create policy sizes_update on public.sizes for update to authenticated
  using (private.can_edit_patterns(org_id)) with check (private.can_edit_patterns(org_id));
create policy sizes_delete on public.sizes for delete to authenticated using (private.can_edit_patterns(org_id));

create policy measurements_select on public.measurements for select to authenticated using (private.is_org_member(org_id));
create policy measurements_insert on public.measurements for insert to authenticated with check (private.can_edit_patterns(org_id));
create policy measurements_update on public.measurements for update to authenticated
  using (private.can_edit_patterns(org_id)) with check (private.can_edit_patterns(org_id));
create policy measurements_delete on public.measurements for delete to authenticated using (private.can_edit_patterns(org_id));

create policy patterns_select on public.patterns for select to authenticated using (private.is_org_member(org_id));
create policy patterns_insert on public.patterns for insert to authenticated with check (private.can_edit_patterns(org_id));
create policy patterns_update on public.patterns for update to authenticated
  using (private.can_edit_patterns(org_id)) with check (private.can_edit_patterns(org_id));
create policy patterns_delete on public.patterns for delete to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

-- Versões: leitura para membros; escrita só pela função save_pattern_version.
create policy pattern_versions_select on public.pattern_versions for select to authenticated
  using (private.is_org_member(org_id));

-- Colunas que o cliente pode escrever. org_id não muda depois de criado.
revoke insert, update on public.clients, public.size_charts, public.sizes, public.measurements, public.patterns
  from anon, authenticated;
grant insert (org_id, name) on public.clients to authenticated;
grant update (name) on public.clients to authenticated;
grant insert (org_id, client_id, name) on public.size_charts to authenticated;
grant update (client_id, name) on public.size_charts to authenticated;
grant insert (org_id, size_chart_id, label, position, is_base) on public.sizes to authenticated;
grant update (label, position, is_base) on public.sizes to authenticated;
grant insert (org_id, size_id, name, value_mm) on public.measurements to authenticated;
grant update (value_mm) on public.measurements to authenticated;
grant insert (org_id, name, size_chart_id) on public.patterns to authenticated;
grant update (name, size_chart_id, archived_at) on public.patterns to authenticated;
revoke insert, update, delete on public.pattern_versions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Salvar nova versão do molde
-- ---------------------------------------------------------------------------

-- p_expected_version é a versão que o editor abriu. Se alguém salvou no meio
-- do caminho, recusa em vez de sobrescrever (o app avisa e recarrega).
create function public.save_pattern_version(
  p_pattern_id uuid,
  p_document jsonb,
  p_origin public.pattern_origin,
  p_expected_version integer,
  p_message text default null
)
returns public.pattern_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pattern public.patterns;
  v_version public.pattern_versions;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_pattern from public.patterns p where p.id = p_pattern_id for update;

  -- Mesma mensagem para "não existe" e "sem acesso": não revela moldes alheios.
  if v_pattern.id is null or not private.can_edit_patterns(v_pattern.org_id) then
    raise exception 'Molde não encontrado ou sem permissão para editar.' using errcode = 'insufficient_privilege';
  end if;
  if v_pattern.current_version <> p_expected_version then
    raise exception 'O molde foi alterado por outra pessoa. Recarregue para ver a versão mais nova.'
      using errcode = 'serialization_failure';
  end if;

  insert into public.pattern_versions (org_id, pattern_id, number, document, origin, message, created_by)
  values (v_pattern.org_id, v_pattern.id, v_pattern.current_version + 1, p_document, p_origin,
          nullif(btrim(p_message), ''), auth.uid())
  returning * into v_version;

  update public.patterns set current_version = v_version.number where id = v_pattern.id;

  return v_version;
end;
$$;

revoke all on function public.save_pattern_version(uuid, jsonb, public.pattern_origin, integer, text) from public, anon;
grant execute on function public.save_pattern_version(uuid, jsonb, public.pattern_origin, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Trocar o tamanho base (desmarca o antigo e marca o novo de uma vez)
-- ---------------------------------------------------------------------------

-- security invoker: roda com as permissões de quem chama, então a RLS vale.
create function public.set_base_size(p_size_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_chart uuid;
  v_rows integer;
begin
  select s.size_chart_id into v_chart from public.sizes s where s.id = p_size_id;
  if v_chart is null then
    raise exception 'Tamanho não encontrado.' using errcode = 'no_data_found';
  end if;

  update public.sizes set is_base = false where size_chart_id = v_chart and is_base and id <> p_size_id;
  update public.sizes set is_base = true where id = p_size_id;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Sem permissão para editar esta tabela de medidas.' using errcode = 'insufficient_privilege';
  end if;
end;
$$;

revoke all on function public.set_base_size(uuid) from public, anon;
grant execute on function public.set_base_size(uuid) to authenticated;
