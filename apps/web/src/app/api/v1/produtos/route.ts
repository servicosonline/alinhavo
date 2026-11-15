import { apiRpc } from "@/lib/api/rpc";
import { apiError, parseLimit, runApi } from "@/lib/api/v1";
import { isUuid } from "@/lib/ids";

/** GET /api/v1/produtos?limite=50&depois=<id>: produtos da organização da chave, em páginas. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limite"));
  if (limit === null) return apiError(400, '"limite" precisa ser um número de 1 a 100.');
  const after = url.searchParams.get("depois");
  if (after !== null && !isUuid(after)) return apiError(400, '"depois" precisa ser o "proximo" da página anterior.');
  return runApi(request, apiRpc(), "api_products", { p_limit: limit, p_after: after });
}
