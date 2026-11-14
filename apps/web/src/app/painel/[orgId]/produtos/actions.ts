"use server";

import { buildTechPack } from "@alinhavo/export/tech-pack";
import { migratePattern, validatePattern } from "@alinhavo/geometry";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { parseMoneyToCents, parseQuantity } from "@/lib/money";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Json, TrimUnit } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// Permissão de verdade: RLS e create_tech_pack (owner, admin, modelista e estilista).

const NO_PERMISSION = "Só donos, admins, modelistas e estilistas editam o produto.";
const UNITS: TrimUnit[] = ["un", "par", "m", "cm"];

async function ctx(orgId: unknown, productId: unknown) {
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(productId)) return null;
  if (!(await getCurrentUser())) return null;
  return { supabase: await createClient(), orgId, productId, path: `/painel/${orgId}/produtos/${productId}` };
}

export async function setProductFabric(formData: FormData) {
  const c = await ctx(formData.get("orgId"), formData.get("productId"));
  const raw = formData.get("fabricId");
  const fabricId = raw === "" || raw === null ? null : isUuid(raw) ? raw : undefined;
  if (!c || fabricId === undefined) return;
  await c.supabase.from("products").update({ fabric_id: fabricId }).eq("id", c.productId).eq("org_id", c.orgId);
  revalidatePath(c.path);
}

export async function addTrim(orgId: string, productId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const c = await ctx(orgId, productId);
  if (!c) return { error: "Sua sessão expirou ou o pedido é inválido." };
  const name = String(formData.get("name") ?? "").trim();
  const quantity = parseQuantity(formData.get("quantity"));
  const unit = String(formData.get("unit") ?? "") as TrimUnit;
  const price = parseMoneyToCents(formData.get("price"));
  if (name.length < 1 || name.length > 120) return { error: "Dê um nome ao aviamento (até 120 caracteres)." };
  if (quantity === undefined) return { error: "Quantidade inválida (ex.: 1 ou 1,5)." };
  if (!UNITS.includes(unit)) return { error: "Escolha a unidade." };
  if (price === undefined) return { error: "Preço inválido. Use, por exemplo, 2,50." };
  const { error } = await c.supabase
    .from("product_trims")
    .insert({ org_id: orgId, product_id: productId, name, quantity, unit, unit_price_cents: price });
  if (error) return { error: error.code === "42501" ? NO_PERMISSION : "Não foi possível adicionar o aviamento." };
  revalidatePath(c.path);
  return { ok: `"${name}" adicionado.` };
}

export async function deleteTrim(formData: FormData) {
  const c = await ctx(formData.get("orgId"), formData.get("productId"));
  const trimId = formData.get("trimId");
  if (!c || !isUuid(trimId)) return;
  await c.supabase.from("product_trims").delete().eq("id", trimId).eq("org_id", c.orgId);
  revalidatePath(c.path);
}

/**
 * Gera a ficha técnica com a versão atual do molde ligado, o tecido e os
 * aviamentos do produto. A conta (consumo estimado, custos) é a de
 * buildTechPack; o banco numera e guarda (create_tech_pack).
 */
export async function generateTechPack(orgId: string, productId: string): Promise<FormState> {
  const c = await ctx(orgId, productId);
  if (!c) return { error: "Sua sessão expirou ou o pedido é inválido." };
  const { data: product } = await c.supabase
    .from("products")
    .select("reference, name, status, pattern_id, fabric_id, collections(name)")
    .eq("id", productId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!product) return { error: "Produto não encontrado." };
  if (!product.pattern_id) return { error: "Ligue um molde ao produto antes de gerar a ficha." };

  const [patternRes, fabricRes, trimsRes] = await Promise.all([
    c.supabase.from("patterns").select("name, current_version").eq("id", product.pattern_id).eq("org_id", orgId).maybeSingle(),
    product.fabric_id
      ? c.supabase.from("fabrics").select("name, composition, width_mm, weight_gsm, price_cents").eq("id", product.fabric_id).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    c.supabase.from("product_trims").select("name, quantity, unit, unit_price_cents").eq("product_id", productId).eq("org_id", orgId).order("position").order("created_at"),
  ]);
  const pattern = patternRes.data;
  if (!pattern || pattern.current_version === 0) return { error: "O molde ligado ainda não tem versão salva." };
  const { data: version } = await c.supabase
    .from("pattern_versions")
    .select("document")
    .eq("pattern_id", product.pattern_id)
    .eq("number", pattern.current_version)
    .maybeSingle();
  const doc = migratePattern(version?.document);
  if (!doc || validatePattern(doc).length > 0) return { error: "A versão atual do molde não pôde ser lida." };

  const f = fabricRes.data;
  const data = buildTechPack({
    generatedAt: new Date().toISOString(),
    product: {
      reference: product.reference,
      name: product.name,
      status: product.status,
      collection: (product.collections as unknown as { name: string } | null)?.name ?? null,
    },
    pattern: { name: pattern.name, version: pattern.current_version, document: doc },
    fabric: f ? { name: f.name, composition: f.composition, widthMm: f.width_mm, weightGsm: f.weight_gsm, priceCents: f.price_cents } : null,
    trims: (trimsRes.data ?? []).map((t) => ({ name: t.name, quantity: Number(t.quantity), unit: t.unit, unitPriceCents: t.unit_price_cents })),
  });

  const { data: pack, error } = await c.supabase.rpc("create_tech_pack", {
    p_product_id: productId,
    p_pattern_version: pattern.current_version,
    p_data: data as unknown as Json,
  });
  if (error || !pack) return { error: error?.code === "42501" ? NO_PERMISSION : (error?.message ?? "Não foi possível gerar a ficha.") };
  revalidatePath(c.path);
  return { ok: `Ficha técnica nº ${pack.number} gerada (molde versão ${pattern.current_version}).` };
}
