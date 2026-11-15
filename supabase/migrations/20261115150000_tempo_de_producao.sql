-- Tempo de produção: quanto tempo o produto fica em cada estágio
-- (ideia → modelagem → prova → aprovado → produção) e da ideia à produção.
--
--   * product_status_events: cada vez que o produto entra num estágio. Só o
--     banco escreve (gatilho em products); todo membro lê.
--   * platform_admins: superadmin da plataforma (vê todas as organizações).
--     Ninguém entra pelo app: só por SQL no Supabase (docs/07-deploy.md).
--   * production_stage_times(org): médias e medianas. Dono da organização vê
--     a dele; superadmin vê qualquer uma, ou todas juntas (org nula).
--   * platform_orgs(): lista das organizações, só para o superadmin.
--
-- Produtos que já existiam ganham um evento "backfilled" com o estágio atual:
-- não se sabe desde quando estão nele, então nada que comece nesse evento
-- entra nas contas (a medição começa na próxima troca).

-- ---------------------------------------------------------------------------
-- Superadmin
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;
revoke all on function private.is_platform_admin() from public;
grant execute on function private.is_platform_admin() to authenticated;

-- A tela pergunta se mostra a área do superadmin.
create function public.am_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin();
$$;
revoke all on function public.am_platform_admin() from public, anon;
grant execute on function public.am_platform_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Histórico de estágios
-- ---------------------------------------------------------------------------

create table public.product_status_events (
  id bigint generated always as identity primary key,
  org_id uuid not null,
  product_id uuid not null,
  status public.product_status not null,
  entered_at timestamptz not null default now(),
  -- Criado na migração para produto que já existia: o início é desconhecido.
  backfilled boolean not null default false,
  foreign key (product_id, org_id) references public.products (id, org_id) on delete cascade
);
create index product_status_events_org_id_idx on public.product_status_events (org_id);
create index product_status_events_product_idx on public.product_status_events (product_id, entered_at);

alter table public.product_status_events enable row level security;
create policy product_status_events_select on public.product_status_events for select to authenticated
  using (private.is_org_member(org_id));
revoke all on public.product_status_events from anon;
revoke insert, update, delete on public.product_status_events from authenticated;

create function private.tg_product_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.product_status_events (org_id, product_id, status) values (new.org_id, new.id, new.status);
  end if;
  return null;
end;
$$;

create trigger products_status_event after insert or update of status on public.products
  for each row execute function private.tg_product_status_event();

insert into public.product_status_events (org_id, product_id, status, entered_at, backfilled)
  select p.org_id, p.id, p.status, now(), true from public.products p;

-- ---------------------------------------------------------------------------
-- Médias
-- ---------------------------------------------------------------------------

-- Uma linha por estágio, na ordem do fluxo, e a linha 'total' (da entrada no
-- primeiro estágio até chegar à produção). Tempos em segundos.
--   done_*: passagens já encerradas (entrou e saiu);
--   current_*: produtos parados no estágio agora, e há quanto tempo.
create function public.production_stage_times(p_org_id uuid)
returns table (
  stage text,
  done_count integer,
  done_avg_seconds double precision,
  done_median_seconds double precision,
  current_count integer,
  current_avg_seconds double precision
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or not (
       private.is_platform_admin()
       or (p_org_id is not null and private.has_org_role(p_org_id, array['owner']::public.org_role[]))
     ) then
    raise exception 'Só o dono da organização vê o tempo de produção.' using errcode = 'insufficient_privilege';
  end if;

  return query
  with ev as (
    select
      e.product_id,
      e.status,
      e.entered_at,
      e.backfilled,
      lead(e.entered_at) over (partition by e.product_id order by e.entered_at, e.id) as left_at
    from public.product_status_events e
    where p_org_id is null or e.org_id = p_org_id
  ),
  stays as (
    select
      ev.status::text as stage,
      ev.left_at is null as open,
      extract(epoch from (coalesce(ev.left_at, now()) - ev.entered_at))::double precision as secs
    from ev
    where not ev.backfilled
  ),
  per_product as (
    select
      ev.product_id,
      bool_or(ev.backfilled) as unknown_start,
      min(ev.entered_at) as started,
      min(ev.entered_at) filter (where ev.status = 'producao') as produced
    from ev
    group by ev.product_id
  ),
  lead_times as (
    select
      pp.produced is null as open,
      extract(epoch from (coalesce(pp.produced, now()) - pp.started))::double precision as secs
    from per_product pp
    where not pp.unknown_start
  ),
  stages as (
    select s.status::text as stage, s.ord from unnest(enum_range(null::public.product_status)) with ordinality as s(status, ord)
  )
  select
    st.stage,
    count(*) filter (where not s.open)::integer,
    avg(s.secs) filter (where not s.open),
    (percentile_cont(0.5) within group (order by s.secs) filter (where not s.open))::double precision,
    count(*) filter (where s.open)::integer,
    avg(s.secs) filter (where s.open)
  from stages st
  left join stays s on s.stage = st.stage
  group by st.stage, st.ord
  union all
  select
    'total',
    count(*) filter (where not l.open)::integer,
    avg(l.secs) filter (where not l.open),
    (percentile_cont(0.5) within group (order by l.secs) filter (where not l.open))::double precision,
    count(*) filter (where l.open)::integer,
    avg(l.secs) filter (where l.open)
  from lead_times l;
end;
$$;
revoke all on function public.production_stage_times(uuid) from public, anon;
grant execute on function public.production_stage_times(uuid) to authenticated;

-- Organizações da plataforma (só superadmin), com o tamanho de cada uma.
create function public.platform_orgs()
returns table (id uuid, name text, created_at timestamptz, members integer, products integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    raise exception 'Só o superadmin vê as organizações.' using errcode = 'insufficient_privilege';
  end if;
  return query
  select
    o.id,
    o.name,
    o.created_at,
    (select count(*)::integer from public.org_members m where m.org_id = o.id),
    (select count(*)::integer from public.products p where p.org_id = o.id)
  from public.orgs o
  order by o.created_at desc;
end;
$$;
revoke all on function public.platform_orgs() from public, anon;
grant execute on function public.platform_orgs() to authenticated;
