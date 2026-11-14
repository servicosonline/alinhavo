"use server";

import { validatePattern, type PatternDocument } from "@alinhavo/geometry";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SaveResult } from "@/components/editor/pattern-editor";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export async function createPattern(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O Supabase ainda não foi configurado neste ambiente." };
  if (!isUuid(orgId)) return { error: "Organização inválida." };
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=/painel/${orgId}/moldes`);

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 120) return { error: "Dê um nome ao molde (até 120 caracteres)." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("patterns").insert({ org_id: orgId, name }).select("id").single();
  if (error || !data) {
    if (error?.code === "42501") return { error: "Só donos, admins e modelistas criam moldes." };
    return { error: "Não foi possível criar o molde." };
  }
  redirect(`/painel/${orgId}/moldes/${data.id}`);
}

/**
 * Salva uma nova versão. O documento é validado aqui de novo: o servidor não
 * confia no navegador. A permissão e a checagem de versão ficam no banco.
 */
export async function savePatternVersion(
  orgId: string,
  patternId: string,
  expectedVersion: number,
  document: PatternDocument,
  message: string,
): Promise<SaveResult> {
  if (!getSupabaseConfig()) return { ok: false, error: "O Supabase ainda não foi configurado neste ambiente." };
  if (!isUuid(orgId) || !isUuid(patternId) || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
    return { ok: false, error: "Pedido inválido." };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre de novo para salvar." };

  const erros = isPatternShape(document) ? validatePattern(document) : ["Documento do molde inválido."];
  if (erros.length > 0) return { ok: false, error: erros[0]! };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_pattern_version", {
    p_pattern_id: patternId,
    p_document: document as unknown as Json,
    p_origin: "editor",
    p_expected_version: expectedVersion,
    p_message: message.trim().slice(0, 500) || null,
  });

  if (error || !data) {
    if (error?.code === "40001") {
      return { ok: false, error: "Outra pessoa salvou este molde enquanto você editava. Recarregue a página para ver a versão nova." };
    }
    if (error?.code === "42501") return { ok: false, error: "Você não tem permissão para editar este molde." };
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath(`/painel/${orgId}/moldes`);
  return { ok: true, version: data.number };
}

/** Confere a forma mínima antes de validar (o que chega numa Server Action pode ser qualquer coisa). */
function isPatternShape(v: unknown): v is PatternDocument {
  if (!v || typeof v !== "object") return false;
  const d = v as Record<string, unknown>;
  return (
    Array.isArray(d.sizes) &&
    Array.isArray(d.pieces) &&
    typeof d.baseSize === "string" &&
    d.pieces.every((p) => {
      if (!p || typeof p !== "object") return false;
      const q = p as Record<string, unknown>;
      return (
        typeof q.id === "string" &&
        typeof q.start === "string" &&
        typeof q.seamAllowance === "number" &&
        !!q.points &&
        typeof q.points === "object" &&
        Array.isArray(q.outline)
      );
    })
  );
}

/** Liga (ou desliga, com chartId vazio) o molde a uma tabela de medidas. */
export async function linkSizeChart(formData: FormData) {
  const orgId = formData.get("orgId");
  const patternId = formData.get("patternId");
  const chartRaw = formData.get("chartId");
  const chartId = chartRaw === "" || chartRaw === null ? null : isUuid(chartRaw) ? chartRaw : undefined;
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(patternId) || chartId === undefined) return;
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=/painel/${orgId}/moldes/${patternId}`);
  const supabase = await createClient();
  // A FK composta (size_chart_id, org_id) impede ligar a tabela de outra organização.
  await supabase.from("patterns").update({ size_chart_id: chartId }).eq("id", patternId).eq("org_id", orgId);
  revalidatePath(`/painel/${orgId}/moldes/${patternId}`);
}
