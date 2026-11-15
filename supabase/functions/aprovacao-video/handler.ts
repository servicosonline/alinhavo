/**
 * Edge Function `aprovacao-video`: o vídeo 360° de um link de aprovação para
 * quem não tem conta. Recebe o token, pergunta o caminho do vídeo ao banco
 * (approval_video_path, só para a chave de serviço) e devolve um endereço
 * assinado que vale VIDEO_URL_SECONDS. Token errado, vencido ou sem vídeo
 * respondem igual (404), como a página pública.
 *
 * Lógica pura (sem Deno nem Supabase): `index.ts` liga às dependências reais;
 * os testes passam dependências falsas.
 */

/** Por quanto tempo o endereço assinado vale, em s. */
export const VIDEO_URL_SECONDS = 600;

export type Deps = {
  /** Caminho do vídeo no bucket `aprovacoes`, ou null (token não vale ou sem vídeo). */
  videoPath(token: string): Promise<string | null>;
  /** Endereço assinado do arquivo, ou null se não deu. */
  signUrl(path: string, seconds: number): Promise<string | null>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const NOT_FOUND = { error: "Link de aprovação inválido, vencido ou sem vídeo." };

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "GET") return json(405, { error: "Use GET." });
  const token = new URL(req.url).searchParams.get("token") ?? "";
  // Token que nem é uuid não vai ao banco, mas responde igual a um que não existe.
  if (!UUID.test(token)) return json(404, NOT_FOUND);
  try {
    const path = await deps.videoPath(token.toLowerCase());
    if (!path) return json(404, NOT_FOUND);
    const url = await deps.signUrl(path, VIDEO_URL_SECONDS);
    if (!url) return json(404, NOT_FOUND);
    return json(200, { url, expiresIn: VIDEO_URL_SECONDS });
  } catch {
    return json(500, { error: "Não foi possível abrir o vídeo agora." });
  }
}
