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

## Como funciona (para quem mantém o Alinhavo)

As rotas (`apps/web/src/app/api/v1/`) não usam login nem a chave de serviço do Supabase: chamam, com a chave publicável, as funções `api_*` do banco (`security definer`), que conferem a chave pelo hash (`private.api_org`: revogação e limite por minuto) e só devolvem dados da organização dona dela. Migração `20261115050000_api_publica.sql`, testes em `supabase/tests-pglite/api-publica.test.ts`.
