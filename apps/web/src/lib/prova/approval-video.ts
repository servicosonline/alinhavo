import { videoExtension } from "./video";

/**
 * Vídeo 360° no link de aprovação. O arquivo fica no Storage (bucket privado
 * `aprovacoes`, caminho `<org>/<aprovação>/video.<ext>`), enviado pelo
 * navegador com a sessão do usuário; quem não tem conta recebe um endereço
 * assinado pela Edge Function `aprovacao-video` (ver supabase/migrations/
 * 20261115030000_aprovacao_video.sql).
 */

export const APPROVAL_VIDEO_BUCKET = "aprovacoes";
/** O mesmo limite do bucket: 10 MB. */
export const APPROVAL_VIDEO_MAX_BYTES = 10 * 1024 * 1024;

/** Caminho do vídeo da aprovação no bucket, pelo formato gravado. */
export function approvalVideoPath(orgId: string, approvalId: string, type: string): string {
  return `${orgId}/${approvalId}/video.${videoExtension(type)}`;
}

/** O tipo que vai no envio (sem os codecs): o bucket só aceita video/mp4 e video/webm. */
export function approvalVideoContentType(type: string): "video/mp4" | "video/webm" {
  return videoExtension(type) === "mp4" ? "video/mp4" : "video/webm";
}

/** Endereço da Edge Function para um token. */
export function approvalVideoFunctionUrl(supabaseUrl: string, token: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/aprovacao-video?token=${encodeURIComponent(token)}`;
}

/** O endereço assinado da resposta da Edge Function, se ela respondeu um https válido; null se não. */
export function readSignedVideoUrl(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const url = (body as { url?: unknown }).url;
  if (typeof url !== "string") return null;
  try {
    return new URL(url).protocol === "https:" || url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1") ? url : null;
  } catch {
    return null;
  }
}

/**
 * Pede à Edge Function o endereço do vídeo (no servidor da página pública,
 * com a chave publicável). Qualquer falha vira null: a página mostra as
 * imagens e a resposta sem o vídeo.
 */
export async function fetchApprovalVideoUrl(config: { url: string; key: string }, token: string): Promise<string | null> {
  try {
    const res = await fetch(approvalVideoFunctionUrl(config.url, token), {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return readSignedVideoUrl(await res.json());
  } catch {
    return null;
  }
}
