-- Alinhavo · Fase 2 · Aprovação da Prova por link público.
--
-- Regras:
--   * Uma aprovação aponta para UMA versão do molde (nada no molde muda) e
--     guarda as capturas da Prova (até 4 imagens JPEG ou PNG de até 600 KB).
--   * Leitura: qualquer membro da organização. Criar: só por create_approval,
--     para quem edita moldes. Apagar (revogar o link): quem edita moldes.
--   * Quem não tem conta só chega pelos dois portões com o token:
--     public_approval (ver) e decide_approval (responder uma vez). Token
--     errado e link vencido dão a mesma resposta (não revela se existe).
--   * Nenhum dado da organização sai pela parte pública.
--   * Imagens no banco por enquanto (MVP); vão para o Storage com uma Edge
--     Function quando chegar o vídeo 360° (ver docs/03-arquitetura.md).

create type public.approval_status as enum ('pendente', 'aprovado', 'ajustes');

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  pattern_id uuid not null,
  version_number integer not null check (version_number >= 1),
  token uuid not null unique default gen_random_uuid(),
  -- Como a Prova estava: tamanho, tecido, pose (só para mostrar).
  settings jsonb not null default '{}' check (
    coalesce(jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 4000, false)
  ),
  expires_at timestamptz not null,
  status public.approval_status not null default 'pendente',
  reviewer_name text check (char_length(reviewer_name) between 1 and 120),
  reviewer_comment text check (char_length(reviewer_comment) <= 2000),
  decided_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, org_id),
  foreign key (pattern_id, org_id) references public.patterns (id, org_id) on delete cascade,
  foreign key (pattern_id, version_number) references public.pattern_versions (pattern_id, number) on delete cascade,
  -- Respondida tem nome e data; pendente não tem resposta.
  check (
    (status = 'pendente' and decided_at is null and reviewer_name is null and reviewer_comment is null)
    or (status <> 'pendente' and decided_at is not null and reviewer_name is not null)
  )
);
create index approvals_org_id_idx on public.approvals (org_id);
create index approvals_pattern_id_idx on public.approvals (pattern_id);

