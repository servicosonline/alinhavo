import { apiRpc } from "@/lib/api/rpc";
import { badId, runApi } from "@/lib/api/v1";

/** GET /api/v1/produtos/{id}/riscos: os riscos do Encaixe (largura, comprimento, aproveitamento, demanda). */
export async function GET(request: Request, ctx: RouteContext<"/api/v1/produtos/[id]/riscos">) {
  const { id } = await ctx.params;
  return badId(id) ?? runApi(request, apiRpc(), "api_markers", { p_product_id: id });
}
