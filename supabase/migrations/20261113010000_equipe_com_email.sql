-- Alinhavo · Fase 0 · Lista da equipe com e-mail.
--
-- O app não lê auth.users. Esta função devolve o e-mail de cada membro,
-- mas só para quem faz parte da mesma organização.

create function public.org_team(p_org_id uuid)
returns table (user_id uuid, email text, role public.org_role, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, u.email::text, m.role, m.created_at
  from public.org_members m
  join auth.users u on u.id = m.user_id
  where m.org_id = p_org_id
    and private.is_org_member(p_org_id)
  order by m.created_at;
$$;

revoke all on function public.org_team(uuid) from public, anon;
grant execute on function public.org_team(uuid) to authenticated;
