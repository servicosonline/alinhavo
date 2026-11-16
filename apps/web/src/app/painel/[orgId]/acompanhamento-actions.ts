"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { isUuid } from "@/lib/ids";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";
import { readShow, readValidity } from "@/lib/tracking";

// A permissão de verdade está nas funções do banco (create_tracking_link e revoke_tracking_link conferem
// quem edita produtos). Aqui: login, validação e o link pronto para mandar.

const TEXTS = {
  noPermission: "Só donos, admins, modelistas e estilistas enviam o acompanhamento.",
  fallback: "Não foi possível criar o link agora. Tente de novo em instantes.",
};

export async function createTrackingLink(
  orgId: string,
  kind: "produto" | "colecao",
  targetId: string,
  back: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await getCurrentUser())) return { error: "Entre de novo para continuar." };
  if (!isUuid(orgId) || !isUuid(targetId) || !back.startsWith(`/painel/${orgId}/`)) return { error: "Pedido inválido." };
  const show = readShow(formData);
  if (!show) return { error: "Escolha pelo menos uma coisa para a cliente ver." };
  const days = readValidity(formData.get("dias"));
  if (days === undefined) return { error: "Escolha a validade do link." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_tracking_link", { p_kind: kind, p_target: targetId, p_show: show, p_days: days });
  const token = data?.[0]?.token;
  if (error || !token) return { error: dbErrorMessage(error, TEXTS) };
  revalidatePath(back);
  return { ok: "Link criado. Mande para a cliente:", link: `${await getOrigin()}/acompanhar/${token}` };
}

export async function revokeTrackingLink(formData: FormData) {
  if (!(await getCurrentUser())) return;
  const id = formData.get("linkId");
  const back = String(formData.get("back") ?? "");
  if (!isUuid(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_tracking_link", { p_id: id });
  if (error) console.error("[acompanhamento] link não cancelado:", error.code);
  if (back.startsWith("/painel/")) revalidatePath(back);
}
