import OpenAI, { toFile } from "openai";
import { CATALOG_PHOTO_MODEL, CATALOG_PHOTO_SIZE, type PhotoQuality } from "./catalog-photo";

/**
 * A chamada à OpenAI para a foto de catálogo (edição da captura da Prova).
 * Recebe o cliente (o servidor cria com a chave; os testes passam um falso).
 * Erros em português, sem detalhes internos; tokens voltam mesmo na falha,
 * para o registro em ai_generations.
 */

/** Até 3 min: a própria OpenAI avisa que pedidos complexos levam até 2. Sem nova tentativa: cada uma custa. */
export const CATALOG_PHOTO_TIMEOUT_MS = 180_000;

export type ImageResult =
  | { ok: true; bytes: Uint8Array; ext: "jpg"; mime: "image/jpeg"; model: string; inputTokens: number; outputTokens: number }
  | { ok: false; error: string; model: string | null; inputTokens: number; outputTokens: number };

/** Só o que a chamada usa do cliente (o SDK inteiro serve; o teste passa um objeto com isto). */
export type ImageClient = { images: { edit: OpenAI["images"]["edit"] } };

export type ImageRequest = {
  image: Uint8Array;
  mime: "image/jpeg" | "image/png";
  prompt: string;
  quality: PhotoQuality;
  /** Hash do usuário (safetyIdentifier), para o filtro de segurança da OpenAI. */
  safetyId: string;
};

const FAIL = (error: string, extra: { inputTokens?: number; outputTokens?: number; model?: string | null } = {}): ImageResult => ({
  ok: false,
  error,
  model: extra.model ?? null,
  inputTokens: extra.inputTokens ?? 0,
  outputTokens: extra.outputTokens ?? 0,
});

const JPEG_MAGIC = [0xff, 0xd8, 0xff];

export async function callCatalogPhoto(client: ImageClient, req: ImageRequest): Promise<ImageResult> {
  let response: OpenAI.ImagesResponse;
  try {
    const file = await toFile(req.image, req.mime === "image/png" ? "prova.png" : "prova.jpg", { type: req.mime });
    response = await client.images.edit(
      {
        model: CATALOG_PHOTO_MODEL,
        image: file,
        prompt: req.prompt,
        n: 1,
        size: CATALOG_PHOTO_SIZE,
        quality: req.quality,
        // Complexidade alta (o padrão) pode mudar o que não devia; a roupa tem de ficar igual.
        complexity: "medium",
        output_format: "jpeg",
        output_compression: 85,
        background: "opaque",
        safety_identifier: req.safetyId,
      },
      { timeout: CATALOG_PHOTO_TIMEOUT_MS, maxRetries: 0 },
    );
  } catch (err) {
    // Do mais específico ao mais geral.
    if (err instanceof OpenAI.AuthenticationError) return FAIL("A chave da OpenAI não foi aceita. Confira OPENAI_API_KEY no servidor.");
    if (err instanceof OpenAI.PermissionDeniedError) {
      return FAIL("A OpenAI não liberou a geração de imagens para esta conta (pode faltar verificar a organização na OpenAI).");
    }
    if (err instanceof OpenAI.RateLimitError) return FAIL("A OpenAI está com muitos pedidos (ou o crédito acabou). Tente de novo em alguns minutos.");
    if (err instanceof OpenAI.BadRequestError) {
      if (err.code === "moderation_blocked")
        return FAIL("O filtro de segurança da OpenAI recusou esta imagem. Tente outra captura ou outra observação.");
      return FAIL("A OpenAI recusou o pedido. Tente de novo ou avise o suporte.");
    }
    if (err instanceof OpenAI.APIConnectionTimeoutError)
      return FAIL("A foto demorou demais para ficar pronta. Tente de novo (a qualidade rascunho é mais rápida).");
    if (err instanceof OpenAI.APIError) return FAIL("A OpenAI não respondeu agora. Tente de novo.");
    return FAIL("Não foi possível falar com a OpenAI agora.");
  }

  const usage = { model: CATALOG_PHOTO_MODEL, inputTokens: response.usage?.input_tokens ?? 0, outputTokens: response.usage?.output_tokens ?? 0 };
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) return FAIL("A OpenAI não devolveu a foto. Tente de novo.", usage);
  const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
  if (!JPEG_MAGIC.every((b, i) => bytes[i] === b)) return FAIL("A foto veio num formato inesperado. Tente de novo.", usage);
  return { ok: true, bytes, ext: "jpg", mime: "image/jpeg", ...usage };
}
