-- Alinhavo · Fase 6c-2 · Webhooks (avisos para o ERP quando algo muda).
--
-- Regras:
--   * Dono e admin cadastram endpoints (URL https e eventos). O segredo de
--     assinatura (whsec_ + 64 hex) aparece uma vez, na criação, e não é
--     legível depois por ninguém pelo app (grant só das colunas da tela). O
--     envio precisa dele: só a Edge Function webhooks-dispatch o lê, pela
--     chave de serviço.
--   * Gatilhos põem os eventos na fila (webhook_deliveries), uma linha por
--     endpoint ativo inscrito: produto.aprovado (status muda para aprovado),
--     ficha.gerada (ficha técnica nova), risco.salvo (risco novo). O painel
--     ainda manda "teste". Ninguém escreve na fila direto.
--   * A Edge Function pega (claim_webhook_deliveries, com prazo de 2 min) e
--     encerra (finish_webhook_delivery): deu certo, entregue; deu errado,
--     volta para a fila em 1 min, 5 min, 30 min, 2 h e 12 h; na 6ª falha,
--     "falhou". As duas funções são só da chave de serviço.
--   * URL: só https, por nome, sem localhost nem nome interno (a Edge
--     Function confere de novo antes de enviar, com os IPs do nome).

create type public.webhook_status as enum ('pendente', 'enviando', 'entregue', 'falhou');

-- URL aceita para webhook: https, por nome (IP literal não), sem localhost,
-- nome interno nem nome sem ponto. A Edge Function confere também os IPs que
-- o nome resolve.
create function private.webhook_url_ok(p_url text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    char_length(p_url) <= 500
    and p_url ~ '^https://[^/?#@\s\[\]]+(/[^\s]*)?$'
    and lower(substring(p_url from '^https://([^/:?#]+)')) !~ '^([0-9.]+|localhost|.*\.localhost|.*\.internal|.*\.local)$'
    and lower(substring(p_url from '^https://([^/:?#]+)')) ~ '\.',
    false
  )
$$;

create function private.webhook_events()
returns text[]
language sql
immutable
set search_path = ''
as $$ select array['produto.aprovado', 'ficha.gerada', 'risco.salvo'] $$;

create table public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  url text not null check (private.webhook_url_ok(url)),
  secret text not null check (secret ~ '^whsec_[0-9a-f]{64}$'),
  events text[] not null check (cardinality(events) >= 1 and events <@ private.webhook_events()),
  active boolean not null default true,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, org_id)
);
create index webhook_endpoints_org_id_idx on public.webhook_endpoints (org_id);

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  endpoint_id uuid not null,
  event text not null check (event = any (private.webhook_events()) or event = 'teste'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 200000),
  status public.webhook_status not null default 'pendente',
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  last_status_code integer,
  last_error text check (char_length(last_error) <= 300),
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  foreign key (endpoint_id, org_id) references public.webhook_endpoints (id, org_id) on delete cascade
);
create index webhook_deliveries_fila_idx on public.webhook_deliveries (status, next_attempt_at);
create index webhook_deliveries_endpoint_idx on public.webhook_deliveries (endpoint_id, created_at desc);

alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;

create policy webhook_endpoints_select on public.webhook_endpoints for select to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));
create policy webhook_deliveries_select on public.webhook_deliveries for select to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

revoke all on public.webhook_endpoints, public.webhook_deliveries from anon, authenticated;
-- O segredo nunca sai pelo app.
grant select (id, org_id, url, events, active, created_by, created_at) on public.webhook_endpoints to authenticated;
grant select (id, org_id, endpoint_id, event, status, attempts, next_attempt_at, last_status_code, last_error, created_at, delivered_at)
  on public.webhook_deliveries to authenticated;

-- ---------------------------------------------------------------------------
-- Cadastro (dono e admin)
-- ---------------------------------------------------------------------------

