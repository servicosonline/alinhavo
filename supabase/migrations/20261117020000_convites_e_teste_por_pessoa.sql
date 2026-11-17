-- Alinhavo · Convites: quem entra por convite pode (ou não) criar organizações; um teste grátis por pessoa.
--
-- Regras (decisão do Paulo, 17/11/2026):
--   * O convite diz se a pessoa pode criar organizações próprias (invites.can_create_orgs). A tela do convite
--     começa desmarcada; o padrão da coluna é "sim" para quem não diz nada (convite do superadmin, membros de hoje).
--   * accept_invite copia a opção para o membro (org_members.can_create_orgs). Dono e admin mudam depois na
--     equipe (mesma política de update de org_members: admin não mexe no dono).
--   * A trava só vale enquanto a pessoa estiver na organização que travou, e "liberar vence": pode criar quem
--     não está em nenhuma organização, quem é dono de alguma ou quem tem pelo menos um vínculo liberado.
--   * Um teste grátis por pessoa: trial_grants guarda quem já ganhou teste (pela conta e pelo CPF/CNPJ do perfil,
--     em hash) e não some quando a organização é apagada. A organização nova de quem já usou nasce "vencida", sem
--     prazo (nada é bloqueado por plano ainda: muda o aviso). Organizações que já existiam não mudam.

-- ---------------------------------------------------------------------------
-- Criar organizações
-- ---------------------------------------------------------------------------

alter table public.invites add column can_create_orgs boolean not null default true;
alter table public.org_members add column can_create_orgs boolean not null default true;

-- O app escreve a opção no convite e dono/admin a trocam no membro (as políticas de sempre conferem quem).
revoke insert on public.invites from authenticated;
grant insert (org_id, email, role, created_by, expires_at, can_create_orgs) on public.invites to authenticated;
grant update (can_create_orgs) on public.org_members to authenticated;

-- Ninguém libera a si mesmo (um admin travado pelo dono continua travado até o dono liberar).
create function private.tg_member_creation_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.can_create_orgs is distinct from old.can_create_orgs and new.user_id = auth.uid() then
    raise exception 'Você não pode mudar a sua própria permissão de criar organizações.' using errcode = 'invalid_parameter_value';
  end if;
  return new;
end;
$$;

revoke all on function private.tg_member_creation_guard() from public, anon, authenticated;

create trigger org_members_creation_guard before update of can_create_orgs on public.org_members
  for each row execute function private.tg_member_creation_guard();

create function private.can_create_org(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.org_members m where m.user_id = p_user)
    or exists (select 1 from public.org_members m where m.user_id = p_user and (m.role = 'owner' or m.can_create_orgs))
$$;

revoke all on function private.can_create_org(uuid) from public, anon;
grant execute on function private.can_create_org(uuid) to authenticated;

create or replace function public.create_org(p_name text)
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
  if not private.can_create_org(v_user) then
    raise exception 'Sua conta entrou por convite e não pode criar organizações. Peça ao dono da organização para liberar.'
      using errcode = 'invalid_parameter_value';
  end if;

  insert into public.orgs (name, created_by)
  values (btrim(p_name), v_user)
  returning * into v_org;

  insert into public.org_members (org_id, user_id, role)
  values (v_org.id, v_user, 'owner');

  return v_org;
end;
$$;

-- Igual ao de antes, copiando a opção de criar organizações do convite para o membro.
create or replace function public.accept_invite(p_token uuid)
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

  insert into public.org_members (org_id, user_id, role, can_create_orgs)
  values (v_invite.org_id, v_user, v_invite.role, v_invite.can_create_orgs)
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

-- ---------------------------------------------------------------------------
-- Um teste grátis por pessoa
-- ---------------------------------------------------------------------------

-- Tabela da plataforma (sem org_id de negócio: a organização pode ter sido apagada). Ninguém lê pelo app.
create table public.trial_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  -- sha256 de "tipo:documento" do perfil de quem criou (nunca o documento em claro).
  document_hash text check (document_hash ~ '^[0-9a-f]{64}$'),
  org_id uuid,
  granted_at timestamptz not null default now()
);
create index trial_grants_user_idx on public.trial_grants (user_id);
create index trial_grants_document_idx on public.trial_grants (document_hash);

alter table public.trial_grants enable row level security;
revoke all on public.trial_grants from anon, authenticated;

create function private.document_hash(p_type public.document_type, p_document text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_type is null or p_document is null then null
    else encode(sha256(convert_to(p_type::text || ':' || p_document, 'UTF8')), 'hex') end
$$;

revoke all on function private.document_hash(public.document_type, text) from public, anon, authenticated;

-- Quem já ganhou teste (pela conta ou pelo documento) não ganha outro.
create function private.trial_used(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trial_grants g
    where g.user_id = p_user
       or g.document_hash = (select private.document_hash(p.document_type, p.document) from public.profiles p where p.user_id = p_user)
  )
$$;

revoke all on function private.trial_used(uuid) from public, anon, authenticated;

create or replace function private.tg_org_trial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null and private.trial_used(new.created_by) then
    -- Teste já usado: a organização nasce sem prazo, como teste encerrado.
    insert into public.org_subscriptions (org_id, plan_id, status, trial_ends_at)
    values (new.id, 'confeccao', 'vencida', null)
    on conflict (org_id) do nothing;
    return new;
  end if;
  insert into public.org_subscriptions (org_id, plan_id, status, trial_ends_at)
  values (new.id, 'confeccao', 'trial', now() + make_interval(days => private.trial_days()))
  on conflict (org_id) do nothing;
  if new.created_by is not null then
    insert into public.trial_grants (user_id, document_hash, org_id)
    select new.created_by, private.document_hash(p.document_type, p.document), new.id
    from (select 1) one
    left join public.profiles p on p.user_id = new.created_by;
  end if;
  return new;
end;
$$;

-- Documento preenchido depois: entra nos testes que a pessoa já ganhou (a outra conta com o mesmo CPF não ganha).
create function private.tg_profile_trial_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.document is not null then
    update public.trial_grants g
    set document_hash = private.document_hash(new.document_type, new.document)
    where g.user_id = new.user_id and g.document_hash is null;
  end if;
  return new;
end;
$$;

revoke all on function private.tg_profile_trial_document() from public, anon, authenticated;

create trigger profiles_trial_document after insert or update of document, document_type on public.profiles
  for each row execute function private.tg_profile_trial_document();

-- A tela pergunta antes de mostrar o card "Nova organização": se pode criar, quem travou (para o aviso) e se
-- a próxima organização ainda ganha o teste grátis.
create function public.my_org_creation()
returns table (allowed boolean, blocked_by text, trial_available boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.can_create_org(auth.uid()),
    (select o.name from public.org_members m join public.orgs o on o.id = m.org_id
      where m.user_id = auth.uid() and not m.can_create_orgs order by m.created_at limit 1),
    not private.trial_used(auth.uid())
  where auth.uid() is not null
$$;

revoke all on function public.my_org_creation() from public, anon;
grant execute on function public.my_org_creation() to authenticated;

-- Quem já está ou esteve em teste conta como teste usado (as cortesias de antes do teste, não).
insert into public.trial_grants (user_id, document_hash, org_id, granted_at)
select o.created_by, private.document_hash(p.document_type, p.document), o.id, s.created_at
from public.org_subscriptions s
join public.orgs o on o.id = s.org_id
left join public.profiles p on p.user_id = o.created_by
where s.status in ('trial', 'vencida') and o.created_by is not null;
