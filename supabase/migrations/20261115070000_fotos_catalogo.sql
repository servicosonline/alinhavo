-- Alinhavo · Fase 6d-1 · Fotos de catálogo geradas por IA (a partir da Prova).
--
-- Regras:
--   * Cada foto nasce de uma geração reservada em ai_generations, com o novo
--     tipo `foto_catalogo` (reserve_ai_generation confere a permissão de quem
--     edita produtos). O id da foto É o id da geração.
--   * Limite por tipo: textos seguem com 200 por organização por mês; fotos têm
--     o seu, private.ai_photo_monthly_limit() = 30 (custam bem mais).
--   * A imagem fica no Storage, bucket privado `catalogo`, no caminho
--     `<org_id>/<product_id>/<id da geração>.(jpg|png|webp)`, até 5 MB. Só quem
--     reservou a geração envia, e só enquanto ela está "reservada" (o servidor do
--     app envia com a sessão da pessoa logo depois da resposta da IA). Membros
--     leem; quem edita produtos apaga.
--   * A foto só aparece na tabela por create_catalog_photo, que confere a
--     geração e se o arquivo existe. Quem edita produtos apaga (o app apaga o
--     arquivo antes). Ninguém altera.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogo', 'catalogo', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Tipo novo de geração e limite por tipo
-- ---------------------------------------------------------------------------

alter table public.ai_generations drop constraint ai_generations_kind_check;
alter table public.ai_generations add constraint ai_generations_kind_check check (kind in ('textos_produto', 'foto_catalogo'));
create index ai_generations_org_kind_month_idx on public.ai_generations (org_id, kind, created_at);

create function private.ai_photo_monthly_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 30 $$;

create function private.ai_kind_limit(p_kind text)
returns integer
language sql
immutable
set search_path = ''
as $$ select case p_kind when 'foto_catalogo' then private.ai_photo_monthly_limit() else private.ai_monthly_limit() end $$;

-- Antes: contava todos os tipos juntos. Agora, por tipo (padrão: textos, como era).
drop function public.ai_generations_this_month(uuid);
create function public.ai_generations_this_month(p_org_id uuid, p_kind text default 'textos_produto')
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.ai_generations g
  where g.org_id = p_org_id
    and g.kind = p_kind
    and g.status <> 'erro'
    and g.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc'
    and private.is_org_member(p_org_id)
$$;

revoke all on function public.ai_generations_this_month(uuid, text) from public, anon;
grant execute on function public.ai_generations_this_month(uuid, text) to authenticated;

create or replace function public.reserve_ai_generation(p_product_id uuid, p_kind text default 'textos_produto')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_used integer;
  v_limit integer;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_product from public.products p where p.id = p_product_id;
  if v_product.id is null or not private.can_edit_products(v_product.org_id) then
    raise exception 'Produto não encontrado ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if p_kind is null or p_kind not in ('textos_produto', 'foto_catalogo') then
    raise exception 'Tipo de geração desconhecido.' using errcode = 'invalid_parameter_value';
  end if;
  v_limit := private.ai_kind_limit(p_kind);
  -- Trava por organização: dois pedidos ao mesmo tempo não passam juntos do limite.
  perform pg_advisory_xact_lock(hashtext('ai_generations:' || v_product.org_id::text));
  select count(*) into v_used from public.ai_generations g
  where g.org_id = v_product.org_id
    and g.kind = p_kind
    and g.status <> 'erro'
    and g.created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  if v_used >= v_limit then
    if p_kind = 'foto_catalogo' then
      raise exception 'A organização usou as % fotos de catálogo por IA deste mês. O limite volta no dia 1.', v_limit
        using errcode = 'program_limit_exceeded';
    end if;
    raise exception 'A organização usou as % gerações por IA deste mês. O limite volta no dia 1.', v_limit
      using errcode = 'program_limit_exceeded';
  end if;
  insert into public.ai_generations (org_id, product_id, kind) values (v_product.org_id, v_product.id, p_kind)
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fotos
-- ---------------------------------------------------------------------------

create table public.catalog_photos (
  id uuid primary key references public.ai_generations (id) on delete cascade,
  org_id uuid not null,
  product_id uuid not null,
  path text not null unique check (char_length(path) <= 200),
  -- Opções escolhidas na tela (modelo, cenário, qualidade, ângulo da captura…), formato 1.
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 8000),
  model text check (char_length(model) <= 80),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (product_id, org_id) references public.products (id, org_id) on delete cascade
);
create index catalog_photos_product_idx on public.catalog_photos (product_id, created_at desc);
create index catalog_photos_org_id_idx on public.catalog_photos (org_id);

alter table public.catalog_photos enable row level security;
create policy catalog_photos_select on public.catalog_photos for select to authenticated
  using (private.is_org_member(org_id));
