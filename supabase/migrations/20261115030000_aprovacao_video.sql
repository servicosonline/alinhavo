-- Alinhavo · Fase 5 · Vídeo 360° no link de aprovação.
--
-- Regras:
--   * O vídeo fica no Storage, no bucket privado `aprovacoes`, no caminho
--     `<org_id>/<approval_id>/video.mp4` (ou .webm). Até 10 MB, só MP4 ou WebM.
--   * Quem edita moldes da organização envia e apaga (o navegador envia direto,
--     com a sessão do usuário: o vídeo não passa pelo servidor do app). Membros
--     leem. Não há atualização: para trocar, apaga e envia de novo.
--   * A aprovação só aponta para o vídeo por attach_approval_video, que confere
--     a permissão, o caminho e se o arquivo existe.
--   * Quem não tem conta vê o vídeo por uma Edge Function (aprovacao-video): ela
--     pergunta o caminho a approval_video_path (só para a chave de serviço, que
--     existe só na Edge Function) e devolve um endereço assinado de curta duração.
--   * As imagens continuam no banco (approval_images), como no MVP.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aprovacoes', 'aprovacoes', false, 10485760, array['video/mp4', 'video/webm'])
on conflict (id) do nothing;

alter table public.approvals add column video_path text check (char_length(video_path) <= 200);

-- ---------------------------------------------------------------------------
-- Caminho no Storage: <org_id>/<approval_id>/video.(mp4|webm)
-- ---------------------------------------------------------------------------

-- A aprovação dona do caminho, se ele tem o formato certo e a aprovação é daquela organização; null se não.
create function private.approval_of_media(p_name text)
returns public.approvals
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_parts text[] := string_to_array(p_name, '/');
  v_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_found public.approvals;
begin
  if array_length(v_parts, 1) is distinct from 3
    or v_parts[1] !~ v_uuid
    or v_parts[2] !~ v_uuid
    or v_parts[3] not in ('video.mp4', 'video.webm') then
    return null;
  end if;
  select * into v_found from public.approvals a where a.id = v_parts[2]::uuid and a.org_id = v_parts[1]::uuid;
  return v_found;
end;
$$;

-- Quem edita moldes da organização da aprovação (enviar e apagar o vídeo).
create function private.can_edit_approval_media(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.can_edit_patterns(a.org_id) from private.approval_of_media(p_name) a where a.id is not null), false)
$$;

-- Qualquer membro da organização da aprovação (ver o vídeo logado).
create function private.can_read_approval_media(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.is_org_member(a.org_id) from private.approval_of_media(p_name) a where a.id is not null), false)
$$;

revoke all on function private.approval_of_media(text) from public, anon, authenticated;
revoke all on function private.can_edit_approval_media(text) from public, anon;
revoke all on function private.can_read_approval_media(text) from public, anon;
grant execute on function private.can_edit_approval_media(text) to authenticated;
grant execute on function private.can_read_approval_media(text) to authenticated;

create policy aprovacoes_video_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'aprovacoes' and private.can_edit_approval_media(name));
create policy aprovacoes_video_select on storage.objects for select to authenticated
  using (bucket_id = 'aprovacoes' and private.can_read_approval_media(name));
create policy aprovacoes_video_delete on storage.objects for delete to authenticated
  using (bucket_id = 'aprovacoes' and private.can_edit_approval_media(name));

-- ---------------------------------------------------------------------------
-- Ligar o vídeo à aprovação
-- ---------------------------------------------------------------------------

-- Depois de enviar o arquivo, liga (ou troca) o vídeo da aprovação. Null desliga.
create function public.attach_approval_video(p_approval_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_found public.approvals;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_found from public.approvals a where a.id = p_approval_id;
  if v_found.id is null or not private.can_edit_patterns(v_found.org_id) then
    raise exception 'Aprovação não encontrada ou sem permissão.' using errcode = 'insufficient_privilege';
  end if;
  if p_path is not null then
    if p_path not in (
      v_found.org_id::text || '/' || v_found.id::text || '/video.mp4',
      v_found.org_id::text || '/' || v_found.id::text || '/video.webm'
    ) then
      raise exception 'Caminho do vídeo inválido.' using errcode = 'invalid_parameter_value';
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'aprovacoes' and o.name = p_path) then
      raise exception 'O vídeo não foi enviado.' using errcode = 'invalid_parameter_value';
    end if;
  end if;
  update public.approvals set video_path = p_path where id = v_found.id;
end;
$$;

revoke all on function public.attach_approval_video(uuid, text) from public, anon;
grant execute on function public.attach_approval_video(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Parte pública
-- ---------------------------------------------------------------------------

-- Caminho do vídeo de um link que vale (null se o token não vale ou não há vídeo).
-- Só para a chave de serviço: é a Edge Function que assina o endereço.
create function public.approval_video_path(p_token uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.video_path from public.approvals a where a.token = p_token and a.expires_at > now()
$$;

revoke all on function public.approval_video_path(uuid) from public, anon, authenticated;
grant execute on function public.approval_video_path(uuid) to service_role;

-- O que o cliente vê ganha `has_video` (o endereço vem da Edge Function).
create or replace function public.public_approval(p_token uuid)
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
    'has_video', a.video_path is not null,
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
