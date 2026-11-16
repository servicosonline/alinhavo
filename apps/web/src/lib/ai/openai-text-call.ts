import OpenAI from "openai";
import type { AiTextResult } from "./call";
import { PRODUCT_TEXT_SCHEMA, PRODUCT_TEXT_SYSTEM, productTextUserMessage, readProductTexts, type ProductFacts } from "./product-text";

/**
 * A reserva dos textos do produto: a OpenAI, quando o Claude (direto ou pelo gateway) falha. Mesmo pedido,
 * mesmo esquema e mesma leitura. O modelo vem de OPENAI_TEXT_MODEL (sem padrão: não se adivinha nome de
 * modelo). Recebe o cliente (o servidor cria; os testes passam um falso).
 */

/** Só o que a chamada usa do cliente. */
export type OpenAiTextClient = { responses: { create: OpenAI["responses"]["create"] } };

const FAIL = (error: string, extra: { model?: string | null; inputTokens?: number; outputTokens?: number } = {}): AiTextResult => ({
  ok: false,
  error,
  model: extra.model ?? null,
  inputTokens: extra.inputTokens ?? 0,
  outputTokens: extra.outputTokens ?? 0,
});

export async function callProductTextsOpenAi(client: OpenAiTextClient, model: string, facts: ProductFacts): Promise<AiTextResult> {
  let response: OpenAI.Responses.Response;
  try {
    response = (await client.responses.create(
      {
        model,
        instructions: PRODUCT_TEXT_SYSTEM,
        input: productTextUserMessage(facts),
        max_output_tokens: 4000,
        text: { format: { type: "json_schema", name: "textos_produto", schema: { ...PRODUCT_TEXT_SCHEMA }, strict: true } },
      },
      { timeout: 90_000, maxRetries: 1 },
    )) as OpenAI.Responses.Response;
  } catch (err) {
    if (err instanceof OpenAI.AuthenticationError || err instanceof OpenAI.PermissionDeniedError) {
      return FAIL("A chave da IA de reserva não foi aceita. Confira OPENAI_API_KEY no servidor.");
    }
    if (err instanceof OpenAI.RateLimitError) return FAIL("A IA está com muitos pedidos agora. Tente de novo em um minuto.");
    if (err instanceof OpenAI.APIError || err instanceof OpenAI.APIConnectionError) return FAIL("A IA não respondeu agora. Tente de novo.");
    return FAIL("Não foi possível falar com a IA agora.");
  }

  const usage = { model: response.model, inputTokens: response.usage?.input_tokens ?? 0, outputTokens: response.usage?.output_tokens ?? 0 };
  const refused = response.output.some((o) => o.type === "message" && o.content.some((c) => c.type === "refusal"));
  if (refused) return FAIL("A IA não quis escrever sobre este produto. Revise os dados e tente de novo.", usage);
  if (response.status === "incomplete") return FAIL("O texto da IA saiu incompleto. Tente de novo.", usage);
  const texts = readProductTexts(response.output_text ?? "");
  if (!texts) return FAIL("A resposta da IA veio num formato inesperado. Tente de novo.", usage);
  return { ok: true, texts, ...usage };
}
