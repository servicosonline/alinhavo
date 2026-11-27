-- Alinhavo · Povoamento da organização de demonstração "Ateliê Ponto Firme" (dados fictícios).
--
-- NÃO é migração: roda só à mão, no SQL Editor do Supabase (como postgres), uma vez.
-- Deixa o ateliê com cara de cliente antigo (março a novembro de 2026): 5 pessoas fictícias,
-- 5 coleções novas com cronograma, ~30 produtos com o histórico de estágios (Tempo de produção),
-- moldes com versões, links de aprovação, comentários, registro de atividade e o histórico de Resultados.
--
-- Cuidados:
--   * Só mexe na organização a70b71c6-d1a0-4630-bb5a-ff5f7302fd2c e para (sem gravar) se ela não estiver
--     no plano Confecção, em cortesia ou ativa, ou se já tiver sido povoada.
--   * Os moldes copiam o desenho dos moldes que o ateliê já tem (abrem e provam normalmente).
--   * As 5 contas (e-mail @ponto-firme.invalid) não têm senha: ninguém entra com elas.
--   * Os produtos entram já no estágio final e o histórico é escrito à parte: nenhum webhook sai
--     (e qualquer entrega posta na fila durante o script é apagada).
--   * Desfazer: supabase/demo/ponto-firme-desfazer.sql.
-- Teste: supabase/tests-pglite/demo-ponto-firme.test.ts.

