"use server";

import { buildTechPack } from "@alinhavo/export/tech-pack";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ui";
import { generateProductTexts } from "@/lib/ai/generate-texts";
import { getAiClient } from "@/lib/ai/client";
import { getOpenAiTextProvider } from "@/lib/ai/openai-client";
import { productFacts, SALES_MAX, TECHNICAL_MAX } from "@/lib/ai/product-text";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { loadProductSources } from "@/lib/product-sources";
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
 * Gera a ficha técnica com a versão atual do molde ligado, o tecido, os
 * aviamentos e, se houver, o último risco do Encaixe nessa versão e na
 * largura do tecido (consumo medido; sem ele, estimado). A conta é a de
 * buildTechPack; o banco numera e guarda (create_tech_pack).
 */
export async function generateTechPack(orgId: string, productId: string): Promise<FormState> {
  const c = await ctx(orgId, productId);
  if (!c) return { error: "Sua sessão expirou ou o pedido é inválido." };
  const src = await loadProductSources(c.supabase, orgId, productId);
  if (!src) return { error: "Produto não encontrado." };
  const { product, pattern, doc } = src;
  if (!product.pattern_id) return { error: "Ligue um molde ao produto antes de gerar a ficha." };
  if (!pattern) return { error: "O molde ligado ainda não tem versão salva." };
  if (!doc) return { error: "A versão atual do molde não pôde ser lida." };

  const f = src.fabric;
  // Consumo medido: o último risco desta versão do molde na largura do tecido.
  const { data: markerRow } = f?.width_mm
    ? await c.supabase
        .from("markers")
        .select("number, width_mm, length_mm, efficiency")
        .eq("product_id", productId)
        .eq("org_id", orgId)
        .eq("pattern_version", pattern.current_version)
        .eq("width_mm", f.width_mm)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };
  const data = buildTechPack({
    generatedAt: new Date().toISOString(),
    product: { reference: product.reference, name: product.name, status: product.status, collection: src.collection },
    pattern: { name: pattern.name, version: pattern.current_version, document: doc },
    fabric: f ? { name: f.name, composition: f.composition, widthMm: f.width_mm, weightGsm: f.weight_gsm, priceCents: f.price_cents } : null,
    trims: src.trims,
    marker: markerRow
      ? { number: markerRow.number, widthMm: markerRow.width_mm, lengthMm: Number(markerRow.length_mm), efficiency: Number(markerRow.efficiency) }
      : null,
    technicalDescription: product.technical_description,
  });

  const { data: pack, error } = await c.supabase.rpc("create_tech_pack", {
    p_product_id: productId,
    p_pattern_version: pattern.current_version,
    p_data: data as unknown as Json,
  });
  if (error || !pack) return { error: error?.code === "42501" ? NO_PERMISSION : (error?.message ?? "Não foi possível gerar a ficha.") };
  revalidatePath(c.path);
  const source = data.consumption.method === "nesting" ? `consumo pelo risco nº ${data.consumption.marker!.number}` : "consumo estimado";
  return { ok: `Ficha técnica nº ${pack.number} gerada (molde versão ${pattern.current_version}, ${source}).` };
}

export type ProductTextsResult = { ok: true; sales: string; technical: string } | { ok: false; error: string };

/**
 * Sugere os textos do produto pela IA (não grava no produto: a pessoa revisa
 * e salva). Reserva a geração no banco (permissão e limite do mês) antes de
 * chamar e registra modelo e tokens depois, dando certo ou não.
 */
export async function suggestProductTexts(orgId: string, productId: string): Promise<ProductTextsResult> {
  const c = await ctx(orgId, productId);
  if (!c) return { ok: false, error: "Sua sessão expirou ou o pedido é inválido." };
  // Claude direto ou pelo gateway; a OpenAI é a reserva (ver lib/ai/generate-texts.ts).
  const providers = { claude: getAiClient(), openai: getOpenAiTextProvider() };
  if (!providers.claude && !providers.openai) return { ok: false, error: "A IA ainda não foi configurada neste ambiente (ANTHROPIC_API_KEY ou o gateway)." };
  const src = await loadProductSources(c.supabase, orgId, productId);
  if (!src) return { ok: false, error: "Produto não encontrado." };

  const { data: generationId, error: reserveError } = await c.supabase.rpc("reserve_ai_generation", { p_product_id: productId, p_kind: "textos_produto" });
  if (reserveError || !generationId) {
    return { ok: false, error: dbErrorMessage(reserveError, { noPermission: NO_PERMISSION, fallback: "Não foi possível pedir a geração agora." }) };
  }

  const facts = productFacts({
    product: { name: src.product.name, reference: src.product.reference, collection: src.collection },
    fabric: src.fabric ? { name: src.fabric.name, composition: src.fabric.composition, weightGsm: src.fabric.weight_gsm, widthMm: src.fabric.width_mm } : null,
    trims: src.trims,
    doc: src.doc,
  });
  const result = await generateProductTexts(providers, facts);
  if (result.usedFallback) console.warn("[ia] textos pela reserva (OpenAI): o Claude falhou.");
  await c.supabase.rpc("finish_ai_generation", {
    p_id: generationId,
    p_ok: result.ok,
    p_model: result.model,
    p_input_tokens: result.inputTokens,
    p_output_tokens: result.outputTokens,
  });
  revalidatePath(c.path);
  return result.ok ? { ok: true, sales: result.texts.sales, technical: result.texts.technical } : { ok: false, error: result.error };
}

/** Grava os textos revisados no produto. A RLS só deixa quem edita produtos. */
export async function saveProductTexts(orgId: string, productId: string, sales: string, technical: string): Promise<FormState> {
  const c = await ctx(orgId, productId);
  if (!c) return { error: "Sua sessão expirou ou o pedido é inválido." };
  if (typeof sales !== "string" || typeof technical !== "string") return { error: "Pedido inválido." };
  const s = sales.trim();
  const t = technical.trim();
  if (s.length > SALES_MAX || t.length > TECHNICAL_MAX) return { error: `Textos até ${SALES_MAX} (venda) e ${TECHNICAL_MAX} (técnico) caracteres.` };
  const { data, error } = await c.supabase
    .from("products")
    .update({ sales_description: s || null, technical_description: t || null })
    .eq("id", productId)
    .eq("org_id", orgId)
    .select("id");
  if (error) return { error: "Não foi possível salvar os textos." };
  if (!data?.length) return { error: NO_PERMISSION };
  revalidatePath(c.path);
  return { ok: "Textos salvos. O técnico entra na próxima ficha gerada." };
}
