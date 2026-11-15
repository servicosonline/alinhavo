"use server";

import { revalidatePath } from "next/cache";
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
  const { data, error } = await supabase.rpc("create_api_key", { p_org_id: orgId, p_name: name });
  const row = data?.[0];
  if (error || !row) return { ok: false, error: dbErrorMessage(error, { noPermission: NO_PERMISSION, fallback: "Não foi possível criar a chave." }) };
  revalidatePath(`/painel/${orgId}/api`);
  return { ok: true, secret: row.secret };
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