do $seed$
declare
  v_org constant uuid := 'a70b71c6-d1a0-4630-bb5a-ff5f7302fd2c';
  v_now constant timestamptz := now();
  v_owner uuid;
  v_chart uuid;
  v_fabrics uuid[];
  v_tpl_docs jsonb[];
  v_tpl_groups text[];
  v_log_start bigint;
  v_full_auth boolean;
  v_sub record;
  -- Pessoas fictícias: ids fixos (o desfazer e a segunda rodada se acham por eles).
  v_people constant jsonb := '[
    {"id": "5eed0000-0000-4000-8000-000000000001", "email": "marina.costa@ponto-firme.invalid", "first": "Marina", "last": "Costa", "role": "modelista", "joined": "2026-03-02"},
    {"id": "5eed0000-0000-4000-8000-000000000002", "email": "rafael.duarte@ponto-firme.invalid", "first": "Rafael", "last": "Duarte", "role": "modelista", "joined": "2026-03-09"},
    {"id": "5eed0000-0000-4000-8000-000000000003", "email": "camila.rocha@ponto-firme.invalid", "first": "Camila", "last": "Rocha", "role": "estilista", "joined": "2026-03-04"},
    {"id": "5eed0000-0000-4000-8000-000000000004", "email": "livia.sampaio@ponto-firme.invalid", "first": "Lívia", "last": "Sampaio", "role": "estilista", "joined": "2026-04-13"},
    {"id": "5eed0000-0000-4000-8000-000000000005", "email": "helena.prado@ponto-firme.invalid", "first": "Helena", "last": "Prado", "role": "modelista", "joined": "2026-05-18"}
  ]';
  v_modelistas uuid[] := array['5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000005']::uuid[];
  v_estilistas uuid[] := array['5eed0000-0000-4000-8000-000000000003', '5eed0000-0000-4000-8000-000000000004']::uuid[];
  -- Coleções: produtos como [nome, estágio onde está agora]. Data de início e de lançamento.
  v_collections constant jsonb := '[
    {"name": "Outono 2026", "season": "Outono 2026", "ref": "OUT26", "starts": "2026-03-02", "launch": "2026-05-04", "products": [
      ["Blazer de alfaiataria", "producao"], ["Calça reta de sarja", "producao"], ["Camisa de tricoline", "producao"],
      ["Vestido midi de viscose", "producao"], ["Saia lápis", "producao"], ["Colete de linho", "producao"]]},
    {"name": "Inverno 2026", "season": "Inverno 2026", "ref": "INV26", "starts": "2026-04-13", "launch": "2026-06-22", "products": [
      ["Casaco de lã batida", "producao"], ["Calça wide de moletom", "producao"], ["Blusa gola alta canelada", "producao"],
      ["Vestido de tricô", "producao"], ["Jaqueta jeans", "producao"], ["Saia plissada", "producao"]]},
    {"name": "Primavera 2026", "season": "Primavera 2026", "ref": "PRI26", "starts": "2026-06-08", "launch": "2026-08-24", "products": [
      ["Vestido chemise floral", "producao"], ["Blusa ciganinha", "producao"], ["Short de alfaiataria", "producao"],
      ["Macacão pantalona", "producao"], ["Camisa de linho", "producao"], ["Top cropped", "producao"]]},
    {"name": "Resort 2026", "season": "Resort 2026", "ref": "RES26", "starts": "2026-08-03", "launch": "2026-10-19", "products": [
      ["Saída de praia em chiffon", "producao"], ["Calça pantalona de linho", "producao"], ["Kimono estampado", "producao"],
      ["Vestido longo de crepe", "producao"], ["Saia midi transpassada", "aprovado"]]},
    {"name": "Alto Verão 2027", "season": "Alto Verão 2027", "ref": "AV27", "starts": "2026-10-05", "launch": "2027-01-25", "products": [
      ["Vestido tubinho", "aprovado"], ["Blusa ombro a ombro", "prova"], ["Short jeans", "prova"], ["Saia midi fluida", "modelagem"],
      ["Camiseta oversized", "modelagem"], ["Body canelado", "ideia"], ["Macaquinho de linho", "ideia"]]}
  ]';
  v_milestones constant text[] := array[
    'Painel de referências e briefing', 'Modelagem das peças-base', 'Prova virtual e ajustes',
    'Aprovação da cliente', 'Ficha técnica e encaixe', 'Entrega para a produção'];
  v_comments constant text[] := array[
    'Subi o painel com as referências de cor e caimento.',
    'Primeira versão do molde pronta, já com a gradação P a G.',
    'Na Prova o ombro ficou caído; ajustei 1,5 cm na cava.',
    'Cliente pediu a barra 3 cm mais curta, já entrou na versão nova.',
    'Conferi o consumo de tecido, ficou dentro do previsto.',
    'Aprovado pela cliente, pode seguir para a ficha técnica.',
    'Trocamos o aviamento: botão de madrepérola no lugar do de resina.',
    'Prova com o tecido real ficou ótima, o caimento bateu com o 3D.'];
  v_clients constant text[] := array['Juliana Martins (Loja Aurora)', 'Fernanda Lopes (Boutique Lis)', 'Patrícia Nunes (Casa Âmbar)', 'Beatriz Araújo (Loja Aurora)'];
  v_stages constant public.product_status[] := array['ideia', 'modelagem', 'prova', 'aprovado', 'producao']::public.product_status[];
  c jsonb;
  p jsonb;
  ci int := 0;
  pi int;
  k int;
  v_col uuid;
  v_prod uuid;
  v_pat uuid;
  v_appr uuid;
  v_final public.product_status;
  v_final_idx int;
  v_t timestamptz;
  v_enter timestamptz[];
  v_versions int;
  v_doc jsonb;
  v_group text;
  v_tpl int;
  v_modelista uuid;
  v_estilista uuid;
  v_vt timestamptz;
  v_seed int;
  v_due date;
