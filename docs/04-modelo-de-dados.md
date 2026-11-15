# 04 · Modelo de dados (Supabase)

Rascunho para orientar a Fase 0. Toda tabela de negócio tem `org_id`, `created_at`, `updated_at` e RLS ativa.

## Organização e acesso

| Tabela | Campos principais |
|---|---|
| `orgs` | id, nome, plano |
| `org_members` | org_id, user_id, papel (`owner`, `admin`, `modelista`, `estilista`, `leitura`) |
| `invites` | org_id, e-mail, papel, token, expira_em |

**Implementado** em `supabase/migrations/20261113000000_orgs_membros_convites.sql`:

- Leitura: `private.is_org_member(org_id)`. Escrita: `private.has_org_role(org_id, papéis)`. As duas são `security definer`, o que evita recursão nas políticas de `org_members`.
- Criar organização: só via `create_org(nome)`, que torna quem chamou o owner.
- Entrar numa organização: só via `accept_invite(token)`, com o mesmo e-mail do convite, dentro da validade (máximo 30 dias) e uma única vez.
- Admin gerencia a equipe, mas não cria owner nem mexe no owner. Uma organização nunca fica sem owner (trigger).
- Lista da equipe com e-mail: `org_team(org_id)` (migração `20261113010000_equipe_com_email.sql`), que só responde a membros da organização.
- O cliente só escreve colunas liberadas (`orgs.name`, `org_members.role`, campos do convite); o plano e o token são do servidor.

| Papel | Vê a org | Edita a org | Convida | Muda papéis | Apaga a org |
|---|---|---|---|---|---|
| owner | sim | sim | sim | todos | sim |
| admin | sim | sim | sim | menos owner | não |
| modelista, estilista, leitura | sim | não | não | não | não |

## Conta, plano e atividade

**Implementado** em `20261115110000_conta_e_trial.sql` e `20261115120000_registro_atividade.sql` (testes em `tests-pglite/conta-trial.test.ts` e `atividade.test.ts`):

| Tabela | Campos principais |
|---|---|
| `profiles` | user_id, nome, sobrenome, tipo e número do documento (CPF/CNPJ só dígitos), foto, boas-vindas vistas, primeiros passos fechados |
| `org_subscriptions` | org_id, plano (ids de `apps/web/src/lib/plans.ts`), status (`trial`, `ativa`, `vencida`, `cancelada`, `cortesia`), fim do teste, usuários |
| `activity_log` | org_id, user_id (null = cliente sem conta), ação, entidade, id, meta (sem dado pessoal), quando |

- **Perfil:** só a própria pessoa lê e escreve. CPF e CNPJ conferidos pelo dígito verificador (`private.valid_cpf`, `private.valid_cnpj`). Dado pessoal (LGPD): não vai para a equipe nem para o registro.
- **Plano:** toda organização nova nasce em teste de 15 dias (gatilho `orgs_trial`; as que já existiam viraram `cortesia`). Ninguém escreve pelo app; membros leem. `org_plan_status(org)` devolve o status de agora (teste vencido = `vencida`) e os dias que faltam. Ainda nada é bloqueado por plano.
- **Capa e prazo** (migração `20261115130000_capa_prazo_limite_ia.sql`, testes em `capa-prazo.test.ts`): `orgs.thumbnail_path` (só aponta para `<org_id>/…` no bucket público `org-capas`; só dono e admin enviam e trocam) e `products.due_on` (data de entrega; quem edita produtos define). A mesma migração baixou o limite de IA para 50 textos + 10 fotos por organização por mês.
- **Acompanhamento da cliente** (`20261115200000_acompanhamento.sql`, testes em `acompanhamento.test.ts`): `tracking_links` (org_id, produto ou coleção, token, o que mostrar em `show`, validade, cancelado, última abertura). Só por `create_tracking_link` e `revoke_tracking_link` (quem edita produtos; até 50 ativos por organização); leitura sem conta só por `public_tracking(token)`, que só inclui o que foi marcado; `touch_tracking` marca a abertura.
- **Resultados** (`20261115210000_resultados.sql`): `roi_settings` (uma por organização: pilotos, tecido, preço do metro, horas e valor da hora de antes, tecido do mês, aproveitamento e a meta, em mm e centavos) e `roi_months` (pilotos cortados por mês, sempre no dia 1). Dono e admin escrevem; membros leem.
- **Limite de IA por cliente** (`20261115250000_ia_por_cliente.sql`, testes em `ia-limite.test.ts`): `ai_limit_overrides` (org_id, tipo, limite do mês). Sem linha, vale o padrão. Ninguém lê nem escreve direto: `platform_set_ai_limit` (só o dono da plataforma; null volta ao padrão; vai para a auditoria), `ai_limit_for(org, tipo)` para membros e `platform_ai_usage(org)` para o superadmin (uso do mês, erros, Claude × OpenAI pelo nome do modelo, tokens). `reserve_ai_generation` usa `private.ai_org_limit`.
- **Suporte** (`20261115240000_suporte.sql`, testes em `suporte.test.ts`): `support_threads` (pessoa, organização de onde pediu — só se for membro —, assunto, status `aberta` → `respondida` → `fechada`) e `support_messages` (corpo, `from_admin`). Quem pediu e o superadmin leem (o Realtime entrega só a eles); ninguém escreve direto: `open_support_thread` (avisa os admins no sino), `send_support_message` (resposta do suporte vira `respondida` e avisa o cliente; o cliente responde e volta a `aberta`; escrever reabre a fechada), `close_support_thread`, e a caixa `platform_support_threads(status)`. Até 30 mensagens por pessoa por hora.
- **Atividade:** os gatilhos gravam molde criado, versão salva, coleção e produto criados, mudança de status do produto, aprovação pedida e decidida, risco salvo, ficha gerada, entrada, saída e troca de papel na equipe, convite. Eventos de tela por `log_event(org, ação)` (lista fechada, até 30 por pessoa por minuto). Ninguém escreve direto; dono e admin leem a própria organização. `onboarding_progress()` responde o que a pessoa já fez para os primeiros passos.

