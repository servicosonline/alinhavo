import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Cliente da Anthropic, só no servidor. A chave vem de ANTHROPIC_API_KEY
 * (ambiente da Vercel e apps/web/.env.local); nunca de variável NEXT_PUBLIC_*,
 * nunca no navegador. Null quando a IA não está configurada.
 */
export function getAiClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}
