-- Alinhavo · Link de acompanhamento para a cliente (produto ou coleção).
--
-- Regras:
--   * Quem edita produtos cria o link de um produto ou de uma coleção e escolhe o que a cliente vê:
--     status, prazos, cronograma, imagens da última aprovação e o molde (nome e versão).
--   * Sem conta, a cliente lê só por public_tracking(token): a função monta a resposta e só põe nela o
--     que foi marcado. O resto nunca sai do banco. touch_tracking(token) marca quando ela abriu.
--   * Validade de 1 a 90 dias, ou sem prazo até cancelar (revoked_at). Até 50 links ativos por organização.
--   * Ninguém escreve na tabela direto: só create_tracking_link e revoke_tracking_link. Membros leem.

create table public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  kind text not null check (kind in ('produto', 'colecao')),
  product_id uuid,
  collection_id uuid,
  token uuid not null unique default gen_random_uuid(),
  show jsonb not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_opened_at timestamptz,
  open_count integer not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint tracking_links_target check (
    (kind = 'produto' and product_id is not null and collection_id is null)
    or (kind = 'colecao' and collection_id is not null and product_id is null)
  ),
  foreign key (product_id, org_id) references public.products (id, org_id) on delete cascade,
  foreign key (collection_id, org_id) references public.collections (id, org_id) on delete cascade
);

create index tracking_links_org on public.tracking_links (org_id, created_at desc);

alter table public.tracking_links enable row level security;

create policy tracking_links_select on public.tracking_links for select to authenticated
  using (private.is_org_member(org_id));

revoke all on public.tracking_links from anon, authenticated;
-- O token é o segredo do link: a equipe lê para copiar de novo (como o convite).
grant select on public.tracking_links to authenticated;

-- As opções aceitas, todas booleanas.
create function private.tracking_show_ok(p_show jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_show) = 'object'
    and not exists (
      select 1 from jsonb_each(p_show) e
      where e.key not in ('status', 'prazos', 'cronograma', 'imagens', 'molde') or jsonb_typeof(e.value) <> 'boolean'
    )
    and exists (select 1 from jsonb_each(p_show) e where e.value = 'true'::jsonb)
$$;

