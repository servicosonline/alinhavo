"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Permissão de verdade: RLS (owner, admin e modelista editam). Aqui só validação e mensagens.

const NO_CONFIG = "O Supabase ainda não foi configurado neste ambiente.";
const NO_PERMISSION = "Só donos, admins e modelistas editam tabelas de medidas.";

export type CellResult = { ok: true } | { ok: false; error: string };

async function ready(path: string) {
  if (!getSupabaseConfig()) return null;
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(path)}`);
  return createClient();
}

/** "PP, P, M" → ["PP", "P", "M"] (maiúsculas, sem repetidos). */
function parseSizes(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[,;\s]+/)) {
    const s = raw.trim().toUpperCase();
    if (s && s.length <= 20 && !out.includes(s)) out.push(s);
  }
  return out;
}

export async function createSizeChart(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(orgId)) return { error: "Organização inválida." };
  const supabase = await ready(`/painel/${orgId}/medidas`);
  if (!supabase) return { error: NO_CONFIG };

  const name = String(formData.get("name") ?? "").trim();
  const sizes = parseSizes(String(formData.get("sizes") ?? ""));
  if (name.length < 1 || name.length > 120) return { error: "Dê um nome à tabela." };
  if (sizes.length === 0) return { error: "Informe pelo menos um tamanho, como P, M, G." };

  const { data: chart, error } = await supabase.from("size_charts").insert({ org_id: orgId, name }).select("id").single();
  if (error || !chart) return { error: error?.code === "42501" ? NO_PERMISSION : "Não foi possível criar a tabela." };

  // Base: o do meio da grade (a modelista troca depois, se quiser).
  const base = Math.floor((sizes.length - 1) / 2);
  const { error: sizesError } = await supabase.from("sizes").insert(
    sizes.map((label, position) => ({ org_id: orgId, size_chart_id: chart.id, label, position, is_base: position === base })),
  );
  if (sizesError) return { error: "A tabela foi criada, mas os tamanhos não. Abra a tabela e inclua os tamanhos." };

  redirect(`/painel/${orgId}/medidas/${chart.id}`);
}

export async function addSize(orgId: string, chartId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(orgId) || !isUuid(chartId)) return { error: "Pedido inválido." };
  const supabase = await ready(`/painel/${orgId}/medidas/${chartId}`);
  if (!supabase) return { error: NO_CONFIG };
  const [label] = parseSizes(String(formData.get("label") ?? ""));
  if (!label) return { error: "Digite o tamanho, como GG ou 44." };

  const { data: last } = await supabase
    .from("sizes")
    .select("position")
    .eq("size_chart_id", chartId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("sizes")
    .insert({ org_id: orgId, size_chart_id: chartId, label, position: (last?.position ?? -1) + 1 });
  if (error) {
    if (error.code === "23505") return { error: `O tamanho ${label} já está na tabela.` };
    return { error: error.code === "42501" ? NO_PERMISSION : "Não foi possível incluir o tamanho." };
  }
  revalidatePath(`/painel/${orgId}/medidas/${chartId}`);
  return { ok: `Tamanho ${label} incluído.` };
}

export async function sizeAction(formData: FormData) {
  const orgId = formData.get("orgId");
  const chartId = formData.get("chartId");
  const sizeId = formData.get("sizeId");
  const op = formData.get("op");
  if (!isUuid(orgId) || !isUuid(chartId) || !isUuid(sizeId)) return;
  const supabase = await ready(`/painel/${orgId}/medidas/${chartId}`);
  if (!supabase) return;

  if (op === "base") {
    await supabase.rpc("set_base_size", { p_size_id: sizeId });
  } else if (op === "remove") {
    await supabase.from("sizes").delete().eq("id", sizeId).eq("size_chart_id", chartId);
  } else if (op === "up" || op === "down") {
    const { data: sizes } = await supabase
      .from("sizes")
      .select("id, position")
      .eq("size_chart_id", chartId)
      .order("position");
    const list = sizes ?? [];
    const i = list.findIndex((s) => s.id === sizeId);
    const j = op === "up" ? i - 1 : i + 1;
    const a = list[i];
    const b = list[j];
    if (a && b) {
      await supabase.from("sizes").update({ position: b.position }).eq("id", a.id);
      await supabase.from("sizes").update({ position: a.position }).eq("id", b.id);
    }
  }
  revalidatePath(`/painel/${orgId}/medidas/${chartId}`);
}

/** Grava uma célula da grade de medidas. `valueMm` null apaga a medida daquele tamanho. */
export async function saveMeasurement(
  orgId: string,
  chartId: string,
  sizeId: string,
  rawName: string,
  valueMm: number | null,
): Promise<CellResult> {
  if (!isUuid(orgId) || !isUuid(chartId) || !isUuid(sizeId)) return { ok: false, error: "Pedido inválido." };
  const name = rawName.trim().toLowerCase();
  if (!name || name.length > 60) return { ok: false, error: "Nome de medida inválido." };
  if (valueMm !== null && !(Number.isFinite(valueMm) && valueMm > 0 && valueMm < 5000)) {
    return { ok: false, error: "A medida precisa ser maior que zero e menor que 500 cm." };
  }
  const supabase = await ready(`/painel/${orgId}/medidas/${chartId}`);
  if (!supabase) return { ok: false, error: NO_CONFIG };

  // O tamanho precisa ser desta tabela (a RLS já garante a organização).
  const { data: size } = await supabase.from("sizes").select("id").eq("id", sizeId).eq("size_chart_id", chartId).maybeSingle();
  if (!size) return { ok: false, error: "Tamanho não encontrado." };

  const { data: existing } = await supabase
    .from("measurements")
    .select("id")
    .eq("size_id", sizeId)
    .eq("name", name)
    .maybeSingle();

  const { error } =
    valueMm === null
      ? existing
        ? await supabase.from("measurements").delete().eq("id", existing.id)
        : { error: null }
      : existing
        ? await supabase.from("measurements").update({ value_mm: valueMm }).eq("id", existing.id)
        : await supabase.from("measurements").insert({ org_id: orgId, size_id: sizeId, name, value_mm: valueMm });

  if (error) return { ok: false, error: error.code === "42501" ? NO_PERMISSION : "Não foi possível salvar a medida." };
  revalidatePath(`/painel/${orgId}/medidas/${chartId}`);
  return { ok: true };
}

export async function removeMeasurementRow(formData: FormData) {
  const orgId = formData.get("orgId");
  const chartId = formData.get("chartId");
  const name = String(formData.get("name") ?? "").trim().toLowerCase();
  if (!isUuid(orgId) || !isUuid(chartId) || !name) return;
  const supabase = await ready(`/painel/${orgId}/medidas/${chartId}`);
  if (!supabase) return;
  const { data: sizes } = await supabase.from("sizes").select("id").eq("size_chart_id", chartId);
  const ids = (sizes ?? []).map((s) => s.id);
  if (ids.length) await supabase.from("measurements").delete().eq("name", name).in("size_id", ids);
  revalidatePath(`/painel/${orgId}/medidas/${chartId}`);
}
