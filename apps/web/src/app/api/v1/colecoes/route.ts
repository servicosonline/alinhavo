import { apiRpc } from "@/lib/api/rpc";
import { runApi } from "@/lib/api/v1";

/** GET /api/v1/colecoes: as coleções da organização da chave. */
export async function GET(request: Request) {
  return runApi(request, apiRpc(), "api_collections", {});
}
