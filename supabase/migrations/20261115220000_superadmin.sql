-- Alinhavo · Superadmin completo: ajudantes, clientes, ações de atendimento, auditoria e erros.
--
-- Regras:
--   * platform_admins ganha o papel: 'dono' (o Paulo: tudo, inclusive ajudantes e planos) e 'suporte'
--     (atende: vê os clientes, convida, tira da organização, muda papel; não mexe em plano nem em ajudante).
--   * O superadmin enxerga todas as organizações, mas só por estas funções (security definer, conferem
--     is_platform_admin). As telas normais e a RLS das organizações não mudam.
--   * Toda ação de admin vai para platform_audit (quem, o quê, em qual cliente, quando). Ninguém apaga.
--   * app_errors: erros que acontecem na tela de quem está logado (caminho, mensagem curta, digest).
--     Sem dado pessoal; até 20 por pessoa por minuto. Só o superadmin lê.

alter table public.platform_admins
  add column role text not null default 'dono' check (role in ('dono', 'suporte'));

-- O papel de quem chama ('dono', 'suporte') ou null.
create function private.platform_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.role from public.platform_admins a where a.user_id = auth.uid()
$$;

revoke all on function private.platform_role() from public, anon;
grant execute on function private.platform_role() to authenticated;

-- Para a tela: o papel de quem está logado (null = não é admin).
create function public.my_platform_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$ select private.platform_role() $$;

revoke all on function public.my_platform_role() from public, anon;
grant execute on function public.my_platform_role() to authenticated;

create function private.require_platform(p_dono boolean default false)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_role text := private.platform_role();
begin
  if v_role is null or (p_dono and v_role <> 'dono') then
    raise exception 'Só o superadmin%.', case when p_dono then ' dono' else '' end using errcode = 'insufficient_privilege';
  end if;
end;
$$;

