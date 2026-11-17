-- Alinhavo · Indicação de amigos.
--
-- Regras (decisão do Paulo, 17/11/2026):
--   * Cada pessoa tem um código (referral_codes); o link /i/<código> guarda a indicação no navegador por 30 dias e,
--     no primeiro acesso ao painel depois do cadastro, claim_referral liga a conta nova a quem indicou.
--   * Só conta conta nova: quem já está em alguma organização não vira indicado. Ninguém indica a si mesmo (mesma
--     conta ou mesmo CPF/CNPJ no perfil). Cada pessoa é indicada uma vez só (vale a primeira).
--   * O desconto só nasce no primeiro pagamento de verdade: referral_mark_paid (só o servidor, service_role; será
--     chamada pelo aviso do provedor de pagamento) registra os créditos em referral_rewards com os valores do
--     momento. A cobrança aplica quando existir; até lá, os créditos ficam pendentes.
--   * O superadmin dono configura os dois descontos (percentual ou valor fixo em centavos, por quantas mensalidades)
--     e liga ou desliga o programa (começa desligado). Tudo vai para platform_audit.
--   * Tabelas da plataforma (sem org_id): cada um lê só as suas linhas.

-- ---------------------------------------------------------------------------
-- Regras do programa (uma linha só)
-- ---------------------------------------------------------------------------

create table public.referral_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  referrer_kind text not null default 'percentual' check (referrer_kind in ('percentual', 'fixo')),
  referrer_value integer not null default 0 check (referrer_value >= 0),
  referrer_months integer not null default 1 check (referrer_months between 1 and 12),
  referred_kind text not null default 'percentual' check (referred_kind in ('percentual', 'fixo')),
  referred_value integer not null default 0 check (referred_value >= 0),
  referred_months integer not null default 1 check (referred_months between 1 and 12),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint referral_settings_percent check (
    (referrer_kind <> 'percentual' or referrer_value <= 100) and (referred_kind <> 'percentual' or referred_value <= 100)
  ),
  -- Valor fixo em centavos, até R$ 1.000,00.
  constraint referral_settings_fixed check (
    (referrer_kind <> 'fixo' or referrer_value <= 100000) and (referred_kind <> 'fixo' or referred_value <= 100000)
  )
);

insert into public.referral_settings (id) values (true);

alter table public.referral_settings enable row level security;
-- Todo mundo logado lê as regras (aparecem em Minha conta); escrita só pela função do superadmin.
create policy referral_settings_select on public.referral_settings for select to authenticated using (true);
revoke all on public.referral_settings from anon;
revoke insert, update, delete on public.referral_settings from authenticated;

