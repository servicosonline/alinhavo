-- Alinhavo · Notificações para os clientes e novidades da plataforma.
--
-- Regras:
--   * notifications: o superadmin manda para todos, por plano, por status do plano (de agora: teste vencido
--     conta como 'vencida'), para uma organização ou para uma pessoa. Cada pessoa só lê as que são para ela
--     (RLS por private.notification_visible), e o Realtime entrega só essas.
--   * notification_reads: o que cada pessoa já leu. Só ela escreve e lê as próprias.
--   * private.notify_user: o banco avisa uma pessoa (ex.: resposta do suporte), sem passar pelo app.
--   * announcements (novidades): título, texto, imagem (bucket público `novidades`) e vídeo por link do
--     YouTube ou Vimeo. Todo mundo logado lê as publicadas; só o superadmin escreve, por funções.
--   * São tabelas da plataforma, não de uma organização: ficam na lista de exceções do teste de org_id.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null default '' check (char_length(body) <= 1000),
  link text check (link is null or (char_length(link) <= 300 and (link ~ '^/[^/]' or link ~ '^https://'))),
  audience text not null check (audience in ('todos', 'plano', 'status', 'org', 'pessoa')),
  audience_value text check (char_length(audience_value) <= 60),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint notifications_value check ((audience = 'todos') = (audience_value is null))
);

create index notifications_time on public.notifications (created_at desc);