create function public.create_tracking_link(p_kind text, p_target uuid, p_show jsonb, p_days integer default null)
returns table (id uuid, token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_link public.tracking_links;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  if p_kind = 'produto' then
    select p.org_id into v_org from public.products p where p.id = p_target;
  elsif p_kind = 'colecao' then
    select c.org_id into v_org from public.collections c where c.id = p_target;
  else
    raise exception 'Tipo de link inválido.' using errcode = 'invalid_parameter_value';
  end if;
  if v_org is null or not private.can_edit_products(v_org) then
    raise exception 'Não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if not private.tracking_show_ok(p_show) then
    raise exception 'Escolha pelo menos uma coisa para a cliente ver.' using errcode = 'invalid_parameter_value';
  end if;
  if p_days is not null and (p_days < 1 or p_days > 90) then
    raise exception 'A validade vai de 1 a 90 dias.' using errcode = 'invalid_parameter_value';
  end if;
  if (select count(*) from public.tracking_links t
      where t.org_id = v_org and t.revoked_at is null and (t.expires_at is null or t.expires_at > now())) >= 50 then
    raise exception 'A organização já tem 50 links de acompanhamento ativos. Cancele algum antes.' using errcode = 'program_limit_exceeded';
  end if;

  insert into public.tracking_links (org_id, kind, product_id, collection_id, show, expires_at)
  values (
    v_org,
    p_kind,
    case when p_kind = 'produto' then p_target end,
    case when p_kind = 'colecao' then p_target end,
    p_show,
    case when p_days is null then null else now() + make_interval(days => p_days) end
  )
  returning * into v_link;

  perform private.log_activity(v_org, 'acompanhamento_criado', case when p_kind = 'produto' then 'product' else 'collection' end, p_target, jsonb_build_object('dias', p_days));
  return query select v_link.id, v_link.token;
end;
$$;

revoke all on function public.create_tracking_link(text, uuid, jsonb, integer) from public, anon;
grant execute on function public.create_tracking_link(text, uuid, jsonb, integer) to authenticated;

create function public.revoke_tracking_link(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select t.org_id into v_org from public.tracking_links t where t.id = p_id;
  if v_org is null or not private.can_edit_products(v_org) then
    raise exception 'Não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  update public.tracking_links set revoked_at = coalesce(revoked_at, now()) where id = p_id;
end;
$$;

revoke all on function public.revoke_tracking_link(uuid) from public, anon;
grant execute on function public.revoke_tracking_link(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Leitura pública (sem conta)
-- ---------------------------------------------------------------------------

-- Um produto no formato da página, só com o que o link mostra. `p_all_images`: todas as imagens da última
-- aprovação (link de produto) ou só a primeira (link de coleção, para não pesar).
create function private.tracking_product_json(p public.products, p_show jsonb, p_all_images boolean)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'name', p.name,
    'reference', p.reference,
    'status', case when (p_show ->> 'status')::boolean then p.status end,
    'due_on', case when (p_show ->> 'prazos')::boolean then p.due_on end,
    'pattern', case when (p_show ->> 'molde')::boolean and p.pattern_id is not null then (
      select jsonb_build_object('name', pt.name, 'version', pt.current_version) from public.patterns pt where pt.id = p.pattern_id
    ) end,
    'images', case when (p_show ->> 'imagens')::boolean and p.pattern_id is not null then (
      select coalesce(jsonb_agg(jsonb_build_object('angle', i.angle, 'mime', i.mime, 'data', encode(i.data, 'base64')) order by i.position), '[]'::jsonb)
      from public.approval_images i
      where i.approval_id = (
        select a.id from public.approvals a where a.pattern_id = p.pattern_id and a.org_id = p.org_id order by a.created_at desc limit 1
      ) and (p_all_images or i.position = (
        select min(i2.position) from public.approval_images i2 where i2.approval_id = i.approval_id
      ))
    ) end
  ))
$$;

revoke all on function private.tracking_product_json(public.products, jsonb, boolean) from public, anon, authenticated;

create function public.public_tracking(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'kind', t.kind,
    'org_name', o.name,
    'title', coalesce(pr.name, co.name),
    'collection_name', coalesce(pc.name, co.name),
    'launch_on', case when (t.show ->> 'prazos')::boolean then coalesce(pc.launch_on, co.launch_on) end,
    'show', t.show,
    'expires_at', t.expires_at,
    'products', case
      when t.kind = 'produto' then jsonb_build_array(private.tracking_product_json(pr, t.show, true))
      else coalesce((
        select jsonb_agg(private.tracking_product_json(p2, t.show, false) order by p2.created_at)
        from (select * from public.products p where p.collection_id = co.id and p.org_id = t.org_id order by p.created_at limit 60) p2
      ), '[]'::jsonb)
    end,
    'milestones', case when (t.show ->> 'cronograma')::boolean then coalesce((
      select jsonb_agg(jsonb_build_object('title', m.title, 'due_on', m.due_on, 'done', m.done_at is not null) order by m.due_on)
      from public.milestones m where m.collection_id = coalesce(pr.collection_id, co.id) and m.org_id = t.org_id
    ), '[]'::jsonb) end
  ))
  from public.tracking_links t
  join public.orgs o on o.id = t.org_id
  left join public.products pr on pr.id = t.product_id
  left join public.collections pc on pc.id = pr.collection_id
  left join public.collections co on co.id = t.collection_id
  where t.token = p_token and t.revoked_at is null and (t.expires_at is null or t.expires_at > now())
$$;

revoke all on function public.public_tracking(uuid) from public;
grant execute on function public.public_tracking(uuid) to anon, authenticated;

-- A cliente abriu: guarda quando (a equipe vê "aberto há 2 h"). Link inválido não faz nada.
create function public.touch_tracking(p_token uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.tracking_links
  set last_opened_at = now(), open_count = open_count + 1
  where token = p_token and revoked_at is null and (expires_at is null or expires_at > now())
$$;

revoke all on function public.touch_tracking(uuid) from public;
grant execute on function public.touch_tracking(uuid) to anon, authenticated;
