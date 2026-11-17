-- Alinhavo · Bloqueio por plano e encaixe só para quem edita moldes (17/11/2026).
--
-- Decisões do Paulo (17/11/2026):
--   * O encaixe e a fila de riscos são da modelista, não da estilista:
--     owner, admin e modelista (private.can_nest). Leitura continua para todos.
--   * O plano passa a valer. O que cada plano libera segue a página de preço
--     (apps/web/src/lib/plans.ts, `planAllows`, com a mesma tabela):
--       Grátis     1 molde salvo, Molde e Prova 3D, 1 pessoa.
--       Modelista  + moldes sem limite, aprovação por link, Scan e exportar, equipe.
--       Confecção  tudo: + coleção, produtos, ficha, tecidos, comentários,
--                  encaixe e fila, IA, acompanhamento, API e webhooks.
--       Estilista  (não publicado) coleção e aprovação, sem encaixe nem Scan.
--   * Plano que vale agora (private.org_plan): ativa e cortesia = o plano
--     gravado; teste no prazo = o plano gravado; teste vencido ou cancelado =
--     Grátis. Ninguém perde o que fez: a leitura continua liberada.
--   * Planos pagos: equipe sem limite de pessoas. Grátis: só 1 pessoa.
--   * Recusa por plano usa o código 54000 (program_limit_exceeded), que passa
--     pela tela (lib/db-error.ts) com a mensagem em português.

-- ---------------------------------------------------------------------------
-- Plano que vale agora e o que ele libera
-- ---------------------------------------------------------------------------

create function private.org_plan(p_org_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when s.status in ('ativa', 'cortesia') then s.plan_id
      when s.status = 'trial' and s.trial_ends_at > now() then s.plan_id
      else 'gratis'
    end
    from public.org_subscriptions s
    where s.org_id = p_org_id
  ), 'gratis');
$$;