## Medidas e manequins

| Tabela | Campos principais |
|---|---|
| `clients` | org_id, nome (o cliente da confecção, opcional) |
| `size_charts` | org_id, client_id?, nome, unidade, template? (tabela pronta de onde partiu, id em `lib/size-chart-templates.ts`; só na criação) |
| `sizes` | size_chart_id, rótulo (P, M, 38…), ordem, base (bool) |
| `measurements` | size_id, medida (busto, cintura…), valor_mm |
| `avatars` | org_id, size_id, parâmetros do corpo (jsonb), arquivo no Storage |

## Coleção e produto

| Tabela | Campos principais |
|---|---|
| `collections` | org_id, nome, temporada, início, lançamento |
| `milestones` | collection_id, etapa, prazo, responsável, concluído_em |
| `products` | org_id, collection_id, referência, nome, status, size_chart_id |
| `tech_packs` | product_id, dados (jsonb, formato 1; fichas novas levam o texto técnico e o desenho técnico plano, campos opcionais), versão |
| `comments` | org_id, alvo (produto/prova), autor, texto |
| `product_status_events` | org_id, product_id, status, entered_at, backfilled. Só o banco escreve (gatilho em `products`); `production_stage_times(org)` dá média e mediana por estágio e da ideia à produção, para o dono (e o superadmin) |

Superadmin da plataforma: `platform_admins` (user_id). Ninguém lê nem escreve pelo app; entra por SQL (ver `07-deploy.md`). `am_platform_admin()` diz à tela se mostra `/painel/admin`; `platform_orgs()` lista as organizações.

## Molde

| Tabela | Campos principais |
|---|---|
| `patterns` | org_id, product_id, nome, versão atual |
| `pattern_versions` | pattern_id, número, documento (jsonb), autor, origem (`editor`, `prova`, `scan`), mensagem |

O documento do molde guarda: partes, pontos, curvas, piques, fio, regras de gradação por ponto, costuras (pares de arestas), margem por aresta.

**Implementado** (sem `product_id` por enquanto: produtos chegam na Fase 3) em `supabase/migrations/20261114000000_medidas_e_moldes.sql`:

- Tabelas `clients`, `size_charts`, `sizes`, `measurements`, `patterns`, `pattern_versions`.
- Leitura para qualquer membro; escrita para owner, admin e modelista (`private.can_edit_patterns`); apagar molde só owner e admin.
- **Vínculos com `org_id`**: as chaves estrangeiras entre essas tabelas são compostas `(id, org_id)`. Nem quem participa de duas organizações consegue ligar o tamanho de uma à tabela da outra.
- **Um tamanho base por tabela** (índice único parcial); troque com `set_base_size(size_id)`.
- **Versões imutáveis**: só nascem por `save_pattern_version(molde, documento, origem, versão_esperada, mensagem)`, que numera 1, 2, 3… e recusa salvar se outra pessoa salvou antes (`versão_esperada` desatualizada). Nem o dono do banco altera uma versão (trigger).
- O documento precisa ter `schema` 1, `unit` "mm", `sizes` e `pieces`, e menos de 2 MB. A validação completa (`validatePattern`) roda no app antes de salvar.
- Medidas em mm, positivas e com nome em minúsculas, únicas por tamanho.

## Tecido e prova

Tecido (`fabrics`): além de largura, gramatura e preço, o comportamento na Prova (`preset`, um dos 12 da biblioteca) e o ajuste da confecção: `stretch_pct`, `drape` (1–5), `thickness_mm` (até 2,5), `texture` (foto, data URL) e `texture_cm` (largura real da foto).