begin
  -- 1. Conferências: nada é gravado se alguma falhar.
  if not exists (select 1 from public.orgs where id = v_org) then
    raise exception 'Organização % não encontrada.', v_org;
  end if;
  select plan_id, status, trial_ends_at into v_sub from public.org_subscriptions where org_id = v_org;
  if v_sub is null or v_sub.plan_id <> 'confeccao' or v_sub.status not in ('cortesia', 'ativa') then
    raise exception 'O ateliê precisa estar no plano Confecção, em cortesia ou ativa (está: %).', coalesce(v_sub.plan_id || ' / ' || v_sub.status, 'sem plano');
  end if;
  if exists (select 1 from auth.users where id = '5eed0000-0000-4000-8000-000000000001') then
    raise exception 'O ateliê já foi povoado. Rode supabase/demo/ponto-firme-desfazer.sql antes de povoar de novo.';
  end if;
  select user_id into v_owner from public.org_members where org_id = v_org and role = 'owner' order by created_at limit 1;
  if v_owner is null then
    raise exception 'O ateliê não tem dono.';
  end if;
  select id into v_chart from public.size_charts where org_id = v_org order by created_at limit 1;
  select coalesce(array_agg(id order by created_at), '{}') into v_fabrics from public.fabrics where org_id = v_org;
  select array_agg(pv.document order by pt.created_at),
         array_agg(case
           when pt.name ilike any (array['%calça%', '%short%', '%macac%', '%pantalona%']) then 'baixo'
           when pt.name ilike '%saia%' then 'saia'
           when pt.name ilike '%vestido%' then 'vestido'
           else 'cima' end order by pt.created_at)
    into v_tpl_docs, v_tpl_groups
    from public.patterns pt
    join public.pattern_versions pv on pv.pattern_id = pt.id and pv.number = pt.current_version
   where pt.org_id = v_org and pt.archived_at is null;
  if v_tpl_docs is null then
    raise exception 'O ateliê não tem molde com versão para servir de desenho.';
  end if;
  select coalesce(max(id), 0) into v_log_start from public.activity_log;
  v_full_auth := exists (select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = 'aud');

  create temp table seed_log (user_id uuid, action text, entity text, entity_id uuid, meta jsonb, at timestamptz) on commit drop;
  create temp table seed_product (id uuid, stages timestamptz[]) on commit drop;

  -- 2. Pessoas: conta sem senha, perfil com nome e entrada na equipe.
  for p in select * from jsonb_array_elements(v_people) loop
    if v_full_auth then
      execute 'insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                 raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
               values (''00000000-0000-0000-0000-000000000000'', $1, ''authenticated'', ''authenticated'', $2, '''', $3,
                 ''{"provider":"email","providers":["email"]}'', ''{}'', $3, $3)'
        using (p->>'id')::uuid, p->>'email', (p->>'joined')::timestamptz;
    else
      execute 'insert into auth.users (id, email) values ($1, $2)' using (p->>'id')::uuid, p->>'email';
    end if;
    insert into public.profiles (user_id, first_name, last_name, welcome_seen_at, created_at)
      values ((p->>'id')::uuid, p->>'first', p->>'last', (p->>'joined')::timestamptz, (p->>'joined')::timestamptz);
    insert into public.org_members (org_id, user_id, role, created_at, updated_at)
      values (v_org, (p->>'id')::uuid, (p->>'role')::public.org_role, (p->>'joined')::timestamptz + interval '10 hours', (p->>'joined')::timestamptz + interval '10 hours');
    insert into seed_log values ((p->>'id')::uuid, 'membro_entrou', 'member', (p->>'id')::uuid, jsonb_build_object('papel', p->>'role'), (p->>'joined')::timestamptz + interval '10 hours');
  end loop;

  -- 3. Coleções, cronograma, produtos, moldes, aprovações e comentários.
  for c in select * from jsonb_array_elements(v_collections) loop
    ci := ci + 1;
    v_t := (c->>'starts')::timestamptz + interval '9 hours';
    insert into public.collections (org_id, name, season, starts_on, launch_on, created_at, updated_at)
      values (v_org, c->>'name', c->>'season', (c->>'starts')::date, (c->>'launch')::date, v_t - interval '5 days', v_t - interval '5 days')
      returning id into v_col;
    insert into seed_log values (v_estilistas[1 + ci % 2], 'colecao_criada', 'collection', v_col, jsonb_build_object('nome', c->>'name'), v_t - interval '5 days');

    -- Marcos espalhados entre o início e o lançamento; os vencidos ficam concluídos (alguns com atraso).
    for k in 1 .. array_length(v_milestones, 1) loop
      v_due := (c->>'starts')::date + (((c->>'launch')::date - (c->>'starts')::date) * k / array_length(v_milestones, 1));
      insert into public.milestones (org_id, collection_id, title, due_on, assignee, done_at, position, created_at, updated_at)
        values (v_org, v_col, v_milestones[k], v_due,
          case when k in (1, 4) then v_estilistas[1 + (ci + k) % 2] when k = 6 then v_owner else v_modelistas[1 + (ci + k) % 3] end,
          case when v_due::timestamptz + ((ci + k) % 4 - 1) * interval '1 day' < v_now - interval '2 days'
               then v_due::timestamptz + ((ci + k) % 4 - 1) * interval '1 day' + interval '15 hours' end,
          k - 1, v_t - interval '5 days', v_t - interval '5 days');
    end loop;

    pi := 0;
    for p in select * from jsonb_array_elements(c->'products') loop
      pi := pi + 1;
      v_seed := ci * 31 + pi * 17;
      v_final := (p->>1)::public.product_status;
      v_final_idx := array_position(v_stages, v_final);
      v_modelista := v_modelistas[1 + v_seed % 3];
      v_estilista := v_estilistas[1 + v_seed % 2];

      -- Quando entrou em cada estágio: ideia 2–6 dias, modelagem 5–13, prova 3–9, aprovado 2–6.
      v_enter := array[v_t + (pi - 1) * interval '3 days' + (v_seed % 7) * interval '1 hour']::timestamptz[];
      v_enter := v_enter || (v_enter[1] + (2 + v_seed % 5) * interval '1 day' + interval '3 hours');
      v_enter := v_enter || (v_enter[2] + (5 + v_seed % 9) * interval '1 day' + interval '5 hours');
      v_enter := v_enter || (v_enter[3] + (3 + v_seed % 7) * interval '1 day' + interval '2 hours');
      v_enter := v_enter || (v_enter[4] + (2 + v_seed % 5) * interval '1 day' + interval '4 hours');
      -- Coleção em andamento: o estágio atual começou antes de hoje.
      for k in 2 .. v_final_idx loop
        if v_enter[k] > v_now - interval '1 day' then
          v_enter[k] := greatest(v_enter[k - 1] + interval '6 hours', v_now - (v_final_idx - k + 1) * interval '1 day');
        end if;
      end loop;

      -- Molde (a partir da modelagem), com o desenho de um molde do ateliê do mesmo tipo.
      v_pat := null;
      if v_final_idx >= 2 then
        v_group := case
          when p->>0 ilike any (array['%calça%', '%short%', '%macac%', '%pantalona%']) then 'baixo'
          when p->>0 ilike '%saia%' then 'saia'
          when p->>0 ilike '%vestido%' then 'vestido'
          else 'cima' end;
        v_tpl := array_position(v_tpl_groups, v_group);
        v_doc := v_tpl_docs[coalesce(v_tpl, 1 + v_seed % array_length(v_tpl_docs, 1))];
        v_versions := case v_final_idx when 2 then 1 + v_seed % 2 when 3 then 2 + v_seed % 2 else 3 + v_seed % 3 end;
        insert into public.patterns (org_id, name, size_chart_id, current_version, created_by, created_at, updated_at)
          values (v_org, p->>0, v_chart, v_versions, v_modelista, v_enter[2] + interval '2 hours', v_enter[2] + interval '2 hours')
          returning id into v_pat;
        insert into seed_log values (v_modelista, 'molde_criado', 'pattern', v_pat, jsonb_build_object('nome', p->>0), v_enter[2] + interval '2 hours');
        for k in 1 .. v_versions loop
          -- v1 no começo da modelagem; as do meio até a prova; a última, da Prova, antes da aprovação.
          v_vt := case
            when k = 1 then v_enter[2] + interval '3 hours'
            when v_final_idx = 2 then v_enter[2] + (v_now - v_enter[2]) * (k - 1) / v_versions
            else v_enter[2] + (v_enter[3] - v_enter[2]) * (k - 1) / (v_versions - 1) + (case when k = v_versions then (v_enter[least(v_final_idx, 4)] - v_enter[3]) / 2 else interval '0' end)
          end;
          insert into public.pattern_versions (org_id, pattern_id, number, document, origin, message, created_by, created_at)
            values (v_org, v_pat, k, v_doc,
              (case when k > 1 and k = v_versions and v_final_idx >= 3 then 'prova' else 'editor' end)::public.pattern_origin,
              case when k = 1 then 'Primeira versão' when k = v_versions and v_final_idx >= 3 then 'Ajuste da Prova 3D' else 'Ajuste de modelagem' end,
              v_modelista, v_vt);
          insert into seed_log values (v_modelista, 'versao_salva', 'pattern', v_pat,
            jsonb_build_object('versao', k, 'origem', case when k > 1 and k = v_versions and v_final_idx >= 3 then 'prova' else 'editor' end), v_vt);
        end loop;
        update public.patterns set updated_at = v_vt where id = v_pat;
      end if;

      v_due := ((c->>'launch')::date - (30 - pi * 3));
      insert into public.products (org_id, collection_id, reference, name, status, size_chart_id, pattern_id, fabric_id, due_on, created_at, updated_at)
        values (v_org, v_col, (c->>'ref') || '-' || lpad(pi::text, 2, '0'), p->>0, v_final, v_chart, v_pat,
          case when array_length(v_fabrics, 1) > 0 then v_fabrics[1 + v_seed % array_length(v_fabrics, 1)] end,
          -- Alguns da coleção em andamento com prazo já vencido (aparecem atrasados).
          case when ci = 5 and v_final_idx <= 2 and pi % 2 = 1 then (v_now - interval '4 days')::date else v_due end,
          v_enter[1], v_enter[v_final_idx])
        returning id into v_prod;
      insert into seed_log values (v_estilista, 'produto_criado', 'product', v_prod, jsonb_build_object('nome', p->>0), v_enter[1]);
      for k in 2 .. v_final_idx loop
        insert into seed_log values (case when k in (2, 3) then v_modelista else v_estilista end, 'produto_status', 'product', v_prod,
          jsonb_build_object('de', v_stages[k - 1], 'para', v_stages[k]), v_enter[k]);
      end loop;
      insert into seed_product (id, stages) values (v_prod, v_enter[1:v_final_idx]);

      -- Aprovação pelo link: quem passou da prova foi aprovado (um em cada três pediu ajustes antes).
      if v_final_idx >= 4 then
        if v_seed % 3 = 0 and v_versions >= 2 then
          v_vt := v_enter[3] + interval '6 hours';
          insert into public.approvals (org_id, pattern_id, version_number, expires_at, status, reviewer_name, reviewer_comment, decided_at, created_by, created_at)
            values (v_org, v_pat, v_versions - 1, v_vt + interval '7 days', 'ajustes', v_clients[1 + v_seed % 4],
              'Gostei do modelo, mas quero a barra um pouco mais curta e a cintura mais marcada.', v_vt + interval '14 hours', v_estilista, v_vt)
            returning id into v_appr;
          insert into seed_log values (v_estilista, 'aprovacao_pedida', 'approval', v_appr, jsonb_build_object('molde', v_pat), v_vt);
          insert into seed_log values (null, 'aprovacao_decidida', 'approval', v_appr, '{"status": "ajustes"}', v_vt + interval '14 hours');
        end if;
        v_vt := v_enter[4] - interval '1 day';
        insert into public.approvals (org_id, pattern_id, version_number, expires_at, status, reviewer_name, reviewer_comment, decided_at, created_by, created_at)
          values (v_org, v_pat, v_versions, v_vt + interval '7 days', 'aprovado', v_clients[1 + (v_seed + 1) % 4],
            'Aprovado! Ficou exatamente como imaginei.', v_vt + interval '18 hours', v_estilista, v_vt)
          returning id into v_appr;
        insert into seed_log values (v_estilista, 'aprovacao_pedida', 'approval', v_appr, jsonb_build_object('molde', v_pat), v_vt);
        insert into seed_log values (null, 'aprovacao_decidida', 'approval', v_appr, '{"status": "aprovado"}', v_vt + interval '18 hours');
      elsif v_final_idx = 3 then
        -- Em prova agora: link enviado, esperando a cliente.
        v_vt := v_now - interval '1 day';
        insert into public.approvals (org_id, pattern_id, version_number, expires_at, status, created_by, created_at)
          values (v_org, v_pat, v_versions, v_vt + interval '14 days', 'pendente', v_estilista, v_vt)
          returning id into v_appr;
        insert into seed_log values (v_estilista, 'aprovacao_pedida', 'approval', v_appr, jsonb_build_object('molde', v_pat), v_vt);
      end if;

      -- Comentários da equipe ao longo do caminho.
      for k in 1 .. least(v_final_idx, 4) loop
        insert into public.comments (org_id, product_id, author, body, pattern_version, created_at)
          values (v_org, v_prod, case when k % 2 = 1 then v_estilista else v_modelista end,
            v_comments[1 + (v_seed + k * 3) % array_length(v_comments, 1)],
            case when v_pat is not null and k >= 2 then least(k - 1, v_versions) end,
            v_enter[k] + interval '1 day' * least(1, extract(epoch from (coalesce(v_enter[k + 1], v_now) - v_enter[k])) / 86400 / 2));
      end loop;
    end loop;
  end loop;

  -- 4. Histórico de estágios (Tempo de produção): troca o evento único do insert pelo caminho com datas.
  delete from public.product_status_events where product_id in (select id from seed_product);
  insert into public.product_status_events (org_id, product_id, status, entered_at, backfilled)
    select v_org, sp.id, v_stages[s.ord], s.at, false
      from seed_product sp, unnest(sp.stages) with ordinality as s(at, ord);

  -- 5. Resultados: como era antes e os pilotos cortados nos últimos 6 meses (sem sobrescrever o que existir).
  insert into public.roi_settings (org_id, pilots_per_month, fabric_per_pilot_mm, price_per_meter_cents, hours_per_pilot, hour_rate_cents, monthly_fabric_mm, efficiency_pct, goal_monthly_cents)
    values (v_org, 12, 1800, 3400, 6, 3000, 1800000, 76, 300000)
    on conflict (org_id) do nothing;
  insert into public.roi_months (org_id, month, pilots_cut)
    select v_org, (date_trunc('month', v_now at time zone 'America/Sao_Paulo') - make_interval(months => m))::date, (array[4, 5, 5, 7, 8, 10])[m + 1]
      from generate_series(0, 5) as m
    on conflict (org_id, month) do nothing;

  -- 6. Registro de atividade: tira o que os gatilhos gravaram agora (sem pessoa, com a data de hoje)
  --    e grava o caminho com quem fez e quando. Nada da fila de webhooks fica.
  delete from public.activity_log where org_id = v_org and id > v_log_start;
  insert into public.activity_log (org_id, user_id, action, entity, entity_id, meta, created_at)
    select v_org, user_id, action, entity, entity_id, meta, at from seed_log order by at;
  delete from public.webhook_deliveries where org_id = v_org and created_at >= v_now;
end;
$seed$;
