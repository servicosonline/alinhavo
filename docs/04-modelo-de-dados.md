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

## Medidas e manequins

| Tabela | Campos principais |
|---|---|
| `clients` | org_id, nome (o cliente da confecção, opcional) |
| `size_charts` | org_id, client_id?, nome, unidade |
| `sizes` | size_chart_id, rótulo (P, M, 38…), ordem, base (bool) |
| `measurements` | size_id, medida (busto, cintura…), valor_mm |
| `avatars` | org_id, size_id, parâmetros do corpo (jsonb), arquivo no Storage |

## Coleção e produto

| Tabela | Campos principais |
|---|---|
| `collections` | org_id, nome, temporada, início, lançamento |
| `milestones` | collection_id, etapa, prazo, responsável, concluído_em |
| `products` | org_id, collection_id, referência, nome, status, size_chart_id |
| `tech_packs` | product_id, dados (jsonb), versão |
| `comments` | org_id, alvo (produto/prova), autor, texto |

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

| Tabela | Campos principais |
|---|---|
| `fabrics` | org_id (nulo = preset do sistema), nome, propriedades físicas (jsonb), texturas (Storage) |
| `poses` | org_id?, nome, dados da pose |
| `fittings` | org_id, pattern_version_id, avatar_id, fabric_id por parte, pose inicial/final, resultado |
| `captures` | fitting_id, tipo (`imagem`, `360`), arquivo *(futuro, com o vídeo 360°)* |
| `approvals` | **(feito)** org_id, pattern_id + version_number (versão fixa), token, settings (tamanho, tecido, pose), expires_at, status (`pendente`, `aprovado`, `ajustes`), nome e comentário de quem respondeu, decided_at |
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

- `textures` e `avatars`: privados por organização (caminho começa com `org_id/`).
- `captures` e `exports`: privados; acesso por URL assinada.
- `system`: presets públicos de tecido, pose e corpo-base.
