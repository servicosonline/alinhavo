-- Alinhavo · Fase 3 · Ficha técnica: tecidos, aviamentos e fichas versionadas.
--
-- Regras:
--   * Leitura: qualquer membro. Escrita de tecidos, aviamentos e fichas:
--     owner, admin, modelista e estilista (private.can_edit_products).
--   * Medidas em mm (largura do tecido) e g/m² (gramatura); preços em
--     centavos de real (inteiro, sem arredondamento de ponto flutuante).
--   * A ficha é um retrato: guarda os dados já montados (jsonb, formato 1)
--     e a versão do molde de onde saiu. Nunca é alterada; gerar de novo cria
--     a ficha seguinte (create_tech_pack numera 1, 2, 3…).

create table public.fabrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  composition text check (char_length(composition) <= 200),
  width_mm integer check (width_mm between 100 and 5000),
  weight_gsm numeric(7, 1) check (weight_gsm > 0 and weight_gsm < 2000),
  price_cents integer check (price_cents >= 0 and price_cents < 100000000), -- por metro linear
  preset text check (preset in ('malha', 'planoLeve', 'jeans')), -- comportamento na Prova
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, org_id)
);
create index fabrics_org_id_idx on public.fabrics (org_id);

alter table public.products add column fabric_id uuid;
alter table public.products add constraint products_fabric_id_org_id_fkey
  foreign key (fabric_id, org_id) references public.fabrics (id, org_id) on delete set null (fabric_id);

create table public.product_trims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  product_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  quantity numeric(10, 2) not null check (quantity > 0 and quantity < 100000),
  unit text not null check (unit in ('un', 'par', 'm', 'cm')),
  unit_price_cents integer check (unit_price_cents >= 0 and unit_price_cents < 100000000),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (product_id, org_id) references public.products (id, org_id) on delete cascade
);
create index product_trims_org_id_idx on public.product_trims (org_id);
create index product_trims_product_id_idx on public.product_trims (product_id);

create table public.tech_packs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  product_id uuid not null,
  number integer not null check (number >= 1),
  pattern_id uuid,
  pattern_version integer check (pattern_version >= 1),
  data jsonb not null check (
    coalesce(jsonb_typeof(data) = 'object' and data ->> 'schema' = '1' and pg_column_size(data) < 1000000, false)
  ),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (product_id, number),
  foreign key (product_id, org_id) references public.products (id, org_id) on delete cascade,
  foreign key (pattern_id, org_id) references public.patterns (id, org_id) on delete set null (pattern_id)
);
create index tech_packs_org_id_idx on public.tech_packs (org_id);

create trigger tech_packs_imutavel
  before update on public.tech_packs
  for each row execute function private.block_version_update();

create trigger fabrics_updated_at before update on public.fabrics
  for each row execute function private.set_updated_at();
create trigger product_trims_updated_at before update on public.product_trims
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.fabrics enable row level security;
alter table public.product_trims enable row level security;
alter table public.tech_packs enable row level security;

create policy fabrics_select on public.fabrics for select to authenticated using (private.is_org_member(org_id));
create policy fabrics_insert on public.fabrics for insert to authenticated with check (private.can_edit_products(org_id));
create policy fabrics_update on public.fabrics for update to authenticated
  using (private.can_edit_products(org_id)) with check (private.can_edit_products(org_id));
create policy fabrics_delete on public.fabrics for delete to authenticated using (private.can_edit_products(org_id));

create policy product_trims_select on public.product_trims for select to authenticated using (private.is_org_member(org_id));
create policy product_trims_insert on public.product_trims for insert to authenticated with check (private.can_edit_products(org_id));
create policy product_trims_update on public.product_trims for update to authenticated
  using (private.can_edit_products(org_id)) with check (private.can_edit_products(org_id));
create policy product_trims_delete on public.product_trims for delete to authenticated using (private.can_edit_products(org_id));

create policy tech_packs_select on public.tech_packs for select to authenticated using (private.is_org_member(org_id));

revoke insert, update on public.fabrics, public.product_trims from anon, authenticated;
revoke all on public.fabrics, public.product_trims, public.tech_packs from anon;
revoke insert, update, delete on public.tech_packs from authenticated;
grant insert (org_id, name, composition, width_mm, weight_gsm, price_cents, preset) on public.fabrics to authenticated;
grant update (name, composition, width_mm, weight_gsm, price_cents, preset) on public.fabrics to authenticated;
grant insert (org_id, product_id, name, quantity, unit, unit_price_cents, position) on public.product_trims to authenticated;
grant update (name, quantity, unit, unit_price_cents, position) on public.product_trims to authenticated;
grant insert (fabric_id) on public.products to authenticated;
grant update (fabric_id) on public.products to authenticated;

-- ---------------------------------------------------------------------------
-- Gerar ficha (numera e grava; os dados vêm montados pelo app)
-- ---------------------------------------------------------------------------

create function public.create_tech_pack(p_product_id uuid, p_pattern_version integer, p_data jsonb)
returns public.tech_packs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_pack public.tech_packs;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_product from public.products p where p.id = p_product_id for update;
  if v_product.id is null or not private.can_edit_products(v_product.org_id) then
    raise exception 'Produto não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if v_product.pattern_id is null then
    raise exception 'Ligue um molde ao produto antes de gerar a ficha.' using errcode = 'invalid_parameter_value';
  end if;
  if not exists (
    select 1 from public.pattern_versions v where v.pattern_id = v_product.pattern_id and v.number = p_pattern_version
  ) then
    raise exception 'Essa versão do molde não existe.' using errcode = 'invalid_parameter_value';
  end if;

  insert into public.tech_packs (org_id, product_id, number, pattern_id, pattern_version, data, created_by)
  values (
    v_product.org_id,
    v_product.id,
    coalesce((select max(t.number) from public.tech_packs t where t.product_id = v_product.id), 0) + 1,
    v_product.pattern_id,
    p_pattern_version,
    p_data,
    auth.uid()
  )
  returning * into v_pack;
  return v_pack;
end;
$$;

revoke all on function public.create_tech_pack(uuid, integer, jsonb) from public, anon;
grant execute on function public.create_tech_pack(uuid, integer, jsonb) to authenticated;
