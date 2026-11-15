-- Alinhavo · Registro de atividade (o que cada pessoa fez, em qual organização e quando).
--
-- Regras:
--   * Base do ROI, do suporte e do painel do superadmin. Ninguém escreve na tabela
--     direto: os gatilhos do banco gravam as ações de negócio (molde, versão, produto,
--     aprovação, risco, ficha, equipe) e log_event grava eventos de tela de uma lista
--     fechada (prova aberta, exportação), com limite por minuto.
--   * Dono e admin leem o registro da própria organização. O superadmin (fase do
--     painel de administração) lerá por funções próprias.
--   * Nada de dado pessoal sensível em `meta` (nunca CPF/CNPJ, senha ou texto livre
--     da cliente). Só ids, nomes de peças e números.
--   * user_id null = ação sem conta (a cliente decidindo pelo link de aprovação).

create table public.activity_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.orgs (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action text not null check (action ~ '^[a-z_]{3,40}$'),
  entity text check (entity ~ '^[a-z_]{3,30}$'),
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb check (pg_column_size(meta) <= 2048),
  created_at timestamptz not null default now()
);

create index activity_log_org_time on public.activity_log (org_id, created_at desc);
create index activity_log_user_time on public.activity_log (user_id, created_at desc);

alter table public.activity_log enable row level security;

create policy activity_log_select on public.activity_log for select to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

revoke all on public.activity_log from anon, authenticated;
grant select on public.activity_log to authenticated;

-- Grava uma linha (usada pelos gatilhos e por log_event).
create function private.log_activity(p_org_id uuid, p_action text, p_entity text, p_entity_id uuid, p_meta jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.activity_log (org_id, user_id, action, entity, entity_id, meta)
  values (p_org_id, auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_meta, '{}'::jsonb))
$$;

revoke all on function private.log_activity(uuid, text, text, uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Gatilhos das ações de negócio
-- ---------------------------------------------------------------------------

create function private.tg_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  case tg_table_name
    when 'patterns' then
      perform private.log_activity(r.org_id, 'molde_criado', 'pattern', r.id, jsonb_build_object('nome', r.name));
    when 'pattern_versions' then
      perform private.log_activity(r.org_id, 'versao_salva', 'pattern', r.pattern_id,
        jsonb_build_object('versao', r.number, 'origem', r.origin));
    when 'collections' then
      perform private.log_activity(r.org_id, 'colecao_criada', 'collection', r.id, jsonb_build_object('nome', r.name));
    when 'products' then
      if tg_op = 'INSERT' then
        perform private.log_activity(r.org_id, 'produto_criado', 'product', r.id, jsonb_build_object('nome', r.name));
      elsif new.status is distinct from old.status then
        perform private.log_activity(r.org_id, 'produto_status', 'product', r.id,
          jsonb_build_object('de', old.status, 'para', new.status));
      end if;
    when 'approvals' then
      if tg_op = 'INSERT' then
        perform private.log_activity(r.org_id, 'aprovacao_pedida', 'approval', r.id, jsonb_build_object('molde', r.pattern_id));
      elsif new.status is distinct from old.status and new.status <> 'pendente' then
        perform private.log_activity(r.org_id, 'aprovacao_decidida', 'approval', r.id, jsonb_build_object('status', new.status));
      end if;
    when 'markers' then
      perform private.log_activity(r.org_id, 'risco_salvo', 'product', r.product_id, jsonb_build_object('risco', r.number));
    when 'tech_packs' then
      perform private.log_activity(r.org_id, 'ficha_gerada', 'product', r.product_id, jsonb_build_object('ficha', r.number));
    when 'org_members' then
      if tg_op = 'INSERT' then
        perform private.log_activity(r.org_id, 'membro_entrou', 'member', r.user_id, jsonb_build_object('papel', r.role));
      elsif tg_op = 'DELETE' then
        -- Organização apagada: os membros saem junto, e não há onde registrar.
        if exists (select 1 from public.orgs o where o.id = r.org_id) then
          perform private.log_activity(r.org_id, 'membro_saiu', 'member', r.user_id, '{}'::jsonb);
        end if;
      elsif new.role is distinct from old.role then
        perform private.log_activity(r.org_id, 'papel_mudou', 'member', r.user_id, jsonb_build_object('de', old.role, 'para', new.role));
      end if;
    when 'invites' then
      perform private.log_activity(r.org_id, 'convite_criado', 'invite', r.id, jsonb_build_object('papel', r.role));
    else
      null;
  end case;
  return null;
end;
$$;

revoke all on function private.tg_activity() from public, anon, authenticated;

create trigger patterns_activity after insert on public.patterns for each row execute function private.tg_activity();
create trigger pattern_versions_activity after insert on public.pattern_versions for each row execute function private.tg_activity();
create trigger collections_activity after insert on public.collections for each row execute function private.tg_activity();
create trigger products_activity after insert or update of status on public.products for each row execute function private.tg_activity();
create trigger approvals_activity after insert or update of status on public.approvals for each row execute function private.tg_activity();
create trigger markers_activity after insert on public.markers for each row execute function private.tg_activity();
create trigger tech_packs_activity after insert on public.tech_packs for each row execute function private.tg_activity();
create trigger org_members_activity after insert or delete or update of role on public.org_members for each row execute function private.tg_activity();
create trigger invites_activity after insert on public.invites for each row execute function private.tg_activity();

-- ---------------------------------------------------------------------------
-- Eventos de tela (lista fechada, com limite)
-- ---------------------------------------------------------------------------

-- Até 30 eventos por pessoa por minuto: o resto é ignorado sem erro (não atrapalha a tela).
create function public.log_event(p_org_id uuid, p_action text, p_entity_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_org_member(p_org_id) then
    raise exception 'Sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if p_action not in ('prova_aberta', 'molde_exportado', 'risco_exportado', 'ficha_baixada', 'grade_aberta') then
    raise exception 'Evento desconhecido.' using errcode = 'invalid_parameter_value';
  end if;
  if (select count(*) from public.activity_log a
      where a.user_id = auth.uid() and a.created_at > now() - interval '1 minute') >= 30 then
    return;
  end if;
  perform private.log_activity(p_org_id, p_action, case when p_entity_id is null then null else 'pattern' end, p_entity_id, '{}'::jsonb);
end;
$$;

revoke all on function public.log_event(uuid, text, uuid) from public, anon;
grant execute on function public.log_event(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Primeiros passos (onboarding): o que a pessoa já fez, sem ler o registro inteiro
-- ---------------------------------------------------------------------------

create function public.onboarding_progress()
returns table (has_profile boolean, has_org boolean, has_pattern boolean, has_prova boolean, has_approval boolean, has_invite boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (select m.org_id from public.org_members m where m.user_id = auth.uid())
  select
    exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.first_name is not null),
    exists (select 1 from mine),
    exists (select 1 from public.patterns pt where pt.org_id in (select org_id from mine)),
    exists (select 1 from public.activity_log a where a.user_id = auth.uid() and a.action = 'prova_aberta'),
    exists (select 1 from public.approvals ap where ap.org_id in (select org_id from mine)),
    exists (select 1 from public.invites i where i.org_id in (select org_id from mine))
      or exists (select 1 from public.org_members m2 where m2.org_id in (select org_id from mine) and m2.user_id <> auth.uid())
  where auth.uid() is not null
$$;

revoke all on function public.onboarding_progress() from public, anon;
grant execute on function public.onboarding_progress() to authenticated;
