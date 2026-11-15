-- Alinhavo · Chat de suporte: o cliente pede ajuda e o superadmin (dono ou suporte) responde.
--
-- Regras:
--   * support_threads: uma conversa por assunto, de uma pessoa (e da organização de onde ela pediu, se houver).
--     Status: aberta (esperando o suporte), respondida (esperando o cliente), fechada.
--   * support_messages: as mensagens. Quem pediu e o superadmin leem; o Realtime entrega só a eles (RLS).
--   * Ninguém escreve direto: open_support_thread, send_support_message e close_support_thread. Até 30
--     mensagens por pessoa por hora.
--   * Avisos: conversa nova avisa os admins; resposta do suporte avisa o cliente (private.notify_user,
--     aparece no sino).

create table public.support_threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs (id) on delete set null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject text not null check (char_length(btrim(subject)) between 1 and 120),
  status text not null default 'aberta' check (status in ('aberta', 'respondida', 'fechada')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index support_threads_user on public.support_threads (user_id, last_message_at desc);
create index support_threads_status on public.support_threads (status, last_message_at desc);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  org_id uuid references public.orgs (id) on delete set null,
  author uuid default auth.uid() references auth.users (id) on delete set null,
  from_admin boolean not null default false,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index support_messages_thread on public.support_messages (thread_id, created_at);

alter table public.support_threads enable row level security;
alter table public.support_messages enable row level security;

create policy support_threads_select on public.support_threads for select to authenticated
  using (user_id = auth.uid() or private.is_platform_admin());
create policy support_messages_select on public.support_messages for select to authenticated
  using (exists (
    select 1 from public.support_threads t where t.id = thread_id and (t.user_id = auth.uid() or private.is_platform_admin())
  ));

revoke all on public.support_threads from anon, authenticated;
revoke all on public.support_messages from anon, authenticated;
grant select on public.support_threads, public.support_messages to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.support_messages;
  end if;
end;
$$;

-- Limite de mensagens por pessoa (contra abuso; não atrapalha conversa normal).
create function private.support_rate_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select count(*) from public.support_messages m where m.author = auth.uid() and m.created_at > now() - interval '1 hour') < 30
$$;

revoke all on function private.support_rate_ok() from public, anon, authenticated;

create function public.open_support_thread(p_subject text, p_body text, p_org_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := case when p_org_id is not null and private.is_org_member(p_org_id) then p_org_id end;
  v_id uuid;
  v_admin record;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  if not private.support_rate_ok() then
    raise exception 'Muitas mensagens seguidas. Espere um pouco e tente de novo.' using errcode = 'program_limit_exceeded';
  end if;
  if char_length(btrim(coalesce(p_subject, ''))) not between 1 and 120 or char_length(btrim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'Escreva o assunto (até 120 letras) e a mensagem (até 4.000).' using errcode = 'invalid_parameter_value';
  end if;
  insert into public.support_threads (org_id, user_id, subject) values (v_org, auth.uid(), btrim(p_subject)) returning id into v_id;
  insert into public.support_messages (thread_id, org_id, author, from_admin, body) values (v_id, v_org, auth.uid(), false, btrim(p_body));
  for v_admin in select a.user_id from public.platform_admins a loop
    perform private.notify_user(v_admin.user_id, 'Nova conversa de suporte', left(btrim(p_subject), 200), '/painel/admin/suporte/' || v_id);
  end loop;
  return v_id;
end;
$$;

revoke all on function public.open_support_thread(text, text, uuid) from public, anon;
grant execute on function public.open_support_thread(text, text, uuid) to authenticated;

-- Responder: quem abriu (volta a 'aberta') ou o superadmin (vira 'respondida' e avisa o cliente).
create function public.send_support_message(p_thread_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_thread public.support_threads;
  v_admin boolean := private.is_platform_admin();
  v_id uuid;
begin
  select * into v_thread from public.support_threads t where t.id = p_thread_id;
  if v_thread.id is null or (v_thread.user_id <> auth.uid() and not v_admin) then
    raise exception 'Conversa não encontrada.' using errcode = 'insufficient_privilege';
  end if;
  if not private.support_rate_ok() then
    raise exception 'Muitas mensagens seguidas. Espere um pouco e tente de novo.' using errcode = 'program_limit_exceeded';
  end if;
  if char_length(btrim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'Escreva a mensagem (até 4.000 letras).' using errcode = 'invalid_parameter_value';
  end if;
  -- Quem responde pela plataforma é admin; o próprio cliente que for admin escreve como cliente na conversa dele.
  v_admin := v_admin and v_thread.user_id <> auth.uid();
  insert into public.support_messages (thread_id, org_id, author, from_admin, body)
  values (v_thread.id, v_thread.org_id, auth.uid(), v_admin, btrim(p_body))
  returning id into v_id;
  update public.support_threads
  set status = case when v_admin then 'respondida' else 'aberta' end, last_message_at = now()
  where id = v_thread.id;
  if v_admin then
    perform private.notify_user(v_thread.user_id, 'O suporte respondeu', left(v_thread.subject, 200), '/painel/suporte/' || v_thread.id);
  end if;
  return v_id;
end;
$$;

revoke all on function public.send_support_message(uuid, text) from public, anon;
grant execute on function public.send_support_message(uuid, text) to authenticated;

create function public.close_support_thread(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.support_threads set status = 'fechada'
  where id = p_thread_id and (user_id = auth.uid() or private.is_platform_admin());
  if not found then
    raise exception 'Conversa não encontrada.' using errcode = 'insufficient_privilege';
  end if;
end;
$$;

revoke all on function public.close_support_thread(uuid) from public, anon;
grant execute on function public.close_support_thread(uuid) to authenticated;

-- Caixa de entrada do superadmin: conversas com quem pediu, a organização e a última mensagem.
create function public.platform_support_threads(p_status text default null)
returns table (id uuid, subject text, status text, last_message_at timestamptz, user_email text, org_id uuid, org_name text, last_body text, messages integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_platform();
  return query
  select t.id, t.subject, t.status, t.last_message_at, u.email::text, t.org_id, o.name,
    (select left(m.body, 160) from public.support_messages m where m.thread_id = t.id order by m.created_at desc limit 1),
    (select count(*)::integer from public.support_messages m where m.thread_id = t.id)
  from public.support_threads t
  join auth.users u on u.id = t.user_id
  left join public.orgs o on o.id = t.org_id
  where p_status is null or t.status = p_status
  order by (t.status = 'aberta') desc, t.last_message_at desc
  limit 200;
end;
$$;

revoke all on function public.platform_support_threads(text) from public, anon;
grant execute on function public.platform_support_threads(text) to authenticated;
