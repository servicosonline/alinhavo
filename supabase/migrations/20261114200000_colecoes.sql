-- Alinhavo · Fase 3 · Coleções, produtos e cronograma.
--
-- Regras:
--   * Leitura: qualquer membro da organização.
--   * Escrita: owner, admin, modelista e estilista (private.can_edit_products).
--     Moldes continuam só com owner, admin e modelista.
--   * Vínculos carregam org_id (FK composta): um produto não aponta para a
--     coleção, a tabela de medidas ou o molde de outra organização.
--   * Um produto tem no máximo um molde, e um molde está em no máximo um
--     produto. O vínculo mora no produto (products.pattern_id): quem edita o
--     produto liga o molde sem precisar poder editar o molde.
--   * Responsável por uma etapa precisa ser membro da organização.

create function private.can_edit_products(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_org_role(p_org_id, array['owner', 'admin', 'modelista', 'estilista']::public.org_role[]);
$$;

revoke all on function private.can_edit_products(uuid) from public;
grant execute on function private.can_edit_products(uuid) to authenticated;

-- Para checar o responsável da etapa (a política não enxerga org_members de outros).
create function private.is_member(p_org_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.org_members m where m.org_id = p_org_id and m.user_id = p_user_id);
$$;

revoke all on function private.is_member(uuid, uuid) from public;
grant execute on function private.is_member(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  season text check (char_length(season) <= 60),
  starts_on date,
  launch_on date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  check (starts_on is null or launch_on is null or launch_on >= starts_on)
);
create index collections_org_id_idx on public.collections (org_id);

create type public.product_status as enum ('ideia', 'modelagem', 'prova', 'aprovado', 'producao');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  collection_id uuid,
  reference text check (char_length(btrim(reference)) between 1 and 40),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  status public.product_status not null default 'ideia',
  size_chart_id uuid,
  pattern_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id),
  foreign key (collection_id, org_id) references public.collections (id, org_id) on delete set null (collection_id),
  foreign key (size_chart_id, org_id) references public.size_charts (id, org_id) on delete set null (size_chart_id),
  foreign key (pattern_id, org_id) references public.patterns (id, org_id) on delete set null (pattern_id)
);
create index products_org_id_idx on public.products (org_id);
create index products_collection_id_idx on public.products (collection_id);
-- Referência única na organização (quando preenchida) e um molde por produto.
create unique index products_reference_unica on public.products (org_id, lower(reference)) where reference is not null;
create unique index products_um_produto_por_molde on public.products (pattern_id) where pattern_id is not null;

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  collection_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  due_on date not null,
  assignee uuid references auth.users (id) on delete set null,
  done_at timestamptz,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (collection_id, org_id) references public.collections (id, org_id) on delete cascade
);
create index milestones_org_id_idx on public.milestones (org_id);
create index milestones_collection_id_idx on public.milestones (collection_id);

create trigger collections_updated_at before update on public.collections
  for each row execute function private.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function private.set_updated_at();
create trigger milestones_updated_at before update on public.milestones
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.milestones enable row level security;

create policy collections_select on public.collections for select to authenticated using (private.is_org_member(org_id));
create policy collections_insert on public.collections for insert to authenticated with check (private.can_edit_products(org_id));
create policy collections_update on public.collections for update to authenticated
  using (private.can_edit_products(org_id)) with check (private.can_edit_products(org_id));
create policy collections_delete on public.collections for delete to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

create policy products_select on public.products for select to authenticated using (private.is_org_member(org_id));
create policy products_insert on public.products for insert to authenticated with check (private.can_edit_products(org_id));
create policy products_update on public.products for update to authenticated
  using (private.can_edit_products(org_id)) with check (private.can_edit_products(org_id));
create policy products_delete on public.products for delete to authenticated using (private.can_edit_products(org_id));

create policy milestones_select on public.milestones for select to authenticated using (private.is_org_member(org_id));
create policy milestones_insert on public.milestones for insert to authenticated
  with check (private.can_edit_products(org_id) and (assignee is null or private.is_member(org_id, assignee)));
create policy milestones_update on public.milestones for update to authenticated
  using (private.can_edit_products(org_id))
  with check (private.can_edit_products(org_id) and (assignee is null or private.is_member(org_id, assignee)));
create policy milestones_delete on public.milestones for delete to authenticated using (private.can_edit_products(org_id));

-- Colunas que o cliente pode escrever. org_id não muda depois de criado.
revoke insert, update on public.collections, public.products, public.milestones from anon, authenticated;
revoke all on public.collections, public.products, public.milestones from anon;
grant insert (org_id, name, season, starts_on, launch_on) on public.collections to authenticated;
grant update (name, season, starts_on, launch_on, archived_at) on public.collections to authenticated;
grant insert (org_id, collection_id, reference, name, status, size_chart_id, pattern_id) on public.products to authenticated;
grant update (collection_id, reference, name, status, size_chart_id, pattern_id) on public.products to authenticated;
grant insert (org_id, collection_id, title, due_on, assignee, done_at, position) on public.milestones to authenticated;
grant update (title, due_on, assignee, done_at, position) on public.milestones to authenticated;
