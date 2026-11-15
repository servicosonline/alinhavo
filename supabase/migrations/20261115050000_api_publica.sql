-- Alinhavo · Fase 6c · API pública de leitura (para ERP e integrações).
--
-- Regras:
--   * Chave de API por organização, criada e revogada só por dono e admin.
--     O segredo (alv_ + 64 hex) aparece uma vez, na criação; o banco guarda
--     só o hash SHA-256 e o começo (prefix), para reconhecer a chave na tela.
--   * As rotas /api/v1 do app chamam as funções api_* com a chave publicável
--     (sem login e sem a chave de serviço). Cada função confere a chave por
--     private.api_org (hash, revogação e limite por minuto) e só devolve dados
--     da organização dona da chave. Só leitura.
--   * Chave errada e revogada dão o mesmo erro (28000). Passou do limite: 54000.
--   * Ninguém escreve nas tabelas direto.

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  prefix text not null check (char_length(prefix) = 12),
  key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index api_keys_org_id_idx on public.api_keys (org_id);

-- Pedidos por chave e minuto (o limite de uso).
create table public.api_key_usage (
  org_id uuid not null references public.orgs (id) on delete cascade,
  key_id uuid not null references public.api_keys (id) on delete cascade,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key_id, window_start)
);

alter table public.api_keys enable row level security;
alter table public.api_key_usage enable row level security;

create policy api_keys_select on public.api_keys for select to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

-- O hash nunca sai: só as colunas da tela.
revoke all on public.api_keys, public.api_key_usage from anon, authenticated;
grant select (id, org_id, name, prefix, created_by, created_at, last_used_at, revoked_at) on public.api_keys to authenticated;

-- Pedidos por minuto por chave.
create function private.api_rate_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 60 $$;

-- Chaves ativas por organização, no máximo.
create function private.api_max_keys()
returns integer
language sql
immutable
set search_path = ''
as $$ select 20 $$;

-- ---------------------------------------------------------------------------
-- Criar e revogar (dono e admin)
-- ---------------------------------------------------------------------------

