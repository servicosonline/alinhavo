"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

// A permissão de verdade é a RLS (só dono e admin mexem na organização e na equipe; a organização nunca
// fica sem dono, pelo gatilho do banco). Aqui só conferimos o login, validamos e traduzimos o erro.

const TEXTS = {
  noPermission: "Só dono e admin mudam as configurações da organização.",
  fallback: "Não conseguimos salvar agora. Tente de novo em instantes.",
};
const ROLES = ["owner", "admin", "modelista", "estilista", "leitura"] as const;
const COVER_PATH = /^[0-9a-f-]{36}\/[A-Za-z0-9_-]{1,64}\.(webp|jpg|png)$/;

export async function renameOrg(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getCurrentUser())) return { error: "Entre de novo para continuar." };
  if (!isUuid(orgId)) return { error: "Organização inválida." };
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) return { error: "O nome precisa ter de 1 a 80 letras." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("orgs").update({ name }).eq("id", orgId).select("id");
  if (error) return { error: dbErrorMessage(error, TEXTS) };
  if (!data?.length) return { error: TEXTS.noPermission };
  revalidatePath(`/painel/${orgId}`, "layout");
  revalidatePath("/painel");
  return { ok: "Nome salvo." };
}

/** Liga a capa já enviada pelo navegador (bucket `org-capas`, pasta da organização) e apaga a anterior. */
export async function setOrgCover(orgId: string, path: string | null): Promise<{ error?: string }> {
  if (!(await getCurrentUser())) return { error: "Entre de novo para continuar." };
  if (!isUuid(orgId)) return { error: "Organização inválida." };
  if (path !== null && (!COVER_PATH.test(path) || !path.startsWith(`${orgId}/`))) return { error: "Caminho da capa inválido." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("orgs").select("thumbnail_path").eq("id", orgId).maybeSingle();
  const { data, error } = await supabase.from("orgs").update({ thumbnail_path: path }).eq("id", orgId).select("id");
  if (error) return { error: dbErrorMessage(error, TEXTS) };
  if (!data?.length) return { error: TEXTS.noPermission };
  const old = before?.thumbnail_path;
  if (old && old !== path) {
    const { error: rmError } = await supabase.storage.from("org-capas").remove([old]);
    if (rmError) console.error("[organização] capa antiga não apagada");
  }
  revalidatePath(`/painel/${orgId}`, "layout");
  revalidatePath("/painel");
  return {};
}

export async function changeMemberRole(formData: FormData) {
  if (!(await getCurrentUser())) return;
  const orgId = String(formData.get("orgId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!isUuid(orgId) || !isUuid(userId) || !ROLES.includes(role as (typeof ROLES)[number])) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("org_members")
    .update({ role: role as (typeof ROLES)[number] })
    .eq("org_id", orgId)
    .eq("user_id", userId);
  if (error) console.error("[equipe] papel não mudou:", error.code);
  revalidatePath(`/painel/${orgId}/configuracoes`);
}

/** Libera ou trava a criação de organizações próprias de um membro (dono e admin; ninguém muda a própria). */
export async function setMemberCanCreateOrgs(formData: FormData) {
  if (!(await getCurrentUser())) return;
  const orgId = String(formData.get("orgId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const allow = formData.get("allow") === "1";
  if (!isUuid(orgId) || !isUuid(userId)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("org_members").update({ can_create_orgs: allow }).eq("org_id", orgId).eq("user_id", userId);
  if (error) console.error("[equipe] criar organizações não mudou:", error.code);
  revalidatePath(`/painel/${orgId}/configuracoes`);
}

export async function removeMember(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const orgId = String(formData.get("orgId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!isUuid(orgId) || !isUuid(userId)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("org_members").delete().eq("org_id", orgId).eq("user_id", userId);
  if (error) console.error("[equipe] membro não saiu:", error.code);
  revalidatePath(`/painel/${orgId}/configuracoes`);
}
