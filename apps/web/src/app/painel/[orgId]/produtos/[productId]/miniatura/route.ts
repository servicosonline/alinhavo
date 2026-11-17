import { readFlatSketch } from "@alinhavo/export/flat-sketch";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { byteaToBytes, imageMime, initialsSvg, pickApprovalImage, type ProductImageSource } from "@/lib/product-photo";
import { sketchThumbnailSvg } from "@/lib/product-sketch-thumb";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/** A imagem fica 5 min no navegador de quem pediu (é privada: nada de cache compartilhado). */
const CACHE = "private, max-age=300";

function image(body: BodyInit, type: string, source: ProductImageSource) {
  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": CACHE,
      "X-Alinhavo-Fonte": source,
      // Aberta direto no navegador, a imagem (inclusive o SVG) não roda nada nem é lida como outro tipo.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * GET /painel/[org]/produtos/[id]/miniatura: a imagem do produto, na ordem de `lib/product-photo.ts`
 * (foto enviada, foto de catálogo, captura da aprovação, desenho técnico, iniciais). Confere o login de
 * novo; quem decide o que a pessoa vê é a RLS (produto e arquivos de outra organização não aparecem).
 */
export async function GET(_request: Request, ctx: RouteContext<"/painel/[orgId]/produtos/[productId]/miniatura">) {
  const { orgId, productId } = await ctx.params;
  if (!isUuid(orgId) || !isUuid(productId)) return new Response(null, { status: 404 });
  if (!getSupabaseConfig()) return new Response(null, { status: 404 });
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, reference, pattern_id, photo_path")
    .eq("id", productId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!product) return new Response(null, { status: 404 });

  const download = async (bucket: string, path: string) => {
    const { data } = await supabase.storage.from(bucket).download(path);
    return data;
  };

  // 1. Foto enviada pela equipe.
  if (product.photo_path) {
    const file = await download("produtos", product.photo_path);
    if (file) return image(file, imageMime(product.photo_path), "foto");
  }

  // 2. Última foto de catálogo por IA.
  const { data: catalog } = await supabase
    .from("catalog_photos")
    .select("path")
    .eq("product_id", productId)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (catalog?.[0]) {
    const file = await download("catalogo", catalog[0].path);
    if (file) return image(file, imageMime(catalog[0].path), "catalogo");
  }

  // 3. Captura da última aprovação do molde ligado (de frente, se houver).
  if (product.pattern_id) {
    const { data: approvals } = await supabase
      .from("approvals")
      .select("id")
      .eq("pattern_id", product.pattern_id)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5);
    const ids = (approvals ?? []).map((a) => a.id);
    if (ids.length > 0) {
      const { data: images } = await supabase.from("approval_images").select("id, approval_id, angle, position").in("approval_id", ids);
      const pick = pickApprovalImage(ids, images ?? []);
      if (pick) {
        const { data: row } = await supabase.from("approval_images").select("mime, data").eq("id", pick.id).maybeSingle();
        const bytes = byteaToBytes(row?.data);
        if (row && bytes) return image(bytes, row.mime === "image/png" ? "image/png" : "image/jpeg", "aprovacao");
      }
    }
  }

  // 4. Desenho técnico da última ficha (só a parte do desenho, não a ficha inteira).
  const { data: packs } = await supabase
    .from("tech_packs")
    .select("sketch:data->sketch")
    .eq("product_id", productId)
    .eq("org_id", orgId)
    .order("number", { ascending: false })
    .limit(1);
  const sketch = readFlatSketch(packs?.[0]?.sketch);
  const svg = sketch ? sketchThumbnailSvg(sketch) : null;
  if (svg) return image(svg, "image/svg+xml; charset=utf-8", "desenho");

  // 5. As iniciais.
  return image(initialsSvg(product.name, product.reference), "image/svg+xml; charset=utf-8", "iniciais");
}
