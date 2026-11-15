import "server-only";
import OpenAI from "openai";

/**
 * Cliente da OpenAI (fotos de catálogo), só no servidor. A chave vem de
 * OPENAI_API_KEY (ambiente da Vercel e apps/web/.env.local); nunca de variável
 * NEXT_PUBLIC_*, nunca no navegador. Null quando não está configurada.
 */
export function getOpenAiClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}
