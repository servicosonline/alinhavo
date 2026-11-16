-- Alinhavo · Uso de IA por cliente no superadmin e limite ajustável por organização.
--
-- Regras:
--   * ai_limit_overrides: limite do mês de um tipo (textos_produto, foto_catalogo) para uma organização.
--     Sem linha, vale o padrão (private.ai_kind_limit). Só o dono da plataforma muda
--     (platform_set_ai_limit, vai para a auditoria); ninguém lê a tabela direto.
--   * reserve_ai_generation passa a conferir o limite da organização (private.ai_org_limit).
--   * ai_limit_for(org, tipo): o limite que vale, para a tela mostrar "X de Y" (membros).
--   * platform_ai_usage(org): uso do mês por organização e tipo, com erros, quanto foi pelo Claude e quanto
--     pela OpenAI (reserva) e os tokens. O provedor sai do nome do modelo gravado em ai_generations.model.

create table public.ai_limit_overrides (
  org_id uuid not null references public.orgs (id) on delete cascade,
  kind text not null check (kind in ('textos_produto', 'foto_catalogo')),
  monthly_limit integer not null check (monthly_limit between 0 and 10000),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (org_id, kind)
);

alter table public.ai_limit_overrides enable row level security;
revoke all on public.ai_limit_overrides from anon, authenticated;

create function private.ai_org_limit(p_org_id uuid, p_kind text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select o.monthly_limit from public.ai_limit_overrides o where o.org_id = p_org_id and o.kind = p_kind),
    private.ai_kind_limit(p_kind)
  )
$$;

revoke all on function private.ai_org_limit(uuid, text) from public, anon, authenticated;

create function public.ai_limit_for(p_org_id uuid, p_kind text default 'textos_produto')
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case when private.is_org_member(p_org_id) then private.ai_org_limit(p_org_id, p_kind) end
$$;

revoke all on function public.ai_limit_for(uuid, text) from public, anon;
grant execute on function public.ai_limit_for(uuid, text) to authenticated;

-- A mesma de 20261115070000, com o limite da organização no lugar do padrão.
create or replace function public.reserve_ai_generation(p_product_id uuid, p_kind text default 'textos_produto')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_used integer;
  v_limit integer;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_product from public.products p where p.id = p_product_id;
  if v_product.id is null or not private.can_edit_products(v_product.org_id) then
    raise exception 'Produto não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if p_kind is null or p_kind not in ('textos_produto', 'foto_catalogo') then
    raise exception 'Tipo de geração desconhecido.' using errcode = 'invalid_parameter_value';
  end if;
  v_limit := private.ai_org_limit(v_product.org_id, p_kind);
  -- Trava por organização: dois pedidos ao mesmo tempo não passam juntos do limite.
  perform pg_advisory_xact_lock(hashtext('ai_generations:' || v_product.org_id::text));
  select count(*) into v_used from public.ai_generations g
  where g.org_id = v_product.org_id
    and g.kind = p_kind
    and g.status <> 'erro'
    and g.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  if v_used >= v_limit then
    if p_kind = 'foto_catalogo' then
      raise exception 'A organização usou as % fotos de catálogo por IA deste mês. O limite volta no dia 1.', v_limit
        using errcode = 'program_limit_exceeded';
    end if;
    raise exception 'A organização usou as % gerações por IA deste mês. O limite volta no dia 1.', v_limit
      using errcode = 'program_limit_exceeded';
  end if;
  insert into public.ai_generations (org_id, product_id, kind) values (v_product.org_id, v_product.id, p_kind)
  returning id into v_id;
  return v_id;
end;
$$;

-- Só o dono da plataforma: limite maior custa dinheiro. Null volta ao padrão.
create function public.platform_set_ai_limit(p_org_id uuid, p_kind text, p_limit integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_platform(true);
  if p_kind is null or p_kind not in ('textos_produto', 'foto_catalogo') then
    raise exception 'Tipo de geração desconhecido.' using errcode = 'invalid_parameter_value';
  end if;
  if not exists (select 1 from public.orgs o where o.id = p_org_id) then
    raise exception 'Cliente não encontrado.' using errcode = 'invalid_parameter_value';
  end if;
  if p_limit is null then
    delete from public.ai_limit_overrides where org_id = p_org_id and kind = p_kind;
  elsif p_limit < 0 or p_limit > 10000 then
    raise exception 'Escolha um limite de 0 a 10.000 por mês.' using errcode = 'invalid_parameter_value';
  else
    insert into public.ai_limit_overrides (org_id, kind, monthly_limit) values (p_org_id, p_kind, p_limit)
    on conflict (org_id, kind) do update set monthly_limit = excluded.monthly_limit, updated_by = auth.uid(), updated_at = now();
  end if;
  perform private.platform_log('limite_ia_mudou', p_org_id, null, jsonb_build_object('tipo', p_kind, 'limite', p_limit));
end;
$$;

revoke all on function public.platform_set_ai_limit(uuid, text, integer) from public, anon;
grant execute on function public.platform_set_ai_limit(uuid, text, integer) to authenticated;

-- Uso do mês (UTC, como o limite). Sem p_org_id: as organizações com uso no mês ou limite próprio.
create function public.platform_ai_usage(p_org_id uuid default null)
returns table (
  org_id uuid, org_name text, kind text, used integer, monthly_limit integer, custom_limit boolean,
  errors integer, by_claude integer, by_openai integer, input_tokens bigint, output_tokens bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform();
  return query
  with pares as (
    select g.org_id, g.kind from public.ai_generations g
    where g.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'
    union
    select l.org_id, l.kind from public.ai_limit_overrides l
    union
    select o.id, k.kind from public.orgs o cross join (values ('textos_produto'), ('foto_catalogo')) k (kind) where o.id = p_org_id
  )
  select p.org_id, o.name, p.kind,
    count(g.id) filter (where g.status <> 'erro')::integer,
    private.ai_org_limit(p.org_id, p.kind),
    exists (select 1 from public.ai_limit_overrides l where l.org_id = p.org_id and l.kind = p.kind),
    count(g.id) filter (where g.status = 'erro')::integer,
    count(g.id) filter (where g.status = 'pronta' and g.model ilike '%claude%')::integer,
    count(g.id) filter (where g.status = 'pronta' and g.model is not null and g.model not ilike '%claude%')::integer,
    coalesce(sum(g.input_tokens), 0)::bigint,
    coalesce(sum(g.output_tokens), 0)::bigint
  from pares p
  join public.orgs o on o.id = p.org_id
  left join public.ai_generations g on g.org_id = p.org_id and g.kind = p.kind
    and g.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'
  where p_org_id is null or p.org_id = p_org_id
  group by p.org_id, o.name, p.kind
  order by count(g.id) desc, o.name;
end;
$$;

revoke all on function public.platform_ai_usage(uuid) from public, anon;
grant execute on function public.platform_ai_usage(uuid) to authenticated;