create table public.approval_images (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  approval_id uuid not null,
  position smallint not null check (position between 0 and 3),
  angle text not null check (angle in ('atual', 'frente', 'costas', 'lado')),
  mime text not null check (mime in ('image/jpeg', 'image/png')),
  data bytea not null check (octet_length(data) between 1 and 600000),
  unique (approval_id, position),
  foreign key (approval_id, org_id) references public.approvals (id, org_id) on delete cascade
);
create index approval_images_org_id_idx on public.approval_images (org_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.approvals enable row level security;
alter table public.approval_images enable row level security;

create policy approvals_select on public.approvals for select to authenticated
  using (private.is_org_member(org_id));
create policy approvals_delete on public.approvals for delete to authenticated
  using (private.can_edit_patterns(org_id));
create policy approval_images_select on public.approval_images for select to authenticated
  using (private.is_org_member(org_id));

-- Nada se escreve direto: criar e responder só pelas funções abaixo.
revoke insert, update on public.approvals, public.approval_images from anon, authenticated;
revoke delete on public.approval_images from anon, authenticated;
revoke all on public.approvals, public.approval_images from anon;

-- ---------------------------------------------------------------------------
-- Criar (com as imagens, de uma vez)
-- ---------------------------------------------------------------------------

-- p_images: [{ "angle": "frente", "data": "<base64>" }, ...], de 1 a 4.
-- O tipo da imagem vem dos primeiros bytes (JPEG ou PNG); qualquer outra coisa é recusada.
create function public.create_approval(
  p_pattern_id uuid,
  p_version integer,
  p_settings jsonb,
  p_images jsonb,
  p_days integer default 14
)
returns table (id uuid, token uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pattern public.patterns;
  v_approval public.approvals;
  v_image jsonb;
  v_data bytea;
  v_mime text;
  v_pos integer := 0;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_pattern from public.patterns p where p.id = p_pattern_id;
  if v_pattern.id is null or not private.can_edit_patterns(v_pattern.org_id) then
    raise exception 'Molde não encontrado ou sem permissão para editar.' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.pattern_versions v where v.pattern_id = v_pattern.id and v.number = p_version) then
    raise exception 'Essa versão do molde não existe.' using errcode = 'invalid_parameter_value';
  end if;
  if p_days is null or p_days not between 1 and 60 then
    raise exception 'O prazo precisa ser de 1 a 60 dias.' using errcode = 'invalid_parameter_value';
  end if;
  if jsonb_typeof(p_images) is distinct from 'array' or jsonb_array_length(p_images) not between 1 and 4 then
    raise exception 'Mande de 1 a 4 imagens.' using errcode = 'invalid_parameter_value';
  end if;

  insert into public.approvals (org_id, pattern_id, version_number, settings, expires_at)
  values (v_pattern.org_id, v_pattern.id, p_version, coalesce(p_settings, '{}'), now() + make_interval(days => p_days))
  returning * into v_approval;

  for v_image in select * from jsonb_array_elements(p_images) loop
    begin
      v_data := decode(v_image ->> 'data', 'base64');
    exception when others then
      raise exception 'Imagem inválida.' using errcode = 'invalid_parameter_value';
    end;
    if v_data is null then
      raise exception 'Imagem inválida.' using errcode = 'invalid_parameter_value';
    end if;
    v_mime := case
      when substring(v_data from 1 for 3) = '\xffd8ff'::bytea then 'image/jpeg'
      when substring(v_data from 1 for 8) = '\x89504e470d0a1a0a'::bytea then 'image/png'
    end;
    if v_mime is null then
      raise exception 'A imagem precisa ser JPEG ou PNG.' using errcode = 'invalid_parameter_value';
    end if;
    insert into public.approval_images (org_id, approval_id, position, angle, mime, data)
    values (v_pattern.org_id, v_approval.id, v_pos, v_image ->> 'angle', v_mime, v_data);
    v_pos := v_pos + 1;
  end loop;

  return query select v_approval.id, v_approval.token, v_approval.expires_at;
end;
$$;

revoke all on function public.create_approval(uuid, integer, jsonb, jsonb, integer) from public, anon;
grant execute on function public.create_approval(uuid, integer, jsonb, jsonb, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Portões públicos (sem conta, só com o token)
-- ---------------------------------------------------------------------------

-- O que o cliente vê: nome do molde, versão, como a Prova estava, as imagens
-- e a resposta (se já houver). Null quando o token não vale (errado ou vencido).
create function public.public_approval(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'pattern_name', p.name,
    'version', a.version_number,
    'settings', a.settings,
    'status', a.status,
    'reviewer_name', a.reviewer_name,
    'reviewer_comment', a.reviewer_comment,
    'decided_at', a.decided_at,
    'expires_at', a.expires_at,
    'images', coalesce((
      select jsonb_agg(
        jsonb_build_object('angle', i.angle, 'mime', i.mime, 'data', encode(i.data, 'base64'))
        order by i.position
      )
      from public.approval_images i where i.approval_id = a.id
    ), '[]'::jsonb)
  )
  from public.approvals a
  join public.patterns p on p.id = a.pattern_id
  where a.token = p_token and a.expires_at > now();
$$;

revoke all on function public.public_approval(uuid) from public;
grant execute on function public.public_approval(uuid) to anon, authenticated;

-- Resposta do cliente: uma vez só, dentro do prazo. Pedir ajustes exige comentário.
create function public.decide_approval(
  p_token uuid,
  p_status public.approval_status,
  p_name text,
  p_comment text default null
)
returns public.approval_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
  v_found public.approvals;
begin
  if p_status is null or p_status = 'pendente' then
    raise exception 'Escolha aprovar ou pedir ajustes.' using errcode = 'invalid_parameter_value';
  end if;
  if char_length(v_name) not between 1 and 120 then
    raise exception 'Digite seu nome (até 120 caracteres).' using errcode = 'invalid_parameter_value';
  end if;
  if p_status = 'ajustes' and v_comment is null then
    raise exception 'Conte o que precisa ser ajustado.' using errcode = 'invalid_parameter_value';
  end if;
  if char_length(v_comment) > 2000 then
    raise exception 'O comentário pode ter até 2000 caracteres.' using errcode = 'invalid_parameter_value';
  end if;

  select * into v_found from public.approvals a where a.token = p_token and a.expires_at > now() for update;
  if v_found.id is null then
    raise exception 'Link de aprovação inválido ou vencido.' using errcode = 'no_data_found';
  end if;
  if v_found.status <> 'pendente' then
    raise exception 'Esta aprovação já foi respondida.' using errcode = 'unique_violation';
  end if;

  update public.approvals
  set status = p_status, reviewer_name = v_name, reviewer_comment = v_comment, decided_at = now()
  where id = v_found.id;
  return p_status;
end;
$$;

revoke all on function public.decide_approval(uuid, public.approval_status, text, text) from public;
grant execute on function public.decide_approval(uuid, public.approval_status, text, text) to anon, authenticated;
