-- Alinhavo · Capa da organização, prazo de entrega do produto e novo limite de IA.
--
-- Regras:
--   * Capa: imagem quadrada no bucket público `org-capas`, caminho `<org_id>/<nome>.webp|jpg|png`,
--     até 300 KB. Só dono e admin enviam, trocam e apagam (como mudar o nome da organização).
--     orgs.thumbnail_path só aponta para a pasta da própria organização.
--   * Prazo: products.due_on (data de entrega do produto). Quem edita produtos define; todo
--     membro lê. Atraso é calculado na tela (lib/collection.ts), como nas etapas da coleção.
--   * IA: limite por organização por mês passa de 200 textos + 30 fotos para 50 textos + 10 fotos
--     (decisão do Paulo, 15/11/2026, junto com o preço de lançamento do pacote Confecção).

-- ---------------------------------------------------------------------------
-- Capa da organização
-- ---------------------------------------------------------------------------

alter table public.orgs
  add column thumbnail_path text check (char_length(thumbnail_path) <= 200),
  add constraint orgs_thumbnail_own check (thumbnail_path is null or split_part(thumbnail_path, '/', 1) = id::text);

grant update (thumbnail_path) on public.orgs to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-capas', 'org-capas', true, 307200, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- O caminho é <org_id>/<nome>.(webp|jpg|png) e quem chama é dono ou admin dessa organização.
create function private.can_manage_org_cover(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{1,64}\.(webp|jpg|png)$' then
    return false;
  end if;
  return private.has_org_role(split_part(p_name, '/', 1)::uuid, array['owner', 'admin']::public.org_role[]);
end;
$$;

revoke all on function private.can_manage_org_cover(text) from public, anon;
grant execute on function private.can_manage_org_cover(text) to authenticated;

create policy org_capas_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'org-capas' and private.can_manage_org_cover(name));
create policy org_capas_select on storage.objects for select to authenticated
  using (bucket_id = 'org-capas' and private.can_manage_org_cover(name));
create policy org_capas_delete on storage.objects for delete to authenticated
  using (bucket_id = 'org-capas' and private.can_manage_org_cover(name));

-- ---------------------------------------------------------------------------
-- Prazo de entrega do produto
-- ---------------------------------------------------------------------------

alter table public.products add column due_on date;

grant insert (due_on) on public.products to authenticated;
grant update (due_on) on public.products to authenticated;

-- ---------------------------------------------------------------------------
-- Limite de IA (por organização, por mês)
-- ---------------------------------------------------------------------------

create or replace function private.ai_monthly_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 50 $$;

create or replace function private.ai_photo_monthly_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 10 $$;
