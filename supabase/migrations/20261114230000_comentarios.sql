-- Alinhavo · Fase 3 · Comentários no produto, em tempo real.
--
-- Regras:
--   * Todo membro lê e comenta (inclusive "só leitura": comentar é o jeito
--     de quem só olha participar). O autor é sempre quem está logado.
--   * Cada um apaga o próprio comentário; dono e admin apagam qualquer um.
--     Comentário não se edita (a conversa fica como foi).
--   * Realtime: a tabela entra na publicação supabase_realtime; o Supabase
--     só entrega a cada pessoa as linhas que a RLS deixa ela ler.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  product_id uuid not null,
  author uuid default auth.uid() references auth.users (id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  pattern_version integer check (pattern_version >= 1), -- versão do molde comentada, se houver
  created_at timestamptz not null default now(),
  foreign key (product_id, org_id) references public.products (id, org_id) on delete cascade
);
create index comments_org_id_idx on public.comments (org_id);
create index comments_product_id_idx on public.comments (product_id, created_at);

alter table public.comments enable row level security;

create policy comments_select on public.comments for select to authenticated using (private.is_org_member(org_id));
create policy comments_insert on public.comments for insert to authenticated
  with check (private.is_org_member(org_id) and author = auth.uid());
create policy comments_delete on public.comments for delete to authenticated
  using (author = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']::public.org_role[]));

revoke all on public.comments from anon;
revoke insert, update on public.comments from authenticated;
grant insert (org_id, product_id, body, pattern_version) on public.comments to authenticated;

-- Tempo real. Nos testes (PGlite) a publicação não existe: só entra se houver.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.comments;
  end if;
end;
$$;
