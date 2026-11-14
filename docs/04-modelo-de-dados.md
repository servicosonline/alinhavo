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

## Tecido e prova

| Tabela | Campos principais |
|---|---|
| `fabrics` | org_id (nulo = preset do sistema), nome, propriedades físicas (jsonb), texturas (Storage) |
| `poses` | org_id?, nome, dados da pose |
| `fittings` | org_id, pattern_version_id, avatar_id, fabric_id por parte, pose inicial/final, resultado |
| `captures` | fitting_id, tipo (`imagem`, `360`), arquivo |
| `approvals` | org_id, fitting_id, token, expira_em, status, parecer |

## Encaixe

| Tabela | Campos principais |
|---|---|
| `markers` | org_id, product_id, pattern_version_id, largura_tecido_mm, demanda por tamanho (jsonb), aproveitamento, comprimento_mm, layout (jsonb) |
| `nest_jobs` | org_id, marker_id, status (`fila`, `rodando`, `pronto`, `erro`), progresso |

## Storage (buckets)

- `textures` e `avatars`: privados por organização (caminho começa com `org_id/`).
- `captures` e `exports`: privados; acesso por URL assinada.
- `system`: presets públicos de tecido, pose e corpo-base.