create function public.create_webhook_endpoint(p_org_id uuid, p_url text, p_events text[])
returns table (id uuid, secret text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_id uuid;
  v_url text := btrim(coalesce(p_url, ''));
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  if not private.has_org_role(p_org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'Só donos e admins cadastram webhooks.' using errcode = 'insufficient_privilege';
  end if;
  if not private.webhook_url_ok(v_url) then
    raise exception 'A URL precisa começar com https:// e ser um endereço público, por nome (sem localhost nem IP).'
      using errcode = 'invalid_parameter_value';
  end if;
  if p_events is null or cardinality(p_events) = 0 or not (p_events <@ private.webhook_events()) then
    raise exception 'Escolha pelo menos um evento.' using errcode = 'invalid_parameter_value';
  end if;
  if (select count(*) from public.webhook_endpoints e where e.org_id = p_org_id) >= 5 then
    raise exception 'A organização já tem 5 webhooks. Apague um antes.' using errcode = 'invalid_parameter_value';
  end if;
  v_secret := 'whsec_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.webhook_endpoints (org_id, url, secret, events)
  values (p_org_id, v_url, v_secret, (select array_agg(distinct x order by x) from unnest(p_events) x))
  returning webhook_endpoints.id into v_id;
  return query select v_id, v_secret;
end;
$$;

-- O endpoint, se quem chama é dono ou admin da organização dele.
create function private.own_webhook_endpoint(p_id uuid)
returns public.webhook_endpoints
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ep public.webhook_endpoints;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_ep from public.webhook_endpoints e where e.id = p_id;
  if v_ep.id is null or not private.has_org_role(v_ep.org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'Webhook não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  return v_ep;
end;
$$;

revoke all on function private.own_webhook_endpoint(uuid) from public, anon, authenticated;

create function public.set_webhook_endpoint_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.own_webhook_endpoint(p_id);
  update public.webhook_endpoints set active = coalesce(p_active, false) where id = p_id;
end;
$$;

create function public.delete_webhook_endpoint(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.own_webhook_endpoint(p_id);
  delete from public.webhook_endpoints where id = p_id;
end;
$$;

-- Manda um evento "teste" para o endpoint (mesmo desligado: é para conferir a integração).
create function public.send_test_webhook(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ep public.webhook_endpoints := private.own_webhook_endpoint(p_id);
  v_id uuid;
begin
  insert into public.webhook_deliveries (org_id, endpoint_id, event, payload)
  values (v_ep.org_id, v_ep.id, 'teste', jsonb_build_object('mensagem', 'Teste do webhook do Alinhavo.'))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_webhook_endpoint(uuid, text, text[]) from public, anon;
revoke all on function public.set_webhook_endpoint_active(uuid, boolean) from public, anon;
revoke all on function public.delete_webhook_endpoint(uuid) from public, anon;
revoke all on function public.send_test_webhook(uuid) from public, anon;
grant execute on function public.create_webhook_endpoint(uuid, text, text[]) to authenticated;
grant execute on function public.set_webhook_endpoint_active(uuid, boolean) to authenticated;
grant execute on function public.delete_webhook_endpoint(uuid) to authenticated;
grant execute on function public.send_test_webhook(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Eventos (gatilhos)
-- ---------------------------------------------------------------------------

-- Põe o evento na fila de cada endpoint ativo inscrito nele.
create function private.enqueue_webhook(p_org_id uuid, p_event text, p_payload jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.webhook_deliveries (org_id, endpoint_id, event, payload)
  select e.org_id, e.id, p_event, p_payload
  from public.webhook_endpoints e
  where e.org_id = p_org_id and e.active and p_event = any (e.events)
$$;

revoke all on function private.enqueue_webhook(uuid, text, jsonb) from public, anon, authenticated;

create function private.tg_webhook_produto_aprovado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'aprovado' and old.status is distinct from 'aprovado' then
    perform private.enqueue_webhook(new.org_id, 'produto.aprovado', jsonb_build_object('produto', private.api_product_json(new)));
  end if;
  return null;
end;
$$;

create function private.tg_webhook_ficha_gerada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.enqueue_webhook(
    new.org_id,
    'ficha.gerada',
    jsonb_build_object('produto_id', new.product_id, 'numero', new.number, 'versao_molde', new.pattern_version, 'gerada_em', new.created_at)
  );
  return null;
end;
$$;

create function private.tg_webhook_risco_salvo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.enqueue_webhook(
    new.org_id,
    'risco.salvo',
    jsonb_build_object(
      'produto_id', new.product_id, 'numero', new.number, 'versao_molde', new.pattern_version, 'largura_mm', new.width_mm,
      'comprimento_mm', new.length_mm, 'aproveitamento', new.efficiency, 'demanda', new.demand, 'criado_em', new.created_at
    )
  );
  return null;
end;
$$;

create trigger products_webhook_aprovado after update of status on public.products
  for each row execute function private.tg_webhook_produto_aprovado();
create trigger tech_packs_webhook after insert on public.tech_packs
  for each row execute function private.tg_webhook_ficha_gerada();
create trigger markers_webhook after insert on public.markers
  for each row execute function private.tg_webhook_risco_salvo();

-- ---------------------------------------------------------------------------
-- Envio (só a Edge Function, com a chave de serviço)
-- ---------------------------------------------------------------------------

-- Pega até p_limit entregas vencidas (ou presas há mais de 2 min) e as marca como "enviando".
create function public.claim_webhook_deliveries(p_limit integer default 20)
returns table (id uuid, url text, secret text, event text, payload jsonb, attempt integer, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with picked as (
    select d.id from public.webhook_deliveries d
    join public.webhook_endpoints e on e.id = d.endpoint_id
    where (d.status = 'pendente' and d.next_attempt_at <= now())
       or (d.status = 'enviando' and d.locked_until < now())
    order by d.next_attempt_at
    limit least(greatest(coalesce(p_limit, 20), 1), 100)
    for update of d skip locked
  ),
  upd as (
    update public.webhook_deliveries d
    set status = 'enviando', attempts = d.attempts + 1, locked_until = now() + interval '2 minutes'
    from picked
    where d.id = picked.id
    returning d.id, d.endpoint_id, d.event, d.payload, d.attempts, d.created_at
  )
  select upd.id, e.url, e.secret, upd.event, upd.payload, upd.attempts, upd.created_at
  from upd join public.webhook_endpoints e on e.id = upd.endpoint_id;
end;
$$;

-- Espera antes da tentativa seguinte, pela tentativa que falhou (1 a 5).
create function private.webhook_backoff(p_attempt integer)
returns interval
language sql
immutable
set search_path = ''
as $$
  select (array[interval '1 minute', interval '5 minutes', interval '30 minutes', interval '2 hours', interval '12 hours'])[least(greatest(p_attempt, 1), 5)]
$$;

create function public.finish_webhook_delivery(p_id uuid, p_ok boolean, p_status_code integer default null, p_error text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  select attempts into v_attempts from public.webhook_deliveries where id = p_id and status = 'enviando' for update;
  if v_attempts is null then
    return; -- já encerrada (ou o prazo venceu e outro pegou): nada a fazer
  end if;
  update public.webhook_deliveries
  set status = case when p_ok then 'entregue' when v_attempts >= 6 then 'falhou' else 'pendente' end::public.webhook_status,
      delivered_at = case when p_ok then now() end,
      next_attempt_at = case when p_ok or v_attempts >= 6 then next_attempt_at else now() + private.webhook_backoff(v_attempts) end,
      locked_until = null,
      last_status_code = p_status_code,
      last_error = left(p_error, 300)
  where id = p_id;
end;
$$;

revoke all on function public.claim_webhook_deliveries(integer) from public, anon, authenticated;
revoke all on function public.finish_webhook_delivery(uuid, boolean, integer, text) from public, anon, authenticated;
grant execute on function public.claim_webhook_deliveries(integer) to service_role;
grant execute on function public.finish_webhook_delivery(uuid, boolean, integer, text) to service_role;
