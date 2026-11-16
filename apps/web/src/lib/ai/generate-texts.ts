import { callProductTexts, type AiClient, type AiTextResult } from "./call";
import { callProductTextsOpenAi, type OpenAiTextClient } from "./openai-text-call";
import type { ProductFacts } from "./product-text";

/**
 * Textos do produto com reserva: primeiro o Claude (direto ou pelo gateway); se ele falhar por erro de
 * chamada, cota, formato ou texto cortado, a OpenAI. Recusa do Claude não vai para a reserva (seria driblar
 * o filtro de segurança). Os tokens das duas tentativas somam no registro; o modelo é o da última.
 */
export type TextProviders = {
  claude: AiClient | null;
  openai: { client: OpenAiTextClient; model: string } | null;
};

export type GeneratedTexts = AiTextResult & { usedFallback: boolean };

export async function generateProductTexts(providers: TextProviders, facts: ProductFacts): Promise<GeneratedTexts> {
  const { claude, openai } = providers;
  if (!claude && !openai) {
    return { ok: false, error: "A IA ainda não foi configurada neste ambiente.", model: null, inputTokens: 0, outputTokens: 0, usedFallback: false };
  }
  let first: AiTextResult | null = null;
  if (claude) {
    first = await callProductTexts(claude, facts);
    if (first.ok || first.refused || !openai) return { ...first, usedFallback: false };
  }
  const second = await callProductTextsOpenAi(openai!.client, openai!.model, facts);
  return {
    ...second,
    // Sem resposta da reserva, fica o nome configurado: o registro sempre diz por onde passou.
    model: second.model ?? openai!.model,
    inputTokens: second.inputTokens + (first?.inputTokens ?? 0),
    outputTokens: second.outputTokens + (first?.outputTokens ?? 0),
    usedFallback: first !== null,
  };
}
