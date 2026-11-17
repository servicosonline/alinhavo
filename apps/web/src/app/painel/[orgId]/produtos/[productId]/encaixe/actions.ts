"use server";

import { migratePattern, validatePattern } from "@alinhavo/geometry";
import { buildMarkerLayout, MarkerLayoutError, patternNestPieces } from "@alinhavo/nesting";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { checkMarkerInput } from "@/lib/encaixe/marker";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// Permissão de verdade: RLS e create_marker (owner, admin e modelista, no plano Confecção).

const NO_PERMISSION = "Só donos, admins e modelistas salvam encaixes.";

export type SaveMarkerState = { error?: string; ok?: string; number?: number };

async function ctx(orgId: unknown, productId: unknown) {
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(productId)) return null;
  if (!(await getCurrentUser())) return null;
  return { supabase: await createClient(), orgId, productId };
}

/**
 * Salva o risco calculado no navegador. As peças são remontadas aqui, da
 * versão do molde; as posições recebidas são conferidas contra elas
 * (`buildMarkerLayout`), e comprimento e aproveitamento são recalculados.
 */
export async function saveMarker(
  orgId: string,
  productId: string,
  version: number,
  input: unknown,
  placements: unknown,
): Promise<SaveMarkerState> {
  const c = await ctx(orgId, productId);
  if (!c) return { error: "Sua sessão expirou ou o pedido é inválido." };
  if (!Number.isInteger(version) || version < 1) return { error: "Versão do molde inválida." };

  const { data: product } = await c.supabase.from("products").select("pattern_id, fabric_id").eq("id", productId).eq("org_id", orgId).maybeSingle();
  if (!product) return { error: "Produto não encontrado." };
  if (!product.pattern_id) return { error: "Ligue um molde ao produto antes de encaixar." };
  const { data: pattern } = await c.supabase.from("patterns").select("current_version").eq("id", product.pattern_id).eq("org_id", orgId).maybeSingle();
  if (!pattern) return { error: "Molde não encontrado." };
  if (pattern.current_version !== version) return { error: "O molde ganhou uma versão nova desde que você encaixou. Recarregue a página e encaixe de novo." };

  const { data: row } = await c.supabase.from("pattern_versions").select("document").eq("pattern_id", product.pattern_id).eq("number", version).maybeSingle();
  const doc = migratePattern(row?.document);
  if (!doc || validatePattern(doc).length > 0) return { error: "A versão do molde não pôde ser lida." };

  const settings = checkMarkerInput(doc.sizes, input);
  if (!settings) return { error: "Demanda ou medidas do tecido inválidas." };

  let layout;
  try {
    layout = buildMarkerLayout(patternNestPieces(doc, settings.demand), placements, settings);
  } catch (err) {
    if (err instanceof MarkerLayoutError) return { error: `O risco não confere com o molde: ${err.message}` };
    return { error: "Não foi possível conferir o risco." };
  }

  const { data: marker, error } = await c.supabase.rpc("create_marker", {
    p_product_id: productId,
    p_pattern_version: version,
    p_fabric_id: product.fabric_id,
    p_width_mm: settings.widthMm,
    p_demand: settings.demand as unknown as Json,
    p_length_mm: layout.lengthMm,
    p_efficiency: layout.efficiency,
    p_layout: layout as unknown as Json,
  });
  if (error || !marker) return { error: dbErrorMessage(error, { noPermission: NO_PERMISSION, fallback: "Não foi possível salvar o encaixe." }) };
  revalidatePath(`/painel/${orgId}/produtos/${productId}`);
  revalidatePath(`/painel/${orgId}/produtos/${productId}/encaixe`);
  return { ok: `Risco nº ${marker.number} salvo.`, number: marker.number };
}

export async function deleteMarker(formData: FormData) {
  const c = await ctx(formData.get("orgId"), formData.get("productId"));
  const markerId = formData.get("markerId");
  if (!c || !isUuid(markerId)) return;
  await c.supabase.from("markers").delete().eq("id", markerId).eq("org_id", c.orgId);
  revalidatePath(`/painel/${c.orgId}/produtos/${c.productId}`);
  revalidatePath(`/painel/${c.orgId}/produtos/${c.productId}/encaixe`);
}
