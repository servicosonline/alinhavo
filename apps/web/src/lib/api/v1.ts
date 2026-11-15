import { isUuid } from "../ids";

/**
 * API pública v1 (Fase 6c): regras das rotas /api/v1, sem Next nem Supabase.
 * A rota lê a chave do cabeçalho, chama uma função api_* do banco (que
 * confere a chave, a revogação e o limite por minuto) e devolve JSON.
 */

/** O erro que o banco devolve (o que importa dele). */
export type DbError = { code?: string; message?: string } | null;
/** Chamada a uma função do banco, como o supabase-js faz. */
export type Rpc = (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: DbError }>;

const HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

export function apiJson(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
}

export const apiError = (status: number, mensagem: string, extra: Record<string, string> = {}) => apiJson(status, { erro: mensagem }, extra);

/** A chave do cabeçalho `Authorization: Bearer alv_...`; null sem ela. */
export function bearerKey(header: string | null): string | null {
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header ?? "");
  return m ? m[1]! : null;
}

/** Erro do banco → resposta. Só as mensagens das nossas funções passam; o resto vira genérico. */
export function rpcErrorResponse(error: NonNullable<DbError>): Response {
  if (error.code === "28000") return apiError(401, "Chave de API inválida ou revogada.", { "WWW-Authenticate": "Bearer" });
  if (error.code === "54000") return apiError(429, error.message ?? "Limite de pedidos por minuto.", { "Retry-After": "60" });
  return apiError(500, "Erro inesperado. Tente de novo.");
}

/** `limite` da URL: inteiro de 1 a 100 (padrão 50); null se veio inválido. */
export function parseLimit(raw: string | null): number | null {
  if (raw === null || raw === "") return 50;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 && n <= 100 ? n : null;
}

/**
 * O caminho comum das rotas: confere a chave no cabeçalho, chama a função do
 * banco e devolve o JSON (404 quando a função devolve null: não existe ou é de
 * outra organização, a resposta é a mesma).
 */
export async function runApi(request: Request, rpc: Rpc | null, fn: string, args: Record<string, unknown>): Promise<Response> {
  if (!rpc) return apiError(503, "API indisponível neste ambiente.");
  const key = bearerKey(request.headers.get("authorization"));
  if (!key) return apiError(401, 'Mande a chave no cabeçalho "Authorization: Bearer alv_...".', { "WWW-Authenticate": "Bearer" });
  try {
    const { data, error } = await rpc(fn, { p_key: key, ...args });
    if (error) return rpcErrorResponse(error);
    if (data === null || data === undefined) return apiError(404, "Não encontrado.");
    return apiJson(200, data);
  } catch {
    return apiError(500, "Erro inesperado. Tente de novo.");
  }
}

/** Confere o id do caminho antes de ir ao banco. */
export function badId(id: string): Response | null {
  return isUuid(id) ? null : apiError(404, "Não encontrado.");
}