create function public.create_api_key(p_org_id uuid, p_name text)
returns table (id uuid, secret text, prefix text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_name text := btrim(coalesce(p_name, ''));
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  if not private.has_org_role(p_org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'Só donos e admins criam chaves de API.' using errcode = 'insufficient_privilege';
  end if;
  if char_length(v_name) not between 1 and 80 then
    raise exception 'Dê um nome à chave (até 80 caracteres), como "ERP".' using errcode = 'invalid_parameter_value';
  end if;
  if (select count(*) from public.api_keys k where k.org_id = p_org_id and k.revoked_at is null) >= private.api_max_keys() then
    raise exception 'A organização já tem % chaves ativas. Revogue uma antes.', private.api_max_keys() using errcode = 'invalid_parameter_value';
  end if;
  -- 64 hex de dois uuid aleatórios (v4: 244 bits de acaso).
  v_secret := 'alv_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.api_keys (org_id, name, prefix, key_hash)
  values (p_org_id, v_name, left(v_secret, 12), encode(sha256(convert_to(v_secret, 'UTF8')), 'hex'))
  returning api_keys.id into v_id;
  return query select v_id, v_secret, left(v_secret, 12);
end;
$$;

revoke all on function public.create_api_key(uuid, text) from public, anon;
grant execute on function public.create_api_key(uuid, text) to authenticated;

create function public.revoke_api_key(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key public.api_keys;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_key from public.api_keys k where k.id = p_id;
  if v_key.id is null or not private.has_org_role(v_key.org_id, array['owner', 'admin']::public.org_role[]) then
    raise exception 'Chave não encontrada ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  update public.api_keys set revoked_at = coalesce(revoked_at, now()) where id = p_id;
end;
$$;

revoke all on function public.revoke_api_key(uuid) from public, anon;
grant execute on function public.revoke_api_key(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Conferir a chave (todas as funções api_* passam por aqui)
-- ---------------------------------------------------------------------------

-- A organização dona da chave. Erro 28000 se a chave não vale; 54000 se passou do limite do minuto.
create function private.api_org(p_key text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key public.api_keys;
  v_window timestamptz := date_trunc('minute', now());
  v_count integer;
begin
  if p_key is null or p_key !~ '^alv_[0-9a-f]{64}$' then
    raise exception 'Chave de API inválida ou revogada.' using errcode = 'invalid_authorization_specification';
  end if;
  select * into v_key from public.api_keys k
  where k.key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex') and k.revoked_at is null;
  if v_key.id is null then
    raise exception 'Chave de API inválida ou revogada.' using errcode = 'invalid_authorization_specification';
  end if;

  insert into public.api_key_usage as u (org_id, key_id, window_start, count) values (v_key.org_id, v_key.id, v_window, 1)
  on conflict (key_id, window_start) do update set count = u.count + 1
  returning u.count into v_count;
  if v_count > private.api_rate_limit() then
    raise exception 'Limite de % pedidos por minuto por chave. Tente de novo em um minuto.', private.api_rate_limit()
      using errcode = 'program_limit_exceeded';
  end if;

  -- Limpeza do que já passou e o último uso (no máximo uma escrita por minuto).
  if v_count = 1 then
    delete from public.api_key_usage u where u.key_id = v_key.id and u.window_start < v_window - interval '10 minutes';
    update public.api_keys set last_used_at = now() where id = v_key.id;
  end if;
  return v_key.org_id;
end;
$$;

revoke all on function private.api_org(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Leitura (com a chave, sem login)
-- ---------------------------------------------------------------------------

-- Um produto como a API mostra.
create function private.api_product_json(p public.products)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'referencia', p.reference,
    'nome', p.name,
    'status', p.status,
    'colecao', (select jsonb_build_object('id', c.id, 'nome', c.name) from public.collections c where c.id = p.collection_id),
    'molde', (select jsonb_build_object('id', m.id, 'nome', m.name, 'versao', m.current_version) from public.patterns m where m.id = p.pattern_id),
    'tecido', (
      select jsonb_build_object(
        'nome', f.name, 'composicao', f.composition, 'largura_mm', f.width_mm,
        'gramatura_gm2', f.weight_gsm, 'preco_centavos_metro', f.price_cents
      )
      from public.fabrics f where f.id = p.fabric_id
    ),
    'aviamentos', coalesce((
      select jsonb_agg(
        jsonb_build_object('nome', t.name, 'quantidade', t.quantity, 'unidade', t.unit, 'preco_centavos', t.unit_price_cents)
        order by t.position, t.created_at
      )
      from public.product_trims t where t.product_id = p.id
    ), '[]'::jsonb),
    'texto_venda', p.sales_description,
    'texto_tecnico', p.technical_description,
    'criado_em', p.created_at,
    'atualizado_em', p.updated_at
  )
$$;

revoke all on function private.api_product_json(public.products) from public, anon, authenticated;

-- Produtos da organização, em páginas de até 100, pela ordem do id (cursor: o último id da página).
create function public.api_products(p_key text, p_limit integer default 50, p_after uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.api_org(p_key);
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_items jsonb;
  v_last uuid;
  v_count integer;
begin
  select coalesce(jsonb_agg(private.api_product_json(p) order by p.id), '[]'::jsonb), max(p.id::text)::uuid, count(*)
  into v_items, v_last, v_count
  from (
    select * from public.products x
    where x.org_id = v_org and (p_after is null or x.id > p_after)
    order by x.id
    limit v_limit
  ) p;
  return jsonb_build_object('itens', v_items, 'proximo', case when v_count = v_limit then v_last end);
end;
$$;

-- Um produto (null se não é da organização da chave).
create function public.api_product(p_key text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.api_org(p_key);
begin
  return (select private.api_product_json(p) from public.products p where p.id = p_id and p.org_id = v_org);
end;
$$;

-- A ficha técnica mais recente do produto (null sem ficha ou de outra organização).
create function public.api_tech_pack(p_key text, p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.api_org(p_key);
begin
  return (
    select jsonb_build_object('numero', t.number, 'versao_molde', t.pattern_version, 'gerada_em', t.created_at, 'dados', t.data)
    from public.tech_packs t
    where t.product_id = p_product_id and t.org_id = v_org
    order by t.number desc
    limit 1
  );
end;
$$;

-- Os riscos do produto, sem o desenho (null se o produto não é da organização).
create function public.api_markers(p_key text, p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.api_org(p_key);
begin
  if not exists (select 1 from public.products p where p.id = p_product_id and p.org_id = v_org) then
    return null;
  end if;
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'numero', m.number, 'versao_molde', m.pattern_version, 'largura_mm', m.width_mm,
        'comprimento_mm', m.length_mm, 'aproveitamento', m.efficiency, 'demanda', m.demand, 'criado_em', m.created_at
      )
      order by m.number
    )
    from public.markers m where m.product_id = p_product_id and m.org_id = v_org
  ), '[]'::jsonb);
end;
$$;

-- As coleções da organização.
create function public.api_collections(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.api_org(p_key);
begin
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', c.id, 'nome', c.name, 'temporada', c.season, 'inicio', c.starts_on,
        'lancamento', c.launch_on, 'arquivada_em', c.archived_at
      )
      order by c.created_at
    )
    from public.collections c where c.org_id = v_org
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.api_products(text, integer, uuid) from public;
revoke all on function public.api_product(text, uuid) from public;
revoke all on function public.api_tech_pack(text, uuid) from public;
revoke all on function public.api_markers(text, uuid) from public;
revoke all on function public.api_collections(text) from public;
grant execute on function public.api_products(text, integer, uuid) to anon, authenticated;
grant execute on function public.api_product(text, uuid) to anon, authenticated;
grant execute on function public.api_tech_pack(text, uuid) to anon, authenticated;
grant execute on function public.api_markers(text, uuid) to anon, authenticated;
grant execute on function public.api_collections(text) to anon, authenticated;
