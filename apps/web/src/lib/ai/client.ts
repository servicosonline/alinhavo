import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Cliente da Anthropic, só no servidor; nunca variável NEXT_PUBLIC_*, nunca no navegador.
 *
 * - Direto: ANTHROPIC_API_KEY.
 * - Pelo gateway (uso comercial, decisão de 15/11/2026): ANTHROPIC_BASE_URL com o endereço do gateway e
 *   ANTHROPIC_AUTH_TOKEN (vai como `Authorization: Bearer`) ou ANTHROPIC_API_KEY, conforme o gateway pede.
 *
 * Null quando nada está configurado (aí a reserva da OpenAI pode responder sozinha).
 */
export function getAiClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() || null;
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN?.trim() || null;
  const baseURL = process.env.ANTHROPIC_BASE_URL?.trim() || undefined;
  if (!apiKey && !authToken) return null;
  return new Anthropic({ apiKey, authToken, baseURL });
}

/** Para a tela e o diagnóstico: por onde a IA de texto sai neste ambiente (sem expor chave nem endereço). */
export function aiTextRoute(): { claude: "direto" | "gateway" | null; openai: boolean } {
  const claude = process.env.ANTHROPIC_API_KEY?.trim() || process.env.ANTHROPIC_AUTH_TOKEN?.trim() ? (process.env.ANTHROPIC_BASE_URL?.trim() ? "gateway" : "direto") : null;
  return { claude, openai: Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_TEXT_MODEL?.trim()) };
}
