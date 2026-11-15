import "server-only";
import { migratePattern, validatePattern, type PatternDocument } from "@alinhavo/geometry";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * O que a ficha técnica e os textos por IA precisam do produto, lido com a
 * sessão do usuário (pela RLS): o produto, o tecido, os aviamentos e a versão
 * atual do molde. `pattern` é null sem molde ligado ou sem versão salva;
 * `doc` é null também quando a versão não lê ou não valida.
 */
export async function loadProductSources(supabase: Supabase, orgId: string, productId: string) {
  const { data: product } = await supabase
    .from("products")
    .select("reference, name, status, pattern_id, fabric_id, technical_description, collections(name)")
    .eq("id", productId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!product) return null;

  const [patternRes, fabricRes, trimsRes] = await Promise.all([
    product.pattern_id
      ? supabase.from("patterns").select("name, current_version").eq("id", product.pattern_id).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    product.fabric_id
      ? supabase
          .from("fabrics")
          .select("name, composition, width_mm, weight_gsm, price_cents")
          .eq("id", product.fabric_id)
          .eq("org_id", orgId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("product_trims")
      .select("name, quantity, unit, unit_price_cents")
      .eq("product_id", productId)
      .eq("org_id", orgId)
      .order("position")
      .order("created_at"),
  ]);
  const pattern = patternRes.data && patternRes.data.current_version > 0 ? patternRes.data : null;

  let doc: PatternDocument | null = null;
  if (pattern && product.pattern_id) {
    const { data: version } = await supabase
      .from("pattern_versions")
      .select("document")
      .eq("pattern_id", product.pattern_id)
      .eq("number", pattern.current_version)
      .maybeSingle();
    const read = migratePattern(version?.document);
    doc = read && validatePattern(read).length === 0 ? read : null;
  }

  return {
    product,
    collection: (product.collections as unknown as { name: string } | null)?.name ?? null,
    pattern,
    doc,
    fabric: fabricRes.data,
    trims: (trimsRes.data ?? []).map((t) => ({ name: t.name, quantity: Number(t.quantity), unit: t.unit, unitPriceCents: t.unit_price_cents })),
  };
}