create function public.platform_set_referral_settings(
  p_enabled boolean,
  p_referrer_kind text,
  p_referrer_value integer,
  p_referrer_months integer,
  p_referred_kind text,
  p_referred_value integer,
  p_referred_months integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_platform(true);
  if p_referrer_kind not in ('percentual', 'fixo') or p_referred_kind not in ('percentual', 'fixo') then
    raise exception 'Escolha percentual ou valor fixo.' using errcode = 'invalid_parameter_value';
  end if;
  if p_referrer_value is null or p_referred_value is null or p_referrer_value < 0 or p_referred_value < 0
    or (p_referrer_kind = 'percentual' and p_referrer_value > 100) or (p_referred_kind = 'percentual' and p_referred_value > 100)
    or (p_referrer_kind = 'fixo' and p_referrer_value > 100000) or (p_referred_kind = 'fixo' and p_referred_value > 100000) then
    raise exception 'Desconto fora do limite: até 100%% ou até R$ 1.000,00.' using errcode = 'invalid_parameter_value';
  end if;
  if p_referrer_months is null or p_referred_months is null or p_referrer_months not between 1 and 12 or p_referred_months not between 1 and 12 then
    raise exception 'O desconto vale de 1 a 12 mensalidades.' using errcode = 'invalid_parameter_value';
  end if;
  update public.referral_settings set
    enabled = coalesce(p_enabled, false),
    referrer_kind = p_referrer_kind, referrer_value = p_referrer_value, referrer_months = p_referrer_months,
    referred_kind = p_referred_kind, referred_value = p_referred_value, referred_months = p_referred_months,
    updated_by = auth.uid(), updated_at = now()
  where id;
  perform private.platform_log('indicacao_regras', null, null, jsonb_build_object(
    'ligado', coalesce(p_enabled, false),
    'quem_indica', jsonb_build_array(p_referrer_kind, p_referrer_value, p_referrer_months),
    'indicado', jsonb_build_array(p_referred_kind, p_referred_value, p_referred_months)
  ));
end;
$$;

revoke all on function public.platform_set_referral_settings(boolean, text, integer, integer, text, integer, integer) from public, anon;
grant execute on function public.platform_set_referral_settings(boolean, text, integer, integer, text, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Códigos
-- ---------------------------------------------------------------------------

create table public.referral_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{8}$'),
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;
create policy referral_codes_select on public.referral_codes for select to authenticated using (user_id = auth.uid());
revoke all on public.referral_codes from anon;
revoke insert, update, delete on public.referral_codes from authenticated;

-- O código de quem chama (cria na primeira vez). Sem 0/O e 1/I, para ditar sem erro.
create function public.my_referral_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if v_user is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  select c.code into v_code from public.referral_codes c where c.user_id = v_user;
  if v_code is not null then
    return v_code;
  end if;
  for attempt in 1..10 loop
    select string_agg(substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::integer, 1), '') into v_code
    from generate_series(1, 8);
    begin
      insert into public.referral_codes (user_id, code) values (v_user, v_code);
      return v_code;
    exception when unique_violation then
      -- Outro código igual (ou a mesma pessoa em duas abas): tenta de novo / devolve o que ficou.
      select c.code into v_code from public.referral_codes c where c.user_id = v_user;
      if v_code is not null then
        return v_code;
      end if;
    end;
  end loop;
  raise exception 'Não deu para criar o código. Tente de novo.' using errcode = 'invalid_parameter_value';
end;
$$;

revoke all on function public.my_referral_code() from public, anon;
grant execute on function public.my_referral_code() to authenticated;

-- ---------------------------------------------------------------------------
-- Indicações e créditos
-- ---------------------------------------------------------------------------

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references auth.users (id) on delete set null,
  referred_id uuid not null unique references auth.users (id) on delete cascade,
  code text not null,
  status text not null default 'cadastrado' check (status in ('cadastrado', 'pagou', 'recusada')),
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index referrals_referrer_idx on public.referrals (referrer_id, created_at desc);

alter table public.referrals enable row level security;
create policy referrals_select on public.referrals for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid());
revoke all on public.referrals from anon;
revoke insert, update, delete on public.referrals from authenticated;

create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  side text not null check (side in ('quem_indicou', 'indicado')),
  kind text not null check (kind in ('percentual', 'fixo')),
  value integer not null check (value > 0),
  months integer not null check (months between 1 and 12),
  status text not null default 'pendente' check (status in ('pendente', 'aplicado', 'cancelado')),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  unique (referral_id, side)
);
create index referral_rewards_user_idx on public.referral_rewards (user_id, status);

alter table public.referral_rewards enable row level security;
create policy referral_rewards_select on public.referral_rewards for select to authenticated using (user_id = auth.uid());
revoke all on public.referral_rewards from anon;
revoke insert, update, delete on public.referral_rewards from authenticated;

-- Mesmo CPF/CNPJ no perfil das duas pessoas (a mesma pessoa com duas contas).
create function private.same_document(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles a join public.profiles b
      on a.document is not null and a.document = b.document and a.document_type = b.document_type
    where a.user_id = p_a and b.user_id = p_b
  )
$$;

revoke all on function private.same_document(uuid, uuid) from public, anon, authenticated;

