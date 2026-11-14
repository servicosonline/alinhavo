-- Alinhavo · Fase 4 · Fila de encaixes (nest_jobs).
--
-- Regras:
--   * Pedido de encaixe (demanda e tecido de um produto, numa versão fixa do
--     molde) que espera na fila e vira um risco (markers) quando termina.
--   * O cálculo é no navegador de quem processa a fila (Web Worker); a
--     tabela é o contrato, e um processador fora da Vercel pode ler a mesma
--     tabela no futuro (docs/03-arquitetura.md, válvula de escape).
--   * Leitura: qualquer membro. Pôr na fila, processar, refazer e apagar:
--     owner, admin, modelista e estilista (private.can_edit_products).
--   * Ninguém escreve direto: só pelas funções abaixo.
--   * Quem pega um pedido tem um prazo (LEASE) renovado a cada aviso de
--     progresso. Aba fechada no meio: o prazo vence e o pedido volta a ficar
--     disponível; depois de 3 tentativas, vira erro.
--   * Só quem pegou (e ainda está no prazo) conclui ou marca erro.

create table public.nest_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  product_id uuid not null,
  pattern_id uuid,
  pattern_version integer not null check (pattern_version >= 1),
  width_mm integer not null check (width_mm between 100 and 5000),
  gap_mm numeric(4, 1) not null default 0 check (gap_mm >= 0 and gap_mm <= 50),
  one_way boolean not null default false,
  demand jsonb not null check (coalesce(jsonb_typeof(demand) = 'object' and demand <> '{}'::jsonb, false)),
  status text not null default 'fila' check (status in ('fila', 'rodando', 'pronto', 'erro')),
  progress numeric(4, 3) not null default 0 check (progress >= 0 and progress <= 1),
  attempts integer not null default 0 check (attempts >= 0),
  claimed_by uuid references auth.users (id) on delete set null,
  claimed_at timestamptz,
  lease_until timestamptz,
  marker_id uuid,
  error text check (char_length(error) <= 500),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  foreign key (product_id, org_id) references public.products (id, org_id) on delete cascade,
  foreign key (pattern_id, org_id) references public.patterns (id, org_id) on delete set null (pattern_id)
);
create index nest_jobs_org_status_idx on public.nest_jobs (org_id, status, created_at);
create index nest_jobs_product_id_idx on public.nest_jobs (product_id);

-- O risco pronto, ligado com org_id (nem quem está em duas organizações
-- liga o pedido de uma ao risco da outra).
alter table public.markers add constraint markers_id_org_id_key unique (id, org_id);
alter table public.nest_jobs add constraint nest_jobs_marker_id_org_id_fkey
  foreign key (marker_id, org_id) references public.markers (id, org_id) on delete set null (marker_id);

create trigger nest_jobs_updated_at before update on public.nest_jobs
  for each row execute function private.set_updated_at();

alter table public.nest_jobs enable row level security;

create policy nest_jobs_select on public.nest_jobs for select to authenticated using (private.is_org_member(org_id));
create policy nest_jobs_delete on public.nest_jobs for delete to authenticated using (private.can_edit_products(org_id));

revoke all on public.nest_jobs from anon;
revoke insert, update on public.nest_jobs from authenticated;
grant select, delete on public.nest_jobs to authenticated;

-- ---------------------------------------------------------------------------
-- Funções da fila
-- ---------------------------------------------------------------------------

/** Pedidos esperando (fila ou rodando) por organização. */
create function private.nest_queue_limit() returns integer language sql immutable as $$ select 50 $$;

create function public.enqueue_nest_job(
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
  if v_product.id is null or not private.can_edit_products(v_product.org_id) then
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

/**
 * Pega o pedido mais antigo da organização (na fila, ou rodando com o prazo
 * vencido) e marca como rodando para quem chamou. Nada para pegar: null.
 */
create function public.claim_nest_job(p_org_id uuid)
returns public.nest_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.nest_jobs;
begin
  if auth.uid() is null or not private.can_edit_products(p_org_id) then
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

/** Avisa o progresso (0 a 1) e renova o prazo. false: o pedido não é mais seu. */
create function public.nest_job_progress(p_job_id uuid, p_progress numeric)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.nest_jobs j
  set progress = least(1, greatest(0, coalesce(p_progress, 0))), lease_until = now() + interval '2 minutes'
  where j.id = p_job_id and j.status = 'rodando' and j.claimed_by = auth.uid() and j.lease_until >= now()
    and private.can_edit_products(j.org_id);
  return found;
end;
$$;

/** Conclui: grava o risco (create_marker) e liga ao pedido, tudo junto. */
create function public.finish_nest_job(p_job_id uuid, p_length_mm numeric, p_efficiency numeric, p_layout jsonb)
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
  if v_job.id is null or auth.uid() is null or not private.can_edit_products(v_job.org_id) then
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

/** Marca erro no pedido que está com você. */
create function public.fail_nest_job(p_job_id uuid, p_error text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.nest_jobs j
  set status = 'erro', error = left(coalesce(nullif(btrim(p_error), ''), 'Erro no encaixe.'), 500),
      claimed_by = null, lease_until = null, finished_at = now()
  where j.id = p_job_id and j.status = 'rodando' and j.claimed_by = auth.uid() and private.can_edit_products(j.org_id);
  return found;
end;
$$;

/** Devolve à fila o pedido que está com você (parou de processar); não conta tentativa. */
create function public.release_nest_job(p_job_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.nest_jobs j
  set status = 'fila', progress = 0, attempts = greatest(0, j.attempts - 1), claimed_by = null, claimed_at = null, lease_until = null
  where j.id = p_job_id and j.status = 'rodando' and j.claimed_by = auth.uid() and private.can_edit_products(j.org_id);
  return found;
end;
$$;

/** Põe de novo na fila um pedido com erro (tentativas zeradas). */
create function public.retry_nest_job(p_job_id uuid)
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
  where j.id = p_job_id and j.status = 'erro' and auth.uid() is not null and private.can_edit_products(j.org_id)
  returning * into v_job;
  if v_job.id is null then
    raise exception 'Pedido não encontrado, sem permissão ou sem erro para refazer.' using errcode = 'invalid_parameter_value';
  end if;
  return v_job;
end;
$$;

revoke all on function public.enqueue_nest_job(uuid, integer, jsonb, numeric, boolean) from public, anon;
revoke all on function public.claim_nest_job(uuid) from public, anon;
revoke all on function public.nest_job_progress(uuid, numeric) from public, anon;
revoke all on function public.finish_nest_job(uuid, numeric, numeric, jsonb) from public, anon;
revoke all on function public.fail_nest_job(uuid, text) from public, anon;
revoke all on function public.release_nest_job(uuid) from public, anon;
revoke all on function public.retry_nest_job(uuid) from public, anon;
grant execute on function public.enqueue_nest_job(uuid, integer, jsonb, numeric, boolean) to authenticated;
grant execute on function public.claim_nest_job(uuid) to authenticated;
grant execute on function public.nest_job_progress(uuid, numeric) to authenticated;
grant execute on function public.finish_nest_job(uuid, numeric, numeric, jsonb) to authenticated;
grant execute on function public.fail_nest_job(uuid, text) to authenticated;
grant execute on function public.release_nest_job(uuid) to authenticated;
grant execute on function public.retry_nest_job(uuid) to authenticated;
