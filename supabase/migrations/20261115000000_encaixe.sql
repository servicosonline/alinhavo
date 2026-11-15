-- Alinhavo · Fase 4 · Encaixe: riscos (markers) salvos por produto.
--
-- Regras:
--   * Leitura: qualquer membro. Criar e apagar: owner, admin, modelista e
--     estilista (private.can_edit_products), como a ficha técnica.
--   * O risco é um retrato: aponta para uma versão fixa do molde e guarda o
--     layout já montado (jsonb, formato 1: peças com contorno e posições).
--     Nunca é alterado; encaixar de novo cria o risco seguinte
--     (create_marker numera 1, 2, 3…).
--   * O encaixe é calculado no navegador (Web Worker). O app confere as
--     posições contra o molde antes de gravar; o banco confere a forma.
--   * Medidas em mm; aproveitamento de 0 a 1.

create table public.markers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  product_id uuid not null,
  number integer not null check (number >= 1),
  pattern_id uuid,
  pattern_version integer not null check (pattern_version >= 1),
  fabric_id uuid,
  width_mm integer not null check (width_mm between 100 and 5000),
  -- tamanho → quantidade de peças prontas
  demand jsonb not null check (coalesce(jsonb_typeof(demand) = 'object' and demand <> '{}'::jsonb, false)),
  length_mm numeric(10, 1) not null check (length_mm > 0 and length_mm < 1000000),
  efficiency numeric(6, 5) not null check (efficiency > 0 and efficiency <= 1),
  layout jsonb not null check (
    coalesce(jsonb_typeof(layout) = 'object' and layout ->> 'schema' = '1' and pg_column_size(layout) < 2000000, false)
  ),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (product_id, number),
  foreign key (product_id, org_id) references public.products (id, org_id) on delete cascade,
  foreign key (pattern_id, org_id) references public.patterns (id, org_id) on delete set null (pattern_id),
  foreign key (fabric_id, org_id) references public.fabrics (id, org_id) on delete set null (fabric_id)
);
create index markers_org_id_idx on public.markers (org_id);
create index markers_product_id_idx on public.markers (product_id);

create trigger markers_imutavel
  before update on public.markers
  for each row execute function private.block_version_update();

alter table public.markers enable row level security;

create policy markers_select on public.markers for select to authenticated using (private.is_org_member(org_id));
create policy markers_delete on public.markers for delete to authenticated using (private.can_edit_products(org_id));

revoke all on public.markers from anon;
revoke insert, update on public.markers from authenticated;
grant select, delete on public.markers to authenticated;

-- ---------------------------------------------------------------------------
-- Salvar risco (numera e grava; o layout vem montado e conferido pelo app)
-- ---------------------------------------------------------------------------

create function public.create_marker(
  p_product_id uuid,
  p_pattern_version integer,
  p_fabric_id uuid,
  p_width_mm integer,
  p_demand jsonb,
  p_length_mm numeric,
  p_efficiency numeric,
  p_layout jsonb
)
returns public.markers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_marker public.markers;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_product from public.products p where p.id = p_product_id for update;
  if v_product.id is null or not private.can_edit_products(v_product.org_id) then
    raise exception 'Produto não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if v_product.pattern_id is null then
    raise exception 'Ligue um molde ao produto antes de encaixar.' using errcode = 'invalid_parameter_value';
  end if;
  if not exists (
    select 1 from public.pattern_versions v where v.pattern_id = v_product.pattern_id and v.number = p_pattern_version
  ) then
    raise exception 'Essa versão do molde não existe.' using errcode = 'invalid_parameter_value';
  end if;
  if p_fabric_id is not null and not exists (
    select 1 from public.fabrics f where f.id = p_fabric_id and f.org_id = v_product.org_id
  ) then
    raise exception 'Tecido não encontrado.' using errcode = 'invalid_parameter_value';
  end if;

  insert into public.markers (
    org_id, product_id, number, pattern_id, pattern_version, fabric_id,
    width_mm, demand, length_mm, efficiency, layout, created_by
  )
  values (
    v_product.org_id,
    v_product.id,
    coalesce((select max(m.number) from public.markers m where m.product_id = v_product.id), 0) + 1,
    v_product.pattern_id,
    p_pattern_version,
    p_fabric_id,
    p_width_mm,
    p_demand,
    p_length_mm,
    p_efficiency,
    p_layout,
    auth.uid()
  )
  returning * into v_marker;
  return v_marker;
end;
$$;

revoke all on function public.create_marker(uuid, integer, uuid, integer, jsonb, numeric, numeric, jsonb) from public, anon;
grant execute on function public.create_marker(uuid, integer, uuid, integer, jsonb, numeric, numeric, jsonb) to authenticated;
