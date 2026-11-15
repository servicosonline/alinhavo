"use server";

import { revalidatePath } from "next/cache";
import { pickEvents, webhookUrlProblem } from "@/lib/api/webhooks";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CreateKeyResult = { ok: true; secret: string } | { ok: false; error: string };

const NO_PERMISSION = "Só donos e admins gerenciam chaves de API.";

/** Cria uma chave de API e devolve o segredo (a única vez que ele aparece). Permissão no banco. */
export async function createApiKey(orgId: string, name: string): Promise<CreateKeyResult> {
  if (!getSupabaseConfig() || !isUuid(orgId) || typeof name !== "string") return { ok: false, error: "Pedido inválido." };
  if (!(await getCurrentUser())) return { ok: false, error: "Sua sessão expirou. Entre de novo." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_api_key", {
    p_org_id: orgId,
    p_name: name,
  });
  const row = data?.[0];
  if (error || !row)
    return {
      ok: false,
      error: dbErrorMessage(error, {
        noPermission: NO_PERMISSION,
        fallback: "Não foi possível criar a chave.",
      }),
    };
  revalidatePath(`/painel/${orgId}/api`);
  return { ok: true, secret: row.secret };
}

const NO_WEBHOOK_PERMISSION = "Só donos e admins gerenciam webhooks.";

/** Cadastra um webhook e devolve o segredo de assinatura (a única vez que ele aparece). */
export async function createWebhook(orgId: string, url: string, events: string[]): Promise<CreateKeyResult> {
  if (!getSupabaseConfig() || !isUuid(orgId) || typeof url !== "string" || !Array.isArray(events)) return { ok: false, error: "Pedido inválido." };
  const problem = webhookUrlProblem(url);
  if (problem) return { ok: false, error: problem };
  const chosen = pickEvents(events);
  if (chosen.length === 0) return { ok: false, error: "Escolha pelo menos um evento." };
  if (!(await getCurrentUser())) return { ok: false, error: "Sua sessão expirou. Entre de novo." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_webhook_endpoint", {
    p_org_id: orgId,
    p_url: url.trim(),
    p_events: chosen,
  });
  const row = data?.[0];
  if (error || !row)
    return {
      ok: false,
      error: dbErrorMessage(error, {
        noPermission: NO_WEBHOOK_PERMISSION,
        fallback: "Não foi possível cadastrar o webhook.",
      }),
    };
  revalidatePath(`/painel/${orgId}/api`);
  return { ok: true, secret: row.secret };
}

/** Liga, desliga, apaga ou manda um teste (formulário com orgId, webhookId e op). */
export async function webhookAction(formData: FormData) {
  const orgId = formData.get("orgId");
  const id = formData.get("webhookId");
  const op = formData.get("op");
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(id)) return;
  if (!(await getCurrentUser())) return;
  const supabase = await createClient();
  if (op === "ligar" || op === "desligar")
    await supabase.rpc("set_webhook_endpoint_active", {
      p_id: id,
      p_active: op === "ligar",
    });
  else if (op === "apagar") await supabase.rpc("delete_webhook_endpoint", { p_id: id });
  else if (op === "testar") await supabase.rpc("send_test_webhook", { p_id: id });
  else return;
  revalidatePath(`/painel/${orgId}/api`);
}

/** Revoga uma chave (para de funcionar na hora). */
export async function revokeApiKey(formData: FormData) {
  const orgId = formData.get("orgId");
  const keyId = formData.get("keyId");
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(keyId)) return;
  if (!(await getCurrentUser())) return;
  const supabase = await createClient();
  await supabase.rpc("revoke_api_key", { p_id: keyId });
  revalidatePath(`/painel/${orgId}/api`);
}
