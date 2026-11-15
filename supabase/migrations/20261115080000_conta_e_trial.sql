-- Alinhavo · Conta da pessoa e teste grátis de 15 dias por organização.
--
-- Regras:
--   * profiles: um por pessoa (user_id = auth.users.id). Nome, sobrenome, CPF ou CNPJ
--     (só dígitos, validados pelo dígito verificador), foto e o andamento do primeiro
--     acesso. Só a própria pessoa lê e escreve. CPF/CNPJ é dado pessoal (LGPD):
--     não aparece para a equipe nem vai para o registro de atividade.
--   * Foto no bucket público `avatars`, caminho `<user_id>/<arquivo>.webp|.jpg|.png`,
--     até 200 KB. Cada pessoa só envia e apaga na própria pasta. Público porque a foto
--     aparece para a equipe; o nome do arquivo é aleatório.
--   * org_subscriptions: o plano de cada organização (ids de apps/web/src/lib/plans.ts),
--     status e fim do teste. Toda organização criada por create_org nasce em teste de
--     15 dias. As que já existiam ficam como cortesia (nada vence de surpresa).
--     Ninguém escreve pelo app: só as funções do banco (e, no futuro, o pagamento).
--     Membros leem a da própria organização.
--   * Nada é bloqueado por plano ainda: sem provedor de pagamento, o teste vencido só
--     muda o aviso na tela (org_plan_status devolve 'vencida').

-- ---------------------------------------------------------------------------
-- CPF e CNPJ (dígito verificador)
-- ---------------------------------------------------------------------------

create function private.valid_cpf(p text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  d int[];
  s int;
  r int;
begin
  if p !~ '^\d{11}$' or p ~ '^(\d)\1{10}$' then
    return false;
  end if;
  select array_agg(substr(p, i, 1)::int order by i) into d from generate_series(1, 11) i;
  s := 0;
  for i in 1..9 loop s := s + d[i] * (11 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  if r <> d[10] then return false; end if;
  s := 0;
  for i in 1..10 loop s := s + d[i] * (12 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  return r = d[11];
end;
$$;

create function private.valid_cnpj(p text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  d int[];
  w1 int[] := array[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  w2 int[] := array[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  s int;
  r int;
begin
  if p !~ '^\d{14}$' or p ~ '^(\d)\1{13}$' then
    return false;
  end if;
  select array_agg(substr(p, i, 1)::int order by i) into d from generate_series(1, 14) i;
  s := 0;
  for i in 1..12 loop s := s + d[i] * w1[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  if r <> d[13] then return false; end if;
  s := 0;
  for i in 1..13 loop s := s + d[i] * w2[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  return r = d[14];
end;
$$;

revoke all on function private.valid_cpf(text) from public, anon;
revoke all on function private.valid_cnpj(text) from public, anon;
grant execute on function private.valid_cpf(text) to authenticated;
grant execute on function private.valid_cnpj(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Perfil
-- ---------------------------------------------------------------------------

create type public.document_type as enum ('cpf', 'cnpj');

create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  first_name text check (char_length(btrim(first_name)) between 1 and 60),
  last_name text check (char_length(btrim(last_name)) between 1 and 80),
  document_type public.document_type,
  document text,
  avatar_path text check (char_length(avatar_path) <= 200),
  -- Primeiro acesso: quando viu as boas-vindas e quando fechou (ou concluiu) os primeiros passos.
  welcome_seen_at timestamptz,
  onboarding_closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- coalesce: num check, null conta como aprovado (documento sem tipo passaria).
  constraint profiles_document_ok check (coalesce(
    (document_type is null and document is null)
    or (document_type = 'cpf' and private.valid_cpf(document))
    or (document_type = 'cnpj' and private.valid_cnpj(document)),
    false
  )),
  constraint profiles_avatar_own check (avatar_path is null or split_part(avatar_path, '/', 1) = user_id::text)
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (user_id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (user_id, first_name, last_name, document_type, document, avatar_path, welcome_seen_at, onboarding_closed_at)
  on public.profiles to authenticated;
grant update (first_name, last_name, document_type, document, avatar_path, welcome_seen_at, onboarding_closed_at)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Foto de perfil (Storage)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 204800, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- O caminho é <user_id>/<nome>.(webp|jpg|png) e a pasta é de quem está logado.
create function private.is_own_avatar_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{1,64}\.(webp|jpg|png)$'
    and split_part(p_name, '/', 1) = auth.uid()::text
$$;

revoke all on function private.is_own_avatar_path(text) from public, anon;
grant execute on function private.is_own_avatar_path(text) to authenticated;

create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and private.is_own_avatar_path(name));
create policy avatars_select on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and private.is_own_avatar_path(name));
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and private.is_own_avatar_path(name));

-- ---------------------------------------------------------------------------
-- Plano e teste grátis por organização
-- ---------------------------------------------------------------------------

create type public.subscription_status as enum ('trial', 'ativa', 'vencida', 'cancelada', 'cortesia');

create table public.org_subscriptions (
  org_id uuid primary key references public.orgs (id) on delete cascade,
  plan_id text not null default 'confeccao' check (plan_id in ('gratis', 'modelista', 'estilista', 'confeccao')),
  status public.subscription_status not null default 'trial',
  trial_ends_at timestamptz,
  seats integer not null default 1 check (seats between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_subscriptions_trial_has_end check (status <> 'trial' or trial_ends_at is not null)
);

create trigger org_subscriptions_updated_at before update on public.org_subscriptions
  for each row execute function private.set_updated_at();

alter table public.org_subscriptions enable row level security;

create policy org_subscriptions_select on public.org_subscriptions for select to authenticated
  using (private.is_org_member(org_id));

revoke all on public.org_subscriptions from anon, authenticated;
grant select on public.org_subscriptions to authenticated;

-- Dias de teste de toda organização nova (o mesmo TRIAL_DAYS de lib/plans.ts).
create function private.trial_days()
returns integer
language sql
immutable
set search_path = ''
as $$ select 15 $$;

-- Toda organização nova nasce em teste, com tudo liberado (plano Confecção).
create function private.tg_org_trial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.org_subscriptions (org_id, plan_id, status, trial_ends_at)
  values (new.id, 'confeccao', 'trial', now() + make_interval(days => private.trial_days()))
  on conflict (org_id) do nothing;
  return new;
end;
$$;

revoke all on function private.tg_org_trial() from public, anon, authenticated;

create trigger orgs_trial after insert on public.orgs
  for each row execute function private.tg_org_trial();

-- As que já existiam: cortesia, sem prazo.
insert into public.org_subscriptions (org_id, plan_id, status)
select o.id, 'confeccao', 'cortesia' from public.orgs o
on conflict (org_id) do nothing;

-- O status de verdade agora (teste com o prazo passado = vencida) e os dias que faltam.
create function public.org_plan_status(p_org_id uuid)
returns table (plan_id text, status public.subscription_status, trial_ends_at timestamptz, days_left integer, seats integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.plan_id,
    case when s.status = 'trial' and s.trial_ends_at <= now() then 'vencida'::public.subscription_status else s.status end,
    s.trial_ends_at,
    case when s.status = 'trial' then greatest(0, ceil(extract(epoch from (s.trial_ends_at - now())) / 86400)::integer) end,
    s.seats
  from public.org_subscriptions s
  where s.org_id = p_org_id and private.is_org_member(p_org_id)
$$;

revoke all on function public.org_plan_status(uuid) from public, anon;
grant execute on function public.org_plan_status(uuid) to authenticated;