create table public.notification_reads (
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

-- A notificação é para quem está logado?
create function private.notification_visible(p_audience text, p_value text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_audience
    when 'todos' then auth.uid() is not null
    when 'pessoa' then p_value = auth.uid()::text
    when 'org' then exists (select 1 from public.org_members m where m.user_id = auth.uid() and m.org_id::text = p_value)
    when 'plano' then exists (
      select 1 from public.org_members m join public.org_subscriptions s on s.org_id = m.org_id
      where m.user_id = auth.uid() and s.plan_id = p_value
    )
    when 'status' then exists (
      select 1 from public.org_members m join public.org_subscriptions s on s.org_id = m.org_id
      where m.user_id = auth.uid()
        and (case when s.status = 'trial' and s.trial_ends_at <= now() then 'vencida' else s.status::text end) = p_value
    )
    else false
  end
$$;

revoke all on function private.notification_visible(text, text) from public, anon;
grant execute on function private.notification_visible(text, text) to authenticated;

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

create policy notifications_select on public.notifications for select to authenticated
  using (private.notification_visible(audience, audience_value));
create policy notification_reads_select on public.notification_reads for select to authenticated using (user_id = auth.uid());
create policy notification_reads_insert on public.notification_reads for insert to authenticated with check (user_id = auth.uid());

revoke all on public.notifications from anon, authenticated;
revoke all on public.notification_reads from anon, authenticated;
grant select on public.notifications to authenticated;
grant select on public.notification_reads to authenticated;
grant insert (notification_id, user_id) on public.notification_reads to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

-- As notificações de quem está logado, com lida ou não.
create function public.my_notifications(p_limit integer default 30)
returns table (id uuid, title text, body text, link text, created_at timestamptz, read boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select n.id, n.title, n.body, n.link, n.created_at,
    exists (select 1 from public.notification_reads r where r.notification_id = n.id and r.user_id = auth.uid())
  from public.notifications n
  where auth.uid() is not null and private.notification_visible(n.audience, n.audience_value)
  order by n.created_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

revoke all on function public.my_notifications(integer) from public, anon;
grant execute on function public.my_notifications(integer) to authenticated;

-- Marca como lidas (null = todas as visíveis).
create function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notification_reads (notification_id, user_id)
  select n.id, auth.uid() from public.notifications n
  where auth.uid() is not null
    and private.notification_visible(n.audience, n.audience_value)
    and (p_ids is null or n.id = any (p_ids))
  on conflict do nothing
$$;

revoke all on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- O banco avisa uma pessoa (usado por outras funções, ex.: resposta do suporte).
create function private.notify_user(p_user uuid, p_title text, p_body text, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (title, body, link, audience, audience_value, created_by)
  values (left(p_title, 120), left(coalesce(p_body, ''), 1000), p_link, 'pessoa', p_user::text, auth.uid())
$$;

revoke all on function private.notify_user(uuid, text, text, text) from public, anon, authenticated;

-- Envio pelo superadmin. Para 'pessoa', o valor pode ser o e-mail da conta.
create function public.platform_send_notification(p_title text, p_body text, p_link text, p_audience text, p_value text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_value text := nullif(btrim(coalesce(p_value, '')), '');
  v_id uuid;
begin
  perform private.require_platform();
  if p_audience = 'todos' then
    v_value := null;
  elsif v_value is null then
    raise exception 'Escolha para quem vai a notificação.' using errcode = 'invalid_parameter_value';
  elsif p_audience = 'pessoa' and v_value like '%@%' then
    select u.id::text into v_value from auth.users u where lower(u.email) = lower(v_value);
    if v_value is null then
      raise exception 'Nenhuma conta com esse e-mail.' using errcode = 'invalid_parameter_value';
    end if;
  elsif p_audience in ('org', 'pessoa') and v_value !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Organização ou pessoa inválida.' using errcode = 'invalid_parameter_value';
  elsif p_audience = 'plano' and v_value not in ('gratis', 'modelista', 'estilista', 'confeccao') then
    raise exception 'Plano desconhecido.' using errcode = 'invalid_parameter_value';
  elsif p_audience = 'status' and v_value not in ('trial', 'ativa', 'vencida', 'cancelada', 'cortesia') then
    raise exception 'Status desconhecido.' using errcode = 'invalid_parameter_value';
  end if;
  insert into public.notifications (title, body, link, audience, audience_value, created_by)
  values (btrim(p_title), coalesce(p_body, ''), nullif(btrim(coalesce(p_link, '')), ''), p_audience, v_value, auth.uid())
  returning id into v_id;
  perform private.platform_log('notificacao_enviada', case when p_audience = 'org' then v_value::uuid end, case when p_audience = 'pessoa' then v_value::uuid end,
    jsonb_build_object('para', p_audience, 'valor', case when p_audience in ('plano', 'status') then v_value end));
  return v_id;
end;
$$;

revoke all on function public.platform_send_notification(text, text, text, text, text) from public, anon;
grant execute on function public.platform_send_notification(text, text, text, text, text) to authenticated;

-- As enviadas, com quantas pessoas já leram.
create function public.platform_notifications(p_limit integer default 50)
returns table (id uuid, title text, body text, link text, audience text, audience_value text, created_at timestamptz, reads integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform();
  return query
  select n.id, n.title, n.body, n.link, n.audience, n.audience_value, n.created_at,
    (select count(*)::integer from public.notification_reads r where r.notification_id = n.id)
  from public.notifications n
  order by n.created_at desc
  limit least(greatest(p_limit, 1), 200);
end;
$$;

revoke all on function public.platform_notifications(integer) from public, anon;
grant execute on function public.platform_notifications(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Novidades
-- ---------------------------------------------------------------------------

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null default '' check (char_length(body) <= 4000),
  image_path text check (image_path is null or image_path ~ '^[A-Za-z0-9_-]{1,64}\.(webp|jpg|png)$'),
  video_url text check (video_url is null or video_url ~ '^https://(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)/'),
  published boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index announcements_time on public.announcements (created_at desc);
alter table public.announcements enable row level security;
create policy announcements_select on public.announcements for select to authenticated using (published or private.is_platform_admin());
revoke all on public.announcements from anon, authenticated;
grant select on public.announcements to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('novidades', 'novidades', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy novidades_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'novidades' and private.is_platform_admin());
create policy novidades_delete on storage.objects for delete to authenticated
  using (bucket_id = 'novidades' and private.is_platform_admin());
create policy novidades_select on storage.objects for select to authenticated
  using (bucket_id = 'novidades' and private.is_platform_admin());

-- Cria (p_id null) ou edita uma novidade.
create function public.platform_save_announcement(p_id uuid, p_title text, p_body text, p_image_path text, p_video_url text, p_published boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform private.require_platform();
  if p_id is null then
    insert into public.announcements (title, body, image_path, video_url, published, created_by)
    values (btrim(p_title), coalesce(p_body, ''), p_image_path, nullif(btrim(coalesce(p_video_url, '')), ''), coalesce(p_published, true), auth.uid())
    returning id into v_id;
  else
    update public.announcements set
      title = btrim(p_title), body = coalesce(p_body, ''), image_path = p_image_path,
      video_url = nullif(btrim(coalesce(p_video_url, '')), ''), published = coalesce(p_published, true)
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Novidade não encontrada.' using errcode = 'invalid_parameter_value';
    end if;
  end if;
  perform private.platform_log('novidade_salva', null, null, jsonb_build_object('titulo', left(p_title, 80)));
  return v_id;
end;
$$;

revoke all on function public.platform_save_announcement(uuid, text, text, text, text, boolean) from public, anon;
grant execute on function public.platform_save_announcement(uuid, text, text, text, text, boolean) to authenticated;

create function public.platform_delete_announcement(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_image text;
begin
  perform private.require_platform();
  delete from public.announcements where id = p_id returning image_path into v_image;
  perform private.platform_log('novidade_apagada', null, null, '{}'::jsonb);
  return v_image;
end;
$$;

revoke all on function public.platform_delete_announcement(uuid) from public, anon;
grant execute on function public.platform_delete_announcement(uuid) to authenticated;
