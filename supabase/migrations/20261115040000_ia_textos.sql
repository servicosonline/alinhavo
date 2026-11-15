-- Alinhavo · Fase 6a · Textos do produto gerados por IA.
--
-- Regras:
--   * O produto ganha dois textos: o de venda (descrição para loja e catálogo)
--     e o técnico (composição, construção, acabamentos e cuidados), que entra
--     na ficha técnica seguinte. A pessoa edita e salva; a IA só sugere.
--   * Quem edita produtos (owner, admin, modelista, estilista) edita os textos
--     e pede a geração. Todo membro lê.
--   * Cada pedido à IA fica registrado em ai_generations: reserve_ai_generation
--     antes da chamada (confere a permissão e o limite do mês) e
--     finish_ai_generation depois (tokens, modelo, se deu certo). Ninguém
--     escreve na tabela direto. Pedido que falhou não conta no limite.
--   * Limite: AI_MONTHLY_LIMIT gerações por organização por mês (UTC).

alter table public.products
  add column sales_description text check (char_length(sales_description) <= 2000),
  add column technical_description text check (char_length(technical_description) <= 4000);

grant update (sales_description, technical_description) on public.products to authenticated;

create type public.ai_generation_status as enum ('reservada', 'pronta', 'erro');

create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  product_id uuid not null,
  kind text not null check (kind in ('textos_produto')),
  status public.ai_generation_status not null default 'reservada',
  model text check (char_length(model) <= 80),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  foreign key (product_id, org_id) references public.products (id, org_id) on delete cascade
);
create index ai_generations_org_month_idx on public.ai_generations (org_id, created_at);

alter table public.ai_generations enable row level security;
create policy ai_generations_select on public.ai_generations for select to authenticated
  using (private.is_org_member(org_id));
revoke insert, update, delete on public.ai_generations from anon, authenticated;
revoke all on public.ai_generations from anon;

-- Quantas gerações uma organização pode pedir por mês (as que falharam não contam).
create function private.ai_monthly_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 200 $$;

-- Gerações que contam no mês corrente (UTC) da organização.
create function public.ai_generations_this_month(p_org_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.ai_generations g
  where g.org_id = p_org_id
    and g.status <> 'erro'
    and g.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'
    and private.is_org_member(p_org_id)
$$;

revoke all on function public.ai_generations_this_month(uuid) from public, anon;
grant execute on function public.ai_generations_this_month(uuid) to authenticated;

-- Antes de chamar a IA: confere a permissão e o limite e registra o pedido.
create function public.reserve_ai_generation(p_product_id uuid, p_kind text default 'textos_produto')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_used integer;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_product from public.products p where p.id = p_product_id;
  if v_product.id is null or not private.can_edit_products(v_product.org_id) then
    raise exception 'Produto não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if p_kind is distinct from 'textos_produto' then
    raise exception 'Tipo de geração desconhecido.' using errcode = 'invalid_parameter_value';
  end if;
  -- Trava por organização: dois pedidos ao mesmo tempo não passam juntos do limite.
  perform pg_advisory_xact_lock(hashtext('ai_generations:' || v_product.org_id::text));
  select count(*) into v_used from public.ai_generations g
  where g.org_id = v_product.org_id
    and g.status <> 'erro'
    and g.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  if v_used >= private.ai_monthly_limit() then
    raise exception 'A organização usou as % gerações por IA deste mês. O limite volta no dia 1.', private.ai_monthly_limit()
      using errcode = 'program_limit_exceeded';
  end if;
  insert into public.ai_generations (org_id, product_id, kind) values (v_product.org_id, v_product.id, p_kind)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.reserve_ai_generation(uuid, text) from public, anon;
grant execute on function public.reserve_ai_generation(uuid, text) to authenticated;

-- Depois da chamada: marca o resultado. Só quem reservou, e só uma vez.
create function public.finish_ai_generation(
  p_id uuid,
  p_ok boolean,
  p_model text default null,
  p_input_tokens integer default null,
  p_output_tokens integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  update public.ai_generations g
  set status = case when p_ok then 'pronta'::public.ai_generation_status else 'erro'::public.ai_generation_status end,
      model = left(p_model, 80),
      input_tokens = greatest(0, p_input_tokens),
      output_tokens = greatest(0, p_output_tokens),
      finished_at = now()
  where g.id = p_id and g.created_by = auth.uid() and g.status = 'reservada';
  if not found then
    raise exception 'Geração não encontrada ou já encerrada.' using errcode = 'invalid_parameter_value';
  end if;
end;
$$;

revoke all on function public.finish_ai_generation(uuid, boolean, text, integer, integer) from public, anon;
grant execute on function public.finish_ai_generation(uuid, boolean, text, integer, integer) to authenticated;
