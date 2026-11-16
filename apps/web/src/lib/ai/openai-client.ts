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

/** A reserva dos textos do produto: a mesma chave e o modelo de OPENAI_TEXT_MODEL. Null sem os dois. */
export function getOpenAiTextProvider(): { client: OpenAI; model: string } | null {
  const model = process.env.OPENAI_TEXT_MODEL?.trim();
  const client = getOpenAiClient();
  return model && client ? { client, model } : null;
}
