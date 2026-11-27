-- Alinhavo · Lista da equipe com nome e sobrenome.
--
-- O perfil (profiles) só é lido pela própria pessoa. Para a "Atividade recente" e a equipe mostrarem
-- quem fez o quê pelo nome, org_team passa a devolver nome e sobrenome de cada membro, para quem é da
-- mesma organização (que já via o e-mail). CPF/CNPJ e foto continuam fechados.
-- Mudar as colunas de retorno exige apagar e criar a função de novo.

drop function public.org_team(uuid);

create function public.org_team(p_org_id uuid)
returns table (user_id uuid, email text, role public.org_role, joined_at timestamptz, first_name text, last_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, u.email::text, m.role, m.created_at, p.first_name, p.last_name
  from public.org_members m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.user_id = m.user_id
  where m.org_id = p_org_id
    and private.is_org_member(p_org_id)
  order by m.created_at;
$$;

revoke all on function public.org_team(uuid) from public, anon;
grant execute on function public.org_team(uuid) to authenticated;
