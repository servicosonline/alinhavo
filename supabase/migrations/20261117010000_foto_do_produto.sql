-- Alinhavo · Foto do produto (a imagem que aparece ao lado da referência na lista da coleção).
--
-- Regras:
--   * A foto enviada pela equipe fica no Storage, bucket privado `produtos` (mostra a coleção antes do
--     lançamento), no caminho `<org_id>/<product_id>/<nome>.(webp|jpg|png)`, até 300 KB.
--   * Quem edita produtos (owner, admin, modelista, estilista: private.can_edit_products) envia, troca e
--     apaga; todo membro da organização lê.
--   * products.photo_path só aponta para a pasta do próprio produto. Sem foto enviada, a tela escolhe uma
--     automática (foto de catálogo, captura da aprovação, desenho técnico): nada disso fica no banco.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', false, 307200, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

alter table public.products
  add column photo_path text check (char_length(photo_path) <= 200),
  add constraint products_photo_own check (
    photo_path is null
    or (split_part(photo_path, '/', 1) = org_id::text and split_part(photo_path, '/', 2) = id::text)
  );

grant update (photo_path) on public.products to authenticated;

-- Organização do caminho, se ele tem o formato certo e o produto é dessa organização; null se não.
create function private.product_photo_org(p_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_product uuid;
begin
  if p_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{1,64}\.(webp|jpg|png)$' then
    return null;
  end if;
  v_org := split_part(p_name, '/', 1)::uuid;
  v_product := split_part(p_name, '/', 2)::uuid;
  if not exists (select 1 from public.products p where p.id = v_product and p.org_id = v_org) then
    return null;
  end if;
  return v_org;
end;
$$;

create function private.can_edit_product_photo(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select coalesce(private.can_edit_products(private.product_photo_org(p_name)), false) $$;

create function private.can_read_product_photo(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select coalesce(private.is_org_member(private.product_photo_org(p_name)), false) $$;

revoke all on function private.product_photo_org(text) from public, anon;
revoke all on function private.can_edit_product_photo(text) from public, anon;
revoke all on function private.can_read_product_photo(text) from public, anon;
grant execute on function private.product_photo_org(text) to authenticated;
grant execute on function private.can_edit_product_photo(text) to authenticated;
grant execute on function private.can_read_product_photo(text) to authenticated;

create policy produtos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and private.can_edit_product_photo(name));
create policy produtos_select on storage.objects for select to authenticated
  using (bucket_id = 'produtos' and private.can_read_product_photo(name));
create policy produtos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and private.can_edit_product_photo(name));