create function private.plan_allows(p_org_id uuid, p_feature text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_feature
    when 'moldes' then p.plan in ('modelista', 'estilista', 'confeccao')
    when 'equipe' then p.plan in ('modelista', 'estilista', 'confeccao')
    when 'aprovacao' then p.plan in ('modelista', 'estilista', 'confeccao')
    when 'scan' then p.plan in ('modelista', 'confeccao')
    when 'colecao' then p.plan in ('estilista', 'confeccao')
    when 'encaixe' then p.plan = 'confeccao'
    when 'api' then p.plan = 'confeccao'
    else false
  end
  from (select private.org_plan(p_org_id) as plan) p;
$$;

-- Recusa com a mensagem do plano (54000 passa pela tela).
create function private.require_plan(p_org_id uuid, p_feature text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.plan_allows(p_org_id, p_feature) then
    raise exception '%', case p_feature
      when 'moldes' then 'O plano Grátis guarda 1 molde. Para criar e editar mais, assine o plano Modelista ou o Confecção.'
      when 'equipe' then 'O plano Grátis é para 1 pessoa. Para chamar a equipe, assine o plano Modelista ou o Confecção.'
      when 'aprovacao' then 'A aprovação por link é do plano Modelista ou do Confecção.'
      when 'scan' then 'O Scan de molde de papel é do plano Modelista ou do Confecção.'
      when 'colecao' then 'Coleção, produtos e ficha técnica são do plano Confecção.'
      when 'encaixe' then 'O encaixe e a fila de riscos são do plano Confecção.'
      when 'api' then 'A API e os webhooks são do plano Confecção.'
      else 'O plano desta organização não inclui este recurso.'
    end using errcode = 'program_limit_exceeded';
  end if;
end;
$$;

revoke all on function private.org_plan(uuid) from public;
revoke all on function private.plan_allows(uuid, text) from public;
revoke all on function private.require_plan(uuid, text) from public;
grant execute on function private.org_plan(uuid) to authenticated;
grant execute on function private.plan_allows(uuid, text) to authenticated;
grant execute on function private.require_plan(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Confecção: tudo o que passa por can_edit_products (coleção, produtos,
-- marcos, tecidos, aviamentos, ficha, textos e fotos por IA, acompanhamento)
-- ---------------------------------------------------------------------------

create or replace function private.can_edit_products(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_org_role(p_org_id, array['owner', 'admin', 'modelista', 'estilista']::public.org_role[])
    and private.plan_allows(p_org_id, 'colecao');
$$;

-- Comentários também são do Confecção (ler continua liberado).
drop policy comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated
  with check (private.is_org_member(org_id) and author = auth.uid() and private.plan_allows(org_id, 'colecao'));

-- ---------------------------------------------------------------------------
-- Travas por gatilho (a mensagem chega à tela)
-- ---------------------------------------------------------------------------

-- Grátis: 1 molde por organização.
create function private.plan_check_pattern()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.plan_allows(new.org_id, 'moldes')
    and exists (select 1 from public.patterns p where p.org_id = new.org_id) then
    perform private.require_plan(new.org_id, 'moldes');
  end if;
  return new;
end;
$$;
create trigger patterns_plano before insert on public.patterns
  for each row execute function private.plan_check_pattern();

-- Versão nova: no Grátis, só no primeiro molde da organização; Scan só nos planos com Scan.
create function private.plan_check_pattern_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.origin = 'scan' then
    perform private.require_plan(new.org_id, 'scan');
  end if;
  if not private.plan_allows(new.org_id, 'moldes') and new.pattern_id is distinct from (
    select p.id from public.patterns p where p.org_id = new.org_id order by p.created_at, p.id limit 1
  ) then
    perform private.require_plan(new.org_id, 'moldes');
  end if;
  return new;
end;
$$;
create trigger pattern_versions_plano before insert on public.pattern_versions
  for each row execute function private.plan_check_pattern_version();

-- Aprovação por link.
create function private.plan_check_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_plan(new.org_id, 'aprovacao');
  return new;
end;
$$;
create trigger approvals_plano before insert on public.approvals
  for each row execute function private.plan_check_approval();

-- Grátis: 1 pessoa (quem cria a organização sempre entra).
create function private.plan_check_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.org_members m where m.org_id = new.org_id and m.user_id <> new.user_id) then
    perform private.require_plan(new.org_id, 'equipe');
  end if;
  return new;
end;
$$;
create trigger org_members_plano before insert on public.org_members
  for each row execute function private.plan_check_member();

create function private.plan_check_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_plan(new.org_id, 'equipe');
  return new;
end;
$$;
create trigger invites_plano before insert on public.invites
  for each row execute function private.plan_check_invite();

-- API e webhooks: criar chave ou endereço.
create function private.plan_check_api()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_plan(new.org_id, 'api');
  return new;
end;
$$;
create trigger api_keys_plano before insert on public.api_keys
  for each row execute function private.plan_check_api();
create trigger webhook_endpoints_plano before insert on public.webhook_endpoints
  for each row execute function private.plan_check_api();

-- ---------------------------------------------------------------------------
-- Encaixe: quem edita moldes, no plano com encaixe
-- ---------------------------------------------------------------------------

create function private.can_nest(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_edit_patterns(p_org_id) and private.plan_allows(p_org_id, 'encaixe');
$$;

revoke all on function private.can_nest(uuid) from public;
grant execute on function private.can_nest(uuid) to authenticated;

drop policy markers_delete on public.markers;
create policy markers_delete on public.markers for delete to authenticated using (private.can_nest(org_id));
drop policy nest_jobs_delete on public.nest_jobs;
create policy nest_jobs_delete on public.nest_jobs for delete to authenticated using (private.can_nest(org_id));

-- As funções do encaixe e da fila, iguais às de 20261115000000 e 20261115010000,
-- trocando private.can_edit_products por private.can_nest.

create or replace function public.create_marker(
  p_product_id uuid,
  p_pattern_version integer,
  p_fabric_id uuid,
  p_width_mm integer,
  p_demand jsonb,
  p_length_mm numeric,
  p_efficiency numeric,
  p_layout jsonb
)
returns public.markers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_marker public.markers;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_product from public.products p where p.id = p_product_id for update;
  if v_product.id is null or not private.can_nest(v_product.org_id) then
    raise exception 'Produto não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if v_product.pattern_id is null then
    raise exception 'Ligue um molde ao produto antes de encaixar.' using errcode = 'invalid_parameter_value';
  end if;
  if not exists (
    select 1 from public.pattern_versions v where v.pattern_id = v_product.pattern_id and v.number = p_pattern_version
  ) then
    raise exception 'Essa versão do molde não existe.' using errcode = 'invalid_parameter_value';
  end if;
  if p_fabric_id is not null and not exists (
    select 1 from public.fabrics f where f.id = p_fabric_id and f.org_id = v_product.org_id
  ) then
    raise exception 'Tecido não encontrado.' using errcode = 'invalid_parameter_value';
  end if;

  insert into public.markers (
    org_id, product_id, number, pattern_id, pattern_version, fabric_id,
    width_mm, demand, length_mm, efficiency, layout, created_by
  )
  values (
    v_product.org_id,
    v_product.id,
    coalesce((select max(m.number) from public.markers m where m.product_id = v_product.id), 0) + 1,
    v_product.pattern_id,
    p_pattern_version,
    p_fabric_id,
    p_width_mm,
    p_demand,
    p_length_mm,
    p_efficiency,
    p_layout,
    auth.uid()
  )
  returning * into v_marker;
  return v_marker;
end;
$$;

create or replace function public.enqueue_nest_job(
  p_product_id uuid,
  p_width_mm integer,
  p_demand jsonb,
  p_gap_mm numeric,
  p_one_way boolean
)
returns public.nest_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_version integer;
  v_job public.nest_jobs;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_product from public.products p where p.id = p_product_id;
  if v_product.id is null or not private.can_nest(v_product.org_id) then
    raise exception 'Produto não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if v_product.pattern_id is null then
    raise exception 'Ligue um molde ao produto antes de encaixar.' using errcode = 'invalid_parameter_value';
  end if;
  select pt.current_version into v_version from public.patterns pt where pt.id = v_product.pattern_id;
  if coalesce(v_version, 0) < 1 then
    raise exception 'O molde ligado ainda não tem versão salva.' using errcode = 'invalid_parameter_value';
  end if;
  if jsonb_typeof(p_demand) is distinct from 'object' or p_demand = '{}'::jsonb or exists (
    select 1 from jsonb_each(p_demand) e
    where jsonb_typeof(e.value) <> 'number' or (e.value)::numeric <> trunc((e.value)::numeric)
      or (e.value)::numeric < 1 or (e.value)::numeric > 200 or char_length(e.key) not between 1 and 20
  ) then
    raise exception 'Demanda inválida: de 1 a 200 peças por tamanho.' using errcode = 'invalid_parameter_value';
  end if;
  if (select count(*) from public.nest_jobs j where j.org_id = v_product.org_id and j.status in ('fila', 'rodando')) >= private.nest_queue_limit() then
    raise exception 'A fila de encaixes está cheia (até 50 pedidos esperando).' using errcode = 'program_limit_exceeded';
  end if;

  insert into public.nest_jobs (org_id, product_id, pattern_id, pattern_version, width_mm, gap_mm, one_way, demand, created_by)
  values (v_product.org_id, v_product.id, v_product.pattern_id, v_version, p_width_mm, coalesce(p_gap_mm, 0), coalesce(p_one_way, false), p_demand, auth.uid())
  returning * into v_job;
  return v_job;
end;
$$;

create or replace function public.claim_nest_job(p_org_id uuid)
returns public.nest_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.nest_jobs;
begin
  if auth.uid() is null or not private.can_nest(p_org_id) then
    raise exception 'Sem permissão para processar a fila.' using errcode = 'insufficient_privilege';
  end if;

  -- Abandonado 3 vezes: erro, para não travar a fila.
  update public.nest_jobs j
  set status = 'erro', error = 'O encaixe parou 3 vezes sem terminar (aba fechada ou computador lento). Refaça com menos peças.',
      claimed_by = null, lease_until = null, finished_at = now()
  where j.org_id = p_org_id and j.status = 'rodando' and j.lease_until < now() and j.attempts >= 3;

  select * into v_job from public.nest_jobs j
  where j.org_id = p_org_id and (j.status = 'fila' or (j.status = 'rodando' and j.lease_until < now()))
  order by j.created_at, j.id
  limit 1
  for update skip locked;
  if v_job.id is null then
    return null;
  end if;

  update public.nest_jobs j
  set status = 'rodando', progress = 0, attempts = j.attempts + 1, claimed_by = auth.uid(),
      claimed_at = now(), lease_until = now() + interval '2 minutes', error = null
  where j.id = v_job.id
  returning * into v_job;
  return v_job;
end;
$$;

create or replace function public.nest_job_progress(p_job_id uuid, p_progress numeric)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.nest_jobs j
  set progress = least(1, greatest(0, coalesce(p_progress, 0))), lease_until = now() + interval '2 minutes'
  where j.id = p_job_id and j.status = 'rodando' and j.claimed_by = auth.uid() and j.lease_until >= now()
    and private.can_nest(j.org_id);
  return found;
end;
$$;

create or replace function public.finish_nest_job(p_job_id uuid, p_length_mm numeric, p_efficiency numeric, p_layout jsonb)
returns public.markers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.nest_jobs;
  v_fabric uuid;
  v_marker public.markers;
begin
  select * into v_job from public.nest_jobs j where j.id = p_job_id for update;
  if v_job.id is null or auth.uid() is null or not private.can_nest(v_job.org_id) then
    raise exception 'Pedido não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if v_job.status <> 'rodando' or v_job.claimed_by is distinct from auth.uid() or v_job.lease_until < now() then
    raise exception 'Este pedido não está mais com você (o prazo venceu ou outra pessoa pegou).' using errcode = 'invalid_parameter_value';
  end if;
  select p.fabric_id into v_fabric from public.products p where p.id = v_job.product_id;

  v_marker := public.create_marker(
    v_job.product_id, v_job.pattern_version, v_fabric, v_job.width_mm, v_job.demand, p_length_mm, p_efficiency, p_layout
  );
  update public.nest_jobs j
  set status = 'pronto', progress = 1, marker_id = v_marker.id, claimed_by = null, lease_until = null, finished_at = now()
  where j.id = v_job.id;
  return v_marker;
end;
$$;

create or replace function public.fail_nest_job(p_job_id uuid, p_error text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.nest_jobs j
  set status = 'erro', error = left(coalesce(nullif(btrim(p_error), ''), 'Erro no encaixe.'), 500),
      claimed_by = null, lease_until = null, finished_at = now()
  where j.id = p_job_id and j.status = 'rodando' and j.claimed_by = auth.uid() and private.can_nest(j.org_id);
  return found;
end;
$$;

create or replace function public.release_nest_job(p_job_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.nest_jobs j
  set status = 'fila', progress = 0, attempts = greatest(0, j.attempts - 1), claimed_by = null, claimed_at = null, lease_until = null
  where j.id = p_job_id and j.status = 'rodando' and j.claimed_by = auth.uid() and private.can_nest(j.org_id);
  return found;
end;
$$;

create or replace function public.retry_nest_job(p_job_id uuid)
returns public.nest_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.nest_jobs;
begin
  update public.nest_jobs j
  set status = 'fila', progress = 0, attempts = 0, error = null, finished_at = null
  where j.id = p_job_id and j.status = 'erro' and auth.uid() is not null and private.can_nest(j.org_id)
  returning * into v_job;
  if v_job.id is null then
    raise exception 'Pedido não encontrado, sem permissão ou sem erro para refazer.' using errcode = 'invalid_parameter_value';
  end if;
  return v_job;
end;
$$;
