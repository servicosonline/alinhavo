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
    .select("reference, name, status, pattern_id, fabric_id, size_chart_id, technical_description, sewing_cents, laundry_cents, waste_pct, collections(name)")
    .eq("id", productId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!product) return null;

  const [patternRes, fabricRes, trimsRes] = await Promise.all([
    product.pattern_id
      ? supabase.from("patterns").select("name, current_version, size_chart_id").eq("id", product.pattern_id).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    product.fabric_id
      ? supabase
          .from("fabrics")
          .select("name, composition, width_mm, weight_gsm, price_cents, price_per_kg_cents, shrinkage_warp_pct, shrinkage_weft_pct")
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

  const chartId = product.size_chart_id ?? patternRes.data?.size_chart_id ?? null;
  let sizeChart: { name: string; sizes: string[]; rows: { name: string; bySizeMm: Record<string, number> }[] } | null = null;
  if (chartId) {
    const [chartRes, sizesRes] = await Promise.all([
      supabase.from("size_charts").select("name").eq("id", chartId).eq("org_id", orgId).maybeSingle(),
      supabase.from("sizes").select("id, label").eq("size_chart_id", chartId).eq("org_id", orgId).order("position"),
    ]);
    const sizeList = sizesRes.data ?? [];
    if (chartRes.data && sizeList.length > 0) {
      const { data: meas } = await supabase
        .from("measurements")
        .select("size_id, name, value_mm")
        .eq("org_id", orgId)
        .in(
          "size_id",
          sizeList.map((s) => s.id),
        );
      const labelById = new Map(sizeList.map((s) => [s.id, s.label]));
      const byName = new Map<string, Record<string, number>>();
      for (const m of meas ?? []) {
        const label = labelById.get(m.size_id);
        if (!label) continue;
        const row = byName.get(m.name) ?? {};
        row[label] = Number(m.value_mm);
        byName.set(m.name, row);
      }
      sizeChart = {
        name: chartRes.data.name,
        sizes: sizeList.map((s) => s.label),
        rows: [...byName.entries()].map(([name, bySizeMm]) => ({ name, bySizeMm })),
      };
    }
  }

  return {
    product,
    collection: (product.collections as unknown as { name: string } | null)?.name ?? null,
    pattern,
    doc,
    fabric: fabricRes.data,
    trims: (trimsRes.data ?? []).map((t) => ({ name: t.name, quantity: Number(t.quantity), unit: t.unit, unitPriceCents: t.unit_price_cents })),
    sizeChart,
  };
}
