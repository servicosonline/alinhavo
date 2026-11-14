-- Alinhavo · Fase 0 · Organizações, membros e convites.
--
-- Regras:
--   * Toda tabela de negócio tem org_id e RLS ativa.
--   * Ninguém entra numa organização inserindo linha em org_members: só pelas
--     funções create_org (vira owner) e accept_invite (entra com o papel do convite).
--   * Uma organização nunca fica sem owner.

-- ---------------------------------------------------------------------------
-- Tipos e utilidades
-- ---------------------------------------------------------------------------

create type public.org_role as enum ('owner', 'admin', 'modelista', 'estilista', 'leitura');

create schema if not exists private;
revoke all on schema private from public;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  plan text not null default 'gratuito',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_members (
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index org_members_user_id_idx on public.org_members (user_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email like '%_@_%'),
  role public.org_role not null check (role <> 'owner'),
  -- O token vai no link do convite. gen_random_uuid() tem 122 bits aleatórios.
  token uuid not null unique default gen_random_uuid(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at <= created_at + interval '30 days')
);

create index invites_org_id_idx on public.invites (org_id);
create unique index invites_pendente_unico
  on public.invites (org_id, email)
  where accepted_at is null;

create trigger orgs_updated_at before update on public.orgs
  for each row execute function private.set_updated_at();
create trigger org_members_updated_at before update on public.org_members
  for each row execute function private.set_updated_at();
create trigger invites_updated_at before update on public.invites
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Funções de permissão (security definer: leem org_members sem cair na RLS,
-- o que evita recursão nas políticas da própria org_members)
-- ---------------------------------------------------------------------------

create function private.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = p_org_id and m.user_id = auth.uid()
  );
$$;

create function private.has_org_role(p_org_id uuid, p_roles public.org_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = p_org_id and m.user_id = auth.uid() and m.role = any (p_roles)
  );
$$;

grant usage on schema private to authenticated;
revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.has_org_role(uuid, public.org_role[]) from public;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, public.org_role[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Toda organização mantém pelo menos um owner
-- ---------------------------------------------------------------------------

create function private.guard_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner')
     and exists (select 1 from public.orgs o where o.id = old.org_id)
     and not exists (
       select 1 from public.org_members m
       where m.org_id = old.org_id and m.role = 'owner' and m.user_id <> old.user_id
     )
  then
    raise exception 'A organização precisa de pelo menos um owner.'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger org_members_guard_last_owner
  before update or delete on public.org_members
  for each row execute function private.guard_last_owner();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.invites enable row level security;

-- orgs: membros leem; owner/admin editam; só owner apaga. Criação só por create_org.
create policy orgs_select on public.orgs for select to authenticated
  using (private.is_org_member(id));
create policy orgs_update on public.orgs for update to authenticated
  using (private.has_org_role(id, array['owner', 'admin']::public.org_role[]))
  with check (private.has_org_role(id, array['owner', 'admin']::public.org_role[]));
create policy orgs_delete on public.orgs for delete to authenticated
  using (private.has_org_role(id, array['owner']::public.org_role[]));

-- org_members: membros veem a equipe. Sem política de insert (entrada só via funções).
create policy org_members_select on public.org_members for select to authenticated
  using (private.is_org_member(org_id));

-- Owner muda qualquer papel; admin só mexe em quem não é owner e não promove a owner.
create policy org_members_update on public.org_members for update to authenticated
  using (
    private.has_org_role(org_id, array['owner']::public.org_role[])
    or (private.has_org_role(org_id, array['admin']::public.org_role[]) and role <> 'owner')
  )
  with check (
    private.has_org_role(org_id, array['owner']::public.org_role[])
    or (private.has_org_role(org_id, array['admin']::public.org_role[]) and role <> 'owner')
  );

-- Remover: owner remove qualquer um; admin remove quem não é owner; todo mundo pode sair.
create policy org_members_delete on public.org_members for delete to authenticated
  using (
    user_id = auth.uid()
    or private.has_org_role(org_id, array['owner']::public.org_role[])
    or (private.has_org_role(org_id, array['admin']::public.org_role[]) and role <> 'owner')
  );

-- invites: só owner/admin veem, criam e cancelam convites da própria organização.
create policy invites_select on public.invites for select to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));
create policy invites_insert on public.invites for insert to authenticated
  with check (
    private.has_org_role(org_id, array['owner', 'admin']::public.org_role[])
    and created_by = auth.uid()
    and accepted_at is null
    and accepted_by is null
  );
create policy invites_delete on public.invites for delete to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

-- Campos que o cliente pode escrever. O resto (token, aceite, datas) é do servidor.
revoke insert, update on public.orgs from anon, authenticated;
grant update (name) on public.orgs to authenticated;
revoke insert, update on public.org_members from anon, authenticated;
grant update (role) on public.org_members to authenticated;
revoke insert, update on public.invites from anon, authenticated;
grant insert (org_id, email, role, created_by, expires_at) on public.invites to authenticated;

-- ---------------------------------------------------------------------------
-- Funções chamadas pelo app (RPC)
-- ---------------------------------------------------------------------------

-- Cria a organização e torna quem chamou o owner, numa transação só.
create function public.create_org(p_name text)
returns public.orgs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_org public.orgs;
begin
  if v_user is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;

  insert into public.orgs (name, created_by)
  values (btrim(p_name), v_user)
  returning * into v_org;

  insert into public.org_members (org_id, user_id, role)
  values (v_org.id, v_user, 'owner');

  return v_org;
end;
$$;

-- Aceita um convite: precisa estar logado com o mesmo e-mail do convite.
create function public.accept_invite(p_token uuid)
returns public.org_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_invite public.invites;
  v_member public.org_members;
begin
  if v_user is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_invite
  from public.invites i
  where i.token = p_token
  for update;

  -- Mesma mensagem para "não existe" e "é de outra pessoa": não revela convites alheios.
  if v_invite.id is null or v_invite.email is distinct from v_email then
    raise exception 'Convite inválido.' using errcode = 'no_data_found';
  end if;
  if v_invite.accepted_at is not null then
    raise exception 'Convite já usado.' using errcode = 'check_violation';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Convite expirado.' using errcode = 'check_violation';
  end if;

  insert into public.org_members (org_id, user_id, role)
  values (v_invite.org_id, v_user, v_invite.role)
  on conflict (org_id, user_id) do nothing
  returning * into v_member;

  if v_member.org_id is null then
    raise exception 'Você já faz parte desta organização.' using errcode = 'unique_violation';
  end if;

  update public.invites
  set accepted_at = now(), accepted_by = v_user
  where id = v_invite.id;

  return v_member;
end;
$$;

revoke all on function public.create_org(text) from public, anon;
revoke all on function public.accept_invite(uuid) from public, anon;
grant execute on function public.create_org(text) to authenticated;
grant execute on function public.accept_invite(uuid) to authenticated;
