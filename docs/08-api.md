# 08 · API pública (v1)

Para o ERP, uma planilha ou outro sistema **ler** os dados de uma organização: produtos, fichas técnicas, riscos do Encaixe e coleções. Só leitura.

## Chave

Dono e admin criam a chave em **Painel → organização → API**. A chave (`alv_` + 64 caracteres) aparece **uma vez só**; o Alinhavo guarda apenas o hash. Guarde no servidor do sistema que vai usar a API, nunca numa página pública. Revogar a chave a desliga na hora.

Cada pedido leva a chave no cabeçalho:

```
Authorization: Bearer alv_...
```

## Endereços

Base: `https://SEU-APP/api/v1`

| Pedido | O que devolve |
|---|---|
| `GET /produtos?limite=50&depois=<proximo>` | `{ "itens": [produto…], "proximo": "<id>" \| null }`. Até 100 por página; para a próxima, mande `depois` com o `proximo` da página anterior. |
| `GET /produtos/{id}` | Um produto. |
| `GET /produtos/{id}/ficha` | A ficha técnica mais recente: `{ numero, versao_molde, gerada_em, dados }` (`dados` é a ficha completa: peças, consumo por tamanho, aviamentos, custos, texto técnico e desenho técnico). |
| `GET /produtos/{id}/riscos` | Os riscos do Encaixe: `[{ numero, versao_molde, largura_mm, comprimento_mm, aproveitamento, demanda, criado_em }]`. |
| `GET /colecoes` | `[{ id, nome, temporada, inicio, lancamento, arquivada_em }]`. |

Produto:

```json
{
  "id": "…", "referencia": "SM-1", "nome": "Saia midi", "status": "aprovado",
  "colecao": { "id": "…", "nome": "Verão" },
  "molde": { "id": "…", "nome": "Saia", "versao": 3 },
  "tecido": { "nome": "Linho", "composicao": "100% linho", "largura_mm": 1400, "gramatura_gm2": 180, "preco_centavos_metro": 4590 },
  "aviamentos": [{ "nome": "Zíper", "quantidade": 1, "unidade": "un", "preco_centavos": 250 }],
  "texto_venda": "…", "texto_tecnico": "…",
  "criado_em": "…", "atualizado_em": "…"
}
```

Medidas em **mm**, dinheiro em **centavos** (R$), datas em ISO 8601 (UTC).

## Respostas de erro

Sempre JSON, `{ "erro": "mensagem" }`:

| Código | Quando |
|---|---|
| 400 | Parâmetro inválido (`limite`, `depois`). |
| 401 | Sem chave, chave errada ou revogada (a mesma resposta nos três casos). |
| 404 | O item não existe ou é de outra organização (a mesma resposta). |
| 429 | Mais de 60 pedidos no minuto com a mesma chave. Espere o tempo de `Retry-After` (segundos). |
| 500 / 503 | Erro do servidor ou API fora do ar. Tente de novo. |

## Exemplo

```bash
curl -H "Authorization: Bearer alv_..." "https://SEU-APP/api/v1/produtos?limite=20"
```

## Webhooks (avisos)

Em vez de perguntar de tempos em tempos, o seu sistema pode ser **avisado**. Dono e admin cadastram em **Painel → organização → API → Webhooks** uma URL `https://` pública (por nome, sem IP nem localhost; até 5 por organização) e os eventos:

| Evento | Quando | `dados` |
|---|---|---|
| `produto.aprovado` | O status do produto muda para aprovado | `{ "produto": {…} }` (o mesmo produto de `GET /produtos/{id}`) |
| `ficha.gerada` | Uma ficha técnica nova é salva | `{ produto_id, numero, versao_molde, gerada_em }` (a ficha completa: `GET /produtos/{id}/ficha`) |
| `risco.salvo` | Um risco novo é salvo (no Encaixe ou pela fila) | `{ produto_id, numero, versao_molde, largura_mm, comprimento_mm, aproveitamento, demanda, criado_em }` |
| `teste` | Botão "Mandar teste" no painel | `{ "mensagem": "…" }` |

Cada aviso é um `POST` com JSON:

```json
{ "id": "<id da entrega>", "evento": "produto.aprovado", "criado_em": "…", "dados": { … } }
```

Cabeçalhos: `X-Alinhavo-Event`, `X-Alinhavo-Delivery` (o mesmo `id`), `X-Alinhavo-Attempt` (1, 2, …) e `X-Alinhavo-Signature: t=<unix>,v1=<hex>`.

**Confira a assinatura** antes de confiar no aviso. O segredo (`whsec_…`) aparece uma vez, ao cadastrar. `v1` é o HMAC-SHA256, com o segredo inteiro como chave, de `<t>.<corpo>` (o corpo exatamente como chegou). Recuse se não bater ou se `t` estiver a mais de 5 minutos do seu relógio. Em Node:

```js
const crypto = require("node:crypto");
function avisoValido(corpo, cabecalho, segredo) {
  const { t, v1 } = Object.fromEntries(cabecalho.split(",").map((p) => p.split("=")));
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const esperado = crypto.createHmac("sha256", segredo).update(`${t}.${corpo}`).digest("hex");
  return v1?.length === esperado.length && crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(esperado));
}
```

**Responda 2xx** em até 10 s (processe depois, se demorar). Qualquer outra resposta, redirecionamento ou falta de resposta conta como falha, e o aviso volta em 1 min, 5 min, 30 min, 2 h e 12 h; depois da 6ª tentativa, desiste. O mesmo aviso pode chegar mais de uma vez: use o `id` para não processar duas vezes. A ordem entre avisos não é garantida. O painel mostra os últimos envios, com o status e o motivo da falha.

## Como funciona (para quem mantém o Alinhavo)

Webhooks: gatilhos no banco (produto aprovado, ficha nova, risco novo) põem o aviso na fila `webhook_deliveries`, uma linha por webhook ligado e inscrito. A Edge Function `supabase/functions/webhooks-dispatch` (lógica em `handler.ts`, testada no Vitest), chamada a cada minuto pelo Supabase Cron, pega até 20 (`claim_webhook_deliveries`, prazo de 2 min), assina, envia e encerra (`finish_webhook_delivery`, que agenda a nova tentativa). As duas funções são só da chave de serviço, que fica só na função; o segredo de assinatura não é legível pelo app. Antes de enviar, a função confere a URL de novo e os IPs que o nome resolve (rede interna, não). Migração `20261115060000_webhooks.sql`, testes em `supabase/tests-pglite/webhooks.test.ts` e `edge-webhooks.test.ts`. Configuração do Cron em `docs/07-deploy.md`.

As rotas (`apps/web/src/app/api/v1/`) não usam login nem a chave de serviço do Supabase: chamam, com a chave publicável, as funções `api_*` do banco (`security definer`), que conferem a chave pelo hash (`private.api_org`: revogação e limite por minuto) e só devolvem dados da organização dona dela. Migração `20261115050000_api_publica.sql`, testes em `supabase/tests-pglite/api-publica.test.ts`.
