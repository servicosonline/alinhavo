"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

// A permissão de verdade fica nas funções do banco (quem pediu ou o superadmin); aqui, login e mensagens.
const TEXTS = { noPermission: "Essa conversa não é sua.", fallback: "Não foi possível enviar agora. Tente de novo em instantes." };

async function ready() {
  if (!(await getCurrentUser())) return null;
  return createClient();
}

function refresh(threadId: string) {
  revalidatePath(`/painel/suporte/${threadId}`);
  revalidatePath(`/painel/admin/suporte/${threadId}`);
  revalidatePath("/painel/suporte");
  revalidatePath("/painel/admin/suporte");
}

/** Abre a conversa (da organização em que a pessoa está, se houver) e leva até ela. */
export async function openSupport(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await ready();
  if (!supabase) return { error: "Entre de novo para continuar." };
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const org = formData.get("orgId");
  if (!subject || !body) return { error: "Escreva o assunto e a mensagem." };
  const { data, error } = await supabase.rpc("open_support_thread", { p_subject: subject, p_body: body, p_org_id: isUuid(org) ? org : null });
  if (error || !data) return { error: dbErrorMessage(error, TEXTS) };
  refresh(data);
  redirect(`/painel/suporte/${data}`);
}

/** Responde (o cliente ou o superadmin: o banco sabe quem é quem). */
export async function sendSupport(threadId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await ready();
  if (!supabase) return { error: "Entre de novo para continuar." };
  const body = String(formData.get("body") ?? "").trim();
  if (!isUuid(threadId) || !body) return { error: "Escreva a mensagem." };
  const { error } = await supabase.rpc("send_support_message", { p_thread_id: threadId, p_body: body });
  if (error) return { error: dbErrorMessage(error, TEXTS) };
  refresh(threadId);
  return { ok: "Enviada." };
}

export async function closeSupport(formData: FormData) {
  const supabase = await ready();
  const threadId = formData.get("threadId");
  if (!supabase || !isUuid(threadId)) return;
  const { error } = await supabase.rpc("close_support_thread", { p_thread_id: threadId });
  if (error) console.error("[suporte] conversa não fechou:", error.code);
  refresh(threadId);
}