create policy catalog_photos_delete on public.catalog_photos for delete to authenticated
  using (private.can_edit_products(org_id));
revoke all on public.catalog_photos from anon;
revoke insert, update on public.catalog_photos from authenticated;

-- ---------------------------------------------------------------------------
-- Caminho no Storage: <org_id>/<product_id>/<generation_id>.(jpg|png|webp)
-- ---------------------------------------------------------------------------

-- Partes do caminho, se ele tem o formato certo: (org, produto, geração); null se não.
create function private.catalog_path_parts(p_name text)
returns uuid[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_parts text[] := string_to_array(p_name, '/');
  v_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_file text;
begin
  if array_length(v_parts, 1) is distinct from 3 or v_parts[1] !~ v_uuid or v_parts[2] !~ v_uuid then
    return null;
  end if;
  v_file := v_parts[3];
  if v_file !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$' then
    return null;
  end if;
  return array[v_parts[1]::uuid, v_parts[2]::uuid, split_part(v_file, '.', 1)::uuid];
end;
$$;

-- Enviar: quem reservou a geração de foto daquele produto, enquanto ela está reservada.
create function private.can_upload_catalog_photo(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select exists (
      select 1 from public.ai_generations g
      where g.id = p[3] and g.org_id = p[1] and g.product_id = p[2]
        and g.kind = 'foto_catalogo' and g.status = 'reservada' and g.created_by = auth.uid()
        and private.can_edit_products(g.org_id)
    )
    from (select private.catalog_path_parts(p_name) as p) x
    where x.p is not null
  ), false)
$$;

-- Ver: qualquer membro da organização do caminho.
create function private.can_read_catalog_photo(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.is_org_member(p[1]) from (select private.catalog_path_parts(p_name) as p) x where x.p is not null), false)
$$;

-- Apagar: quem edita produtos da organização do caminho.
create function private.can_delete_catalog_photo(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.can_edit_products(p[1]) from (select private.catalog_path_parts(p_name) as p) x where x.p is not null), false)
$$;

revoke all on function private.catalog_path_parts(text) from public, anon;
revoke all on function private.can_upload_catalog_photo(text) from public, anon;
revoke all on function private.can_read_catalog_photo(text) from public, anon;
revoke all on function private.can_delete_catalog_photo(text) from public, anon;
grant execute on function private.catalog_path_parts(text) to authenticated;
grant execute on function private.can_upload_catalog_photo(text) to authenticated;
grant execute on function private.can_read_catalog_photo(text) to authenticated;
grant execute on function private.can_delete_catalog_photo(text) to authenticated;

create policy catalogo_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogo' and private.can_upload_catalog_photo(name));
create policy catalogo_select on storage.objects for select to authenticated
  using (bucket_id = 'catalogo' and private.can_read_catalog_photo(name));
create policy catalogo_delete on storage.objects for delete to authenticated
  using (bucket_id = 'catalogo' and private.can_delete_catalog_photo(name));

-- ---------------------------------------------------------------------------
-- Registrar a foto (depois de enviar o arquivo; antes de finish_ai_generation)
-- ---------------------------------------------------------------------------

create function public.create_catalog_photo(p_generation_id uuid, p_ext text, p_settings jsonb default '{}'::jsonb, p_model text default null)
returns public.catalog_photos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gen public.ai_generations;
  v_path text;
  v_photo public.catalog_photos;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_gen from public.ai_generations g where g.id = p_generation_id for update;
  if v_gen.id is null or v_gen.created_by is distinct from auth.uid() or v_gen.kind <> 'foto_catalogo'
    or not private.can_edit_products(v_gen.org_id) then
    raise exception 'Geração não encontrada ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if v_gen.status <> 'reservada' then
    raise exception 'Geração já encerrada.' using errcode = 'invalid_parameter_value';
  end if;
  if p_ext is null or p_ext not in ('jpg', 'png', 'webp') then
    raise exception 'Formato da foto inválido.' using errcode = 'invalid_parameter_value';
  end if;
  v_path := v_gen.org_id::text || '/' || v_gen.product_id::text || '/' || v_gen.id::text || '.' || p_ext;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'catalogo' and o.name = v_path) then
    raise exception 'A foto não foi enviada.' using errcode = 'invalid_parameter_value';
  end if;
  insert into public.catalog_photos (id, org_id, product_id, path, settings, model)
  values (v_gen.id, v_gen.org_id, v_gen.product_id, v_path, coalesce(p_settings, '{}'::jsonb), left(p_model, 80))
  returning * into v_photo;
  return v_photo;
end;
$$;

revoke all on function public.create_catalog_photo(uuid, text, jsonb, text) from public, anon;
grant execute on function public.create_catalog_photo(uuid, text, jsonb, text) to authenticated;
