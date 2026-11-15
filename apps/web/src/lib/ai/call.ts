import Anthropic from "@anthropic-ai/sdk";
import {
  AI_TEXT_MODEL,
  PRODUCT_TEXT_SCHEMA,
  PRODUCT_TEXT_SYSTEM,
  productTextUserMessage,
  readProductTexts,
  type ProductFacts,
  type ProductTexts,
} from "./product-text";

/**
 * A chamada ao Claude para os textos do produto. Recebe o cliente (o servidor
 * cria com a chave; os testes passam um falso). Mensagens de erro em
 * português, sem detalhes internos; tokens e modelo voltam mesmo na falha,
 * para o registro em ai_generations.
 */

export type AiTextResult =
  | { ok: true; texts: ProductTexts; model: string; inputTokens: number; outputTokens: number }
  | { ok: false; error: string; model: string | null; inputTokens: number; outputTokens: number };

/** Só o que a chamada usa do cliente (o SDK inteiro serve; o teste passa um objeto com isto). */
export type AiClient = { beta: { messages: { create: Anthropic["beta"]["messages"]["create"] } } };

const FAIL = (error: string, extra: Partial<Omit<Extract<AiTextResult, { ok: false }>, "ok" | "error">> = {}): AiTextResult => ({
  ok: false,
  error,
  model: null,
  inputTokens: 0,
  outputTokens: 0,
  ...extra,
});

export async function callProductTexts(client: AiClient, facts: ProductFacts): Promise<AiTextResult> {
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create(
      {
        model: AI_TEXT_MODEL,
        max_tokens: 4000,
        // Recusa do modelo (filtro de segurança) cai para outro modelo, escolhido pela categoria.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        // Texto curto e guiado: esforço baixo basta; a saída vem no formato do esquema.
        output_config: { effort: "low", format: { type: "json_schema", schema: PRODUCT_TEXT_SCHEMA } },
        system: PRODUCT_TEXT_SYSTEM,
        messages: [{ role: "user", content: productTextUserMessage(facts) }],
      },
      { timeout: 90_000, maxRetries: 1 },
    );
  } catch (err) {
    // Do mais específico ao mais geral.
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      return FAIL("A chave da IA não foi aceita. Confira ANTHROPIC_API_KEY no servidor.");
    }
    if (err instanceof Anthropic.RateLimitError) return FAIL("A IA está com muitos pedidos agora. Tente de novo em um minuto.");
    if (err instanceof Anthropic.BadRequestError) return FAIL("A IA recusou o pedido. Tente de novo ou avise o suporte.");
    if (err instanceof Anthropic.APIError || err instanceof Anthropic.APIConnectionError) return FAIL("A IA não respondeu agora. Tente de novo.");
    return FAIL("Não foi possível falar com a IA agora.");
  }

  const usage = { model: response.model, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };
  if (response.stop_reason === "refusal") return FAIL("A IA não quis escrever sobre este produto. Revise os dados e tente de novo.", usage);
  if (response.stop_reason === "max_tokens") return FAIL("O texto da IA saiu incompleto. Tente de novo.", usage);
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text ?? "";
  const texts = readProductTexts(text);
  if (!texts) return FAIL("A resposta da IA veio num formato inesperado. Tente de novo.", usage);
  return { ok: true, texts, ...usage };
}
