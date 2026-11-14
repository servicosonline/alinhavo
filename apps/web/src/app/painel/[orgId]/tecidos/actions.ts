"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { parseMoneyToCents } from "@/lib/money";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { FabricPreset } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { parseCmToMm } from "@/lib/units";

const PRESETS: FabricPreset[] = ["malha", "planoLeve", "jeans"];

export async function createFabric(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O Supabase ainda não foi configurado neste ambiente." };
  if (!isUuid(orgId)) return { error: "Organização inválida." };
  if (!(await getCurrentUser())) redirect(`/entrar?next=/painel/${orgId}/tecidos`);

  const name = String(formData.get("name") ?? "").trim();
  const composition = String(formData.get("composition") ?? "").trim();
  const widthText = String(formData.get("width") ?? "").trim();
  const weightText = String(formData.get("weight") ?? "").trim().replace(",", ".");
  const price = parseMoneyToCents(formData.get("price"));
  const presetRaw = String(formData.get("preset") ?? "");
  if (name.length < 1 || name.length > 120) return { error: "Dê um nome ao tecido (até 120 caracteres)." };
  if (composition.length > 200) return { error: "Composição com até 200 caracteres." };
  const widthMm = widthText ? parseCmToMm(widthText) : null;
  if (widthMm !== null && (widthMm < 100 || widthMm > 5000)) return { error: "Largura útil entre 10 e 500 cm." };
  const weight = weightText ? Number(weightText) : null;
  if (weight !== null && !(weight > 0 && weight < 2000)) return { error: "Gramatura em g/m², entre 1 e 2000." };
  if (price === undefined) return { error: "Preço inválido. Use, por exemplo, 39,90." };
  const preset = PRESETS.includes(presetRaw as FabricPreset) ? (presetRaw as FabricPreset) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("fabrics").insert({
    org_id: orgId,
    name,
    composition: composition || null,
    width_mm: widthMm === null ? null : Math.round(widthMm),
    weight_gsm: weight,
    price_cents: price,
    preset,
  });
  if (error) return { error: error.code === "42501" ? "Só donos, admins, modelistas e estilistas cadastram tecidos." : "Não foi possível cadastrar o tecido." };
  revalidatePath(`/painel/${orgId}/tecidos`);
  return { ok: `Tecido "${name}" cadastrado.` };
}

export async function deleteFabric(formData: FormData) {
  const orgId = formData.get("orgId");
  const fabricId = formData.get("fabricId");
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(fabricId)) return;
  if (!(await getCurrentUser())) return;
  const supabase = await createClient();
  await supabase.from("fabrics").delete().eq("id", fabricId).eq("org_id", orgId);
  revalidatePath(`/painel/${orgId}/tecidos`);
}
