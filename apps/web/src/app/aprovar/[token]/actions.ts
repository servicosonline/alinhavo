"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ui";
import { isUuid } from "@/lib/ids";
import { approvalErrorMessage } from "@/lib/prova/approval";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Resposta do cliente, sem conta. Quem decide se vale (token, prazo, uma vez
 * só, comentário obrigatório ao pedir ajustes) é a função do banco.
 */
export async function decideApproval(token: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O serviço está indisponível agora." };
  if (!isUuid(token)) return { error: "Este link de aprovação não vale mais (vencido ou inválido)." };
  const status = formData.get("status");
  if (status !== "aprovado" && status !== "ajustes") return { error: "Escolha aprovar ou pedir ajustes." };
  const name = String(formData.get("name") ?? "").slice(0, 200);
  const comment = String(formData.get("comment") ?? "").slice(0, 2100);

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_approval", {
    p_token: token,
    p_status: status,
    p_name: name,
    p_comment: comment || null,
  });
  if (error) return { error: approvalErrorMessage(error) };
  revalidatePath(`/aprovar/${token}`);
  return { ok: status === "aprovado" ? "Obrigado! A aprovação foi registrada." : "Obrigado! Seu pedido de ajustes foi enviado." };
}
