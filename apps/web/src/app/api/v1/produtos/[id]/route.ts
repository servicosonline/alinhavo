import { apiRpc } from "@/lib/api/rpc";
import { badId, runApi } from "@/lib/api/v1";

/** GET /api/v1/produtos/{id}: um produto (com tecido, aviamentos e textos). */
export async function GET(request: Request, ctx: RouteContext<"/api/v1/produtos/[id]">) {
  const { id } = await ctx.params;
  return badId(id) ?? runApi(request, apiRpc(), "api_product", { p_id: id });
}