revoke all on function private.require_platform(boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------

create table public.platform_audit (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users (id) on delete set null,
  action text not null check (action ~ '^[a-z_]{3,40}$'),
  org_id uuid,
  target_user uuid,
  meta jsonb not null default '{}'::jsonb check (pg_column_size(meta) <= 2048),
  created_at timestamptz not null default now()
);

create index platform_audit_time on public.platform_audit (created_at desc);
alter table public.platform_audit enable row level security;
revoke all on public.platform_audit from anon, authenticated;

create function private.platform_log(p_action text, p_org uuid, p_user uuid, p_meta jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.platform_audit (admin_id, action, org_id, target_user, meta)
  values (auth.uid(), p_action, p_org, p_user, coalesce(p_meta, '{}'::jsonb))
$$;

revoke all on function private.platform_log(text, uuid, uuid, jsonb) from public, anon, authenticated;

create function public.platform_audit_list(p_limit integer default 100)
returns table (id bigint, admin_email text, action text, org_id uuid, org_name text, target_email text, meta jsonb, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform();
  return query
  select a.id, ad.email::text, a.action, a.org_id, o.name, tu.email::text, a.meta, a.created_at
  from public.platform_audit a
  left join auth.users ad on ad.id = a.admin_id
  left join auth.users tu on tu.id = a.target_user
  left join public.orgs o on o.id = a.org_id
  order by a.id desc
  limit least(greatest(p_limit, 1), 500);
end;
$$;

revoke all on function public.platform_audit_list(integer) from public, anon;
grant execute on function public.platform_audit_list(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Erros da tela
-- ---------------------------------------------------------------------------

create table public.app_errors (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  org_id uuid references public.orgs (id) on delete set null,
  path text not null check (char_length(path) <= 300),
  message text not null check (char_length(message) <= 500),
  digest text check (char_length(digest) <= 100),
  created_at timestamptz not null default now()
);

create index app_errors_time on public.app_errors (created_at desc);
alter table public.app_errors enable row level security;
revoke all on public.app_errors from anon, authenticated;

-- Registra um erro da tela de quem está logado. Erro demais por minuto é ignorado (não atrapalha a tela).
create function public.log_client_error(p_path text, p_message text, p_digest text default null, p_org_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if (select count(*) from public.app_errors e where e.user_id = auth.uid() and e.created_at > now() - interval '1 minute') >= 20 then
    return;
  end if;
  insert into public.app_errors (user_id, org_id, path, message, digest)
  values (
    auth.uid(),
    case when p_org_id is not null and private.is_org_member(p_org_id) then p_org_id end,
    left(coalesce(p_path, ''), 300),
    left(coalesce(nullif(btrim(p_message), ''), 'Erro sem mensagem'), 500),
    left(p_digest, 100)
  );
end;
$$;

revoke all on function public.log_client_error(text, text, text, uuid) from public, anon;
grant execute on function public.log_client_error(text, text, text, uuid) to authenticated;

create function public.platform_errors(p_org_id uuid default null, p_limit integer default 100)
returns table (id bigint, user_email text, org_id uuid, org_name text, path text, message text, digest text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform();
  return query
  select e.id, u.email::text, e.org_id, o.name, e.path, e.message, e.digest, e.created_at
  from public.app_errors e
  left join auth.users u on u.id = e.user_id
  left join public.orgs o on o.id = e.org_id
  where p_org_id is null or e.org_id = p_org_id
  order by e.id desc
  limit least(greatest(p_limit, 1), 500);
end;
$$;

revoke all on function public.platform_errors(uuid, integer) from public, anon;
grant execute on function public.platform_errors(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------

-- Todas as organizações com plano, status de agora, pessoas por papel e o último uso.
create function public.platform_clients()
returns table (
  id uuid, name text, created_at timestamptz, thumbnail_path text,
  plan_id text, status public.subscription_status, trial_ends_at timestamptz,
  full_seats integer, stylist_seats integer, reader_seats integer,
  last_activity timestamptz, actions_30d integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform();
  return query
  select
    o.id, o.name, o.created_at, o.thumbnail_path,
    s.plan_id,
    case when s.status = 'trial' and s.trial_ends_at <= now() then 'vencida'::public.subscription_status else s.status end,
    s.trial_ends_at,
    (select count(*)::integer from public.org_members m where m.org_id = o.id and m.role in ('owner', 'admin', 'modelista')),
    (select count(*)::integer from public.org_members m where m.org_id = o.id and m.role = 'estilista'),
    (select count(*)::integer from public.org_members m where m.org_id = o.id and m.role = 'leitura'),
    (select max(a.created_at) from public.activity_log a where a.org_id = o.id),
    (select count(*)::integer from public.activity_log a where a.org_id = o.id and a.created_at > now() - interval '30 days')
  from public.orgs o
  left join public.org_subscriptions s on s.org_id = o.id
  order by o.created_at desc;
end;
$$;

revoke all on function public.platform_clients() from public, anon;
grant execute on function public.platform_clients() to authenticated;

-- A ficha de um cliente: equipe com e-mail e último uso, uso dos últimos 30 dias por ação, IA, atividade e erros.
create function public.platform_client(p_org_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  perform private.require_platform();
  select jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'created_at', o.created_at,
    'thumbnail_path', o.thumbnail_path,
    'plan', (select jsonb_build_object('plan_id', s.plan_id, 'status', s.status, 'trial_ends_at', s.trial_ends_at, 'seats', s.seats)
             from public.org_subscriptions s where s.org_id = o.id),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', m.user_id, 'email', u.email, 'role', m.role, 'joined_at', m.created_at,
        'last_activity', (select max(a.created_at) from public.activity_log a where a.org_id = o.id and a.user_id = m.user_id)
      ) order by array_position(array['owner', 'admin', 'modelista', 'estilista', 'leitura']::text[], m.role::text), m.created_at)
      from public.org_members m join auth.users u on u.id = m.user_id where m.org_id = o.id
    ), '[]'::jsonb),
    'usage', coalesce((
      select jsonb_object_agg(x.action, x.n) from (
        select a.action, count(*)::integer as n from public.activity_log a
        where a.org_id = o.id and a.created_at > now() - interval '30 days' group by a.action
      ) x
    ), '{}'::jsonb),
    'ai', coalesce((
      select jsonb_object_agg(x.kind, jsonb_build_object('n', x.n, 'input_tokens', x.inp, 'output_tokens', x.outp)) from (
        select g.kind, count(*)::integer as n, coalesce(sum(g.input_tokens), 0)::bigint as inp, coalesce(sum(g.output_tokens), 0)::bigint as outp
        from public.ai_generations g
        where g.org_id = o.id and g.status <> 'erro' and g.created_at > now() - interval '30 days' group by g.kind
      ) x
    ), '{}'::jsonb),
    'activity', coalesce((
      select jsonb_agg(jsonb_build_object('action', a.action, 'meta', a.meta, 'email', u.email, 'created_at', a.created_at) order by a.id desc)
      from (select * from public.activity_log a2 where a2.org_id = o.id order by a2.id desc limit 25) a
      left join auth.users u on u.id = a.user_id
    ), '[]'::jsonb),
    'invites', coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'email', i.email, 'role', i.role, 'token', i.token, 'expires_at', i.expires_at) order by i.created_at desc)
      from public.invites i where i.org_id = o.id and i.accepted_at is null and i.expires_at > now()
    ), '[]'::jsonb)
  ) into v
  from public.orgs o where o.id = p_org_id;
  return v;
end;
$$;