| Tabela | Campos principais |
|---|---|
| `fabrics` | org_id (nulo = preset do sistema), nome, propriedades físicas (jsonb), texturas (Storage) |
| `poses` | org_id?, nome, dados da pose |
| `fittings` | org_id, pattern_version_id, avatar_id, fabric_id por parte, pose inicial/final, resultado |
| `captures` | fitting_id, tipo (`imagem`, `360`), arquivo *(futuro, com o vídeo 360°)* |
| `api_keys` | **(feito)** org_id, name, prefix, key_hash (SHA-256, nunca legível), created_by, last_used_at, revoked_at. Só por `create_api_key` e `revoke_api_key` (dono e admin) |
| `api_key_usage` | **(feito)** org_id, key_id, minuto, contagem (limite de 60 por minuto por chave); só pelas funções da API |
| `webhook_endpoints` | **(feito)** org_id, url (https por nome), secret (`whsec_`, nunca legível pelo app), events, active, created_by. Até 5 por organização; só por `create_webhook_endpoint`, `set_webhook_endpoint_active`, `delete_webhook_endpoint` e `send_test_webhook` (dono e admin) |
| `webhook_deliveries` | **(feito)** org_id, endpoint_id, event, payload (não legível pelo app), status (`pendente`, `enviando`, `entregue`, `falhou`), attempts, next_attempt_at, locked_until, last_status_code, last_error. Entram por gatilho (produto aprovado, ficha nova, risco novo) ou teste; saem por `claim_webhook_deliveries`/`finish_webhook_delivery`, só da chave de serviço (Edge Function `webhooks-dispatch`). Dono e admin leem |
| `ai_generations` | **(feito)** org_id, product_id, kind (`textos_produto`, `foto_catalogo`), status (`reservada`, `pronta`, `erro`), model, input_tokens, output_tokens, created_by. Só por `reserve_ai_generation` (permissão e limite por tipo e por organização por mês: 200 textos, 30 fotos) e `finish_ai_generation`; membros leem |
| `catalog_photos` | **(feito)** id (= a geração em `ai_generations`), org_id, product_id, path (bucket privado `catalogo`, `<org>/<produto>/<geração>.jpg`), settings (opções da tela), model, created_by. Só por `create_catalog_photo` (confere a geração reservada e o arquivo); o arquivo só entra por quem reservou, enquanto reservada. Membros leem; quem edita produtos apaga |
| `approvals` | **(feito)** org_id, pattern_id + version_number (versão fixa), token, settings (tamanho, tecido, pose), expires_at, status (`pendente`, `aprovado`, `ajustes`), nome e comentário de quem respondeu, decided_at, video_path (vídeo 360° no Storage, só por `attach_approval_video`) |
| `approval_images` | **(feito)** org_id, approval_id, posição (0 a 3), ângulo (`atual`, `frente`, `costas`, `lado`), JPEG/PNG em `bytea` (até 600 KB) |

- **Aprovação (MVP):** criada só por `create_approval` (quem edita moldes), com as imagens de uma vez; o tipo da imagem vem dos primeiros bytes (JPEG ou PNG). Membros leem; quem edita apaga (revoga o link). Sem conta, só por `public_approval(token)` e `decide_approval(token, …)`: token errado e vencido respondem igual, a resposta vale uma vez e pedir ajustes exige comentário. Nada da organização sai pela parte pública.
- As imagens ficam no banco por enquanto; vão para o bucket `captures` com uma Edge Function quando entrar o vídeo 360° (`fittings`/`captures`).

## Encaixe

| Tabela | Campos principais |
|---|---|
| `markers` | **(feito)** org_id, product_id, number, pattern_id + pattern_version (versão fixa), fabric_id?, width_mm, demand (jsonb, tamanho → peças), length_mm, efficiency (0 a 1), layout (jsonb formato 1: peças com contorno e posições) |
| `nest_jobs` | **(feito)** org_id, product_id, pattern_id + pattern_version, width_mm, gap_mm, one_way, demand, status (`fila`, `rodando`, `pronto`, `erro`), progress, attempts, claimed_by + lease_until (prazo), marker_id, error |

- **Risco (markers):** só nasce por `create_marker` (quem edita produtos), que numera 1, 2, 3… por produto e confere que a versão do molde existe e que o tecido é da organização. Imutável (trigger); quem edita produtos apaga. O encaixe é calculado no navegador; a Server Action confere as posições contra as peças da versão do molde e recalcula comprimento e aproveitamento antes de gravar.
- **Fila (nest_jobs):** só pelas funções `enqueue_nest_job`, `claim_nest_job`, `nest_job_progress`, `finish_nest_job`, `fail_nest_job`, `release_nest_job` e `retry_nest_job` (quem edita produtos). Quem pega tem 2 minutos, renovados a cada aviso de progresso; vencido, o pedido volta a ficar disponível, e depois de 3 tentativas vira erro. Só quem pegou conclui; concluir cria o risco e liga ao pedido na mesma transação. Até 50 pedidos esperando por organização. Membros leem; quem edita apaga.

## Storage (buckets)

- `textures`: privado por organização (caminho começa com `org_id/`).
- `avatars` (**implementado**, migração `20261115110000_conta_e_trial.sql`): público, foto de perfil em `<user_id>/<nome>.webp|jpg|png`, até 200 KB; cada pessoa envia e apaga só na própria pasta (`private.is_own_avatar_path`).
- `captures` e `exports`: privados; acesso por URL assinada.
- `system`: presets públicos de tecido, pose e corpo-base.
