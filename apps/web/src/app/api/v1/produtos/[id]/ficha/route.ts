import { apiRpc } from "@/lib/api/rpc";
import { badId, runApi } from "@/lib/api/v1";

/** GET /api/v1/produtos/{id}/ficha: a ficha técnica mais recente (consumo, aviamentos, texto e desenho técnico). */
export async function GET(request: Request, ctx: RouteContext<"/api/v1/produtos/[id]/ficha">) {
  const { id } = await ctx.params;
  return badId(id) ?? runApi(request, apiRpc(), "api_tech_pack", { p_product_id: id });
}