-- Liga a conta de quem chama ao código. Devolve o que aconteceu: ligada, ou o motivo de não ligar.
create function public.claim_referral(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_referrer uuid;
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if v_user is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  if not (select s.enabled from public.referral_settings s where s.id) then
    return 'programa_desligado';
  end if;
  select c.user_id into v_referrer from public.referral_codes c where c.code = v_code;
  if v_referrer is null then
    return 'codigo_invalido';
  end if;
  if v_referrer = v_user or private.same_document(v_referrer, v_user) then
    return 'propria_conta';
  end if;
  if exists (select 1 from public.referrals r where r.referred_id = v_user) then
    return 'ja_indicada';
  end if;
  -- Só conta nova: quem já está em alguma organização não vira indicado.
  if exists (select 1 from public.org_members m where m.user_id = v_user) then
    return 'conta_antiga';
  end if;
  insert into public.referrals (referrer_id, referred_id, code) values (v_referrer, v_user, v_code)
  on conflict (referred_id) do nothing;
  return 'ligada';
end;
$$;

revoke all on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;

-- Primeiro pagamento da pessoa indicada (só o servidor). Registra os créditos com as regras do momento; repetir não
-- duplica. A mesma pessoa com duas contas (mesmo documento, preenchido depois) é recusada aqui.
create function public.referral_mark_paid(p_user uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref public.referrals;
  v_set public.referral_settings;
begin
  select * into v_ref from public.referrals r where r.referred_id = p_user for update;
  if v_ref.id is null then
    return 'sem_indicacao';
  end if;
  if v_ref.status <> 'cadastrado' then
    return v_ref.status;
  end if;
  if v_ref.referrer_id is null or private.same_document(v_ref.referrer_id, p_user) then
    update public.referrals set status = 'recusada', reason = 'mesma pessoa ou quem indicou saiu' where id = v_ref.id;
    return 'recusada';
  end if;
  select * into v_set from public.referral_settings s where s.id;
  update public.referrals set status = 'pagou', paid_at = now() where id = v_ref.id;
  if v_set.enabled and v_set.referrer_value > 0 then
    insert into public.referral_rewards (referral_id, user_id, side, kind, value, months)
    values (v_ref.id, v_ref.referrer_id, 'quem_indicou', v_set.referrer_kind, v_set.referrer_value, v_set.referrer_months)
    on conflict (referral_id, side) do nothing;
  end if;
  if v_set.enabled and v_set.referred_value > 0 then
    insert into public.referral_rewards (referral_id, user_id, side, kind, value, months)
    values (v_ref.id, p_user, 'indicado', v_set.referred_kind, v_set.referred_value, v_set.referred_months)
    on conflict (referral_id, side) do nothing;
  end if;
  return 'pagou';
end;
$$;

revoke all on function public.referral_mark_paid(uuid) from public, anon, authenticated;
grant execute on function public.referral_mark_paid(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Leitura para as telas
-- ---------------------------------------------------------------------------

-- Quem eu indiquei, com o e-mail mascarado (dado de terceiro) e se o meu desconto já está garantido.
create function public.my_referrals()
returns table (id uuid, email_hint text, status text, created_at timestamptz, paid_at timestamptz, reward_status text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id,
    left(split_part(u.email, '@', 1), 2) || '***@' || split_part(u.email, '@', 2),
    r.status, r.created_at, r.paid_at,
    (select w.status from public.referral_rewards w where w.referral_id = r.id and w.side = 'quem_indicou')
  from public.referrals r
  join auth.users u on u.id = r.referred_id
  where r.referrer_id = auth.uid()
  order by r.created_at desc
  limit 200
$$;

revoke all on function public.my_referrals() from public, anon;
grant execute on function public.my_referrals() to authenticated;

-- Superadmin: todas as indicações (dono e suporte leem).
create function public.platform_referrals(p_limit integer default 200)
returns table (id uuid, referrer_email text, referred_email text, status text, reason text, created_at timestamptz, paid_at timestamptz, rewards integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform(false);
  return query
    select r.id, a.email::text, b.email::text, r.status, r.reason, r.created_at, r.paid_at,
      (select count(*)::integer from public.referral_rewards w where w.referral_id = r.id)
    from public.referrals r
    left join auth.users a on a.id = r.referrer_id
    left join auth.users b on b.id = r.referred_id
    order by r.created_at desc
    limit least(greatest(coalesce(p_limit, 200), 1), 500);
end;
$$;

revoke all on function public.platform_referrals(integer) from public, anon;
grant execute on function public.platform_referrals(integer) to authenticated;