revoke all on function public.platform_client(uuid) from public, anon;
grant execute on function public.platform_client(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Ações de atendimento
-- ---------------------------------------------------------------------------

-- Convite para pôr uma pessoa na organização (o link vale 14 dias).
create function public.platform_create_invite(p_org_id uuid, p_email text, p_role public.org_role)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token uuid;
  v_email text := lower(btrim(p_email));
begin
  perform private.require_platform();
  if not exists (select 1 from public.orgs o where o.id = p_org_id) then
    raise exception 'Organização não encontrada.' using errcode = 'invalid_parameter_value';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or char_length(v_email) > 254 then
    raise exception 'E-mail inválido.' using errcode = 'invalid_parameter_value';
  end if;
  insert into public.invites (org_id, email, role, expires_at)
  values (p_org_id, v_email, p_role, now() + interval '14 days')
  returning token into v_token;
  perform private.platform_log('convite_criado', p_org_id, null, jsonb_build_object('papel', p_role));
  return v_token;
end;
$$;

revoke all on function public.platform_create_invite(uuid, text, public.org_role) from public, anon;
grant execute on function public.platform_create_invite(uuid, text, public.org_role) to authenticated;

-- Muda o papel (a organização nunca fica sem dono: o gatilho guard_last_owner confere).
create function public.platform_set_member_role(p_org_id uuid, p_user_id uuid, p_role public.org_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_platform();
  update public.org_members set role = p_role where org_id = p_org_id and user_id = p_user_id;
  if not found then
    raise exception 'Pessoa não encontrada nesta organização.' using errcode = 'invalid_parameter_value';
  end if;
  perform private.platform_log('papel_mudou', p_org_id, p_user_id, jsonb_build_object('para', p_role));
end;
$$;

revoke all on function public.platform_set_member_role(uuid, uuid, public.org_role) from public, anon;
grant execute on function public.platform_set_member_role(uuid, uuid, public.org_role) to authenticated;

-- Tira a pessoa da organização (a conta continua existindo).
create function public.platform_remove_member(p_org_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_platform();
  delete from public.org_members where org_id = p_org_id and user_id = p_user_id;
  if not found then
    raise exception 'Pessoa não encontrada nesta organização.' using errcode = 'invalid_parameter_value';
  end if;
  perform private.platform_log('membro_removido', p_org_id, p_user_id, '{}'::jsonb);
end;
$$;

revoke all on function public.platform_remove_member(uuid, uuid) from public, anon;
grant execute on function public.platform_remove_member(uuid, uuid) to authenticated;

-- Plano e teste (só o dono): estender o teste, marcar cortesia, ativa ou cancelada.
create function public.platform_set_subscription(p_org_id uuid, p_status public.subscription_status, p_trial_days integer default null, p_plan_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_platform(true);
  if p_status = 'trial' and (p_trial_days is null or p_trial_days < 1 or p_trial_days > 90) then
    raise exception 'Para o teste, escolha de 1 a 90 dias a partir de hoje.' using errcode = 'invalid_parameter_value';
  end if;
  if p_status = 'vencida' then
    raise exception 'Vencida é calculada pelo prazo do teste; não se marca à mão.' using errcode = 'invalid_parameter_value';
  end if;
  insert into public.org_subscriptions (org_id, plan_id, status, trial_ends_at)
  values (
    p_org_id,
    coalesce(p_plan_id, 'confeccao'),
    p_status,
    case when p_status = 'trial' then now() + make_interval(days => p_trial_days) end
  )
  on conflict (org_id) do update set
    status = excluded.status,
    trial_ends_at = excluded.trial_ends_at,
    plan_id = coalesce(p_plan_id, public.org_subscriptions.plan_id);
  perform private.platform_log('plano_mudou', p_org_id, null, jsonb_build_object('status', p_status, 'dias', p_trial_days, 'plano', p_plan_id));
end;
$$;

revoke all on function public.platform_set_subscription(uuid, public.subscription_status, integer, text) from public, anon;
grant execute on function public.platform_set_subscription(uuid, public.subscription_status, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Ajudantes de administração (só o dono mexe)
-- ---------------------------------------------------------------------------

create function public.platform_admins_list()
returns table (user_id uuid, email text, role text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform();
  return query
  select a.user_id, u.email::text, a.role, a.created_at
  from public.platform_admins a join auth.users u on u.id = a.user_id
  order by a.created_at;
end;
$$;

revoke all on function public.platform_admins_list() from public, anon;
grant execute on function public.platform_admins_list() to authenticated;

-- A pessoa precisa já ter conta (entrou ao menos uma vez).
create function public.platform_add_admin(p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  perform private.require_platform(true);
  if p_role not in ('dono', 'suporte') then
    raise exception 'Papel inválido.' using errcode = 'invalid_parameter_value';
  end if;
  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'Essa pessoa ainda não tem conta no Alinhavo. Peça para ela criar a conta antes.' using errcode = 'invalid_parameter_value';
  end if;
  insert into public.platform_admins (user_id, role) values (v_user, p_role)
  on conflict (user_id) do update set role = excluded.role;
  perform private.platform_log('admin_adicionado', null, v_user, jsonb_build_object('papel', p_role));
end;
$$;

revoke all on function public.platform_add_admin(text, text) from public, anon;
grant execute on function public.platform_add_admin(text, text) to authenticated;

-- Nunca tira o último dono.
create function public.platform_remove_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_platform(true);
  if (select a.role from public.platform_admins a where a.user_id = p_user_id) = 'dono'
     and (select count(*) from public.platform_admins a where a.role = 'dono') <= 1 then
    raise exception 'A plataforma precisa de pelo menos um dono.' using errcode = 'invalid_parameter_value';
  end if;
  delete from public.platform_admins where user_id = p_user_id;
  perform private.platform_log('admin_removido', null, p_user_id, '{}'::jsonb);
end;
$$;

revoke all on function public.platform_remove_admin(uuid) from public, anon;
grant execute on function public.platform_remove_admin(uuid) to authenticated;
