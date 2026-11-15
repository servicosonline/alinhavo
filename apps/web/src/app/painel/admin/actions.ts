"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { isUuid } from "@/lib/ids";
import { getOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";
import type { OrgRole, SubscriptionStatus } from "@/lib/supabase/database.types";

// A permissão de verdade fica nas funções platform_* (conferem o papel na plataforma e gravam a auditoria).
// Aqui: login, validação e mensagens.

const TEXTS = { noPermission: "Só o superadmin faz isso.", fallback: "Não foi possível agora. Tente de novo em instantes." };
const ROLES: OrgRole[] = ["owner", "admin", "modelista", "estilista", "leitura"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isRole = (v: unknown): v is OrgRole => ROLES.includes(v as OrgRole);

async function ready() {
  if (!(await getCurrentUser())) return null;
  return createClient();
}

export async function adminInvite(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await ready();
  if (!supabase) return { error: "Entre de novo para continuar." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = formData.get("role");
  if (!isUuid(orgId) || !EMAIL_RE.test(email) || !isRole(role)) return { error: "Confira o e-mail e o papel." };
  const { data, error } = await supabase.rpc("platform_create_invite", { p_org_id: orgId, p_email: email, p_role: role });
  if (error || !data) return { error: dbErrorMessage(error, TEXTS) };
  revalidatePath(`/painel/admin/clientes/${orgId}`);
  return { ok: `Convite criado para ${email}. Mande o link:`, link: `${await getOrigin()}/convite/${data}` };
}

export async function adminSetRole(formData: FormData) {
  const supabase = await ready();
  const orgId = formData.get("orgId");
  const userId = formData.get("userId");
  const role = formData.get("role");
  if (!supabase || !isUuid(orgId) || !isUuid(userId) || !isRole(role)) return;
  const { error } = await supabase.rpc("platform_set_member_role", { p_org_id: orgId, p_user_id: userId, p_role: role });
  if (error) console.error("[superadmin] papel não mudou:", error.code);
  revalidatePath(`/painel/admin/clientes/${orgId}`);
}

export async function adminRemoveMember(formData: FormData) {
  const supabase = await ready();
  const orgId = formData.get("orgId");
  const userId = formData.get("userId");
  if (!supabase || !isUuid(orgId) || !isUuid(userId)) return;
  const { error } = await supabase.rpc("platform_remove_member", { p_org_id: orgId, p_user_id: userId });
  if (error) console.error("[superadmin] membro não saiu:", error.code);
  revalidatePath(`/painel/admin/clientes/${orgId}`);
}

const SUB_STATUSES: SubscriptionStatus[] = ["trial", "ativa", "cortesia", "cancelada"];

export async function adminSetSubscription(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await ready();
  if (!supabase) return { error: "Entre de novo para continuar." };
  const status = formData.get("status") as SubscriptionStatus;
  const days = Number(formData.get("days"));
  const plan = String(formData.get("plan") ?? "");
  if (!isUuid(orgId) || !SUB_STATUSES.includes(status)) return { error: "Escolha o status." };
  if (status === "trial" && !(days >= 1 && days <= 90)) return { error: "Para o teste, de 1 a 90 dias." };
  const { error } = await supabase.rpc("platform_set_subscription", {
    p_org_id: orgId,
    p_status: status,
    p_trial_days: status === "trial" ? days : null,
    p_plan_id: ["gratis", "modelista", "confeccao"].includes(plan) ? plan : null,
  });
  if (error) return { error: dbErrorMessage(error, TEXTS) };
  revalidatePath(`/painel/admin/clientes/${orgId}`);
  revalidatePath("/painel/admin");
  return { ok: "Plano atualizado." };
}

export async function adminAddHelper(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await ready();
  if (!supabase) return { error: "Entre de novo para continuar." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = formData.get("role");
  if (!EMAIL_RE.test(email) || (role !== "dono" && role !== "suporte")) return { error: "Confira o e-mail e o papel." };
  const { error } = await supabase.rpc("platform_add_admin", { p_email: email, p_role: role });
  if (error) return { error: dbErrorMessage(error, TEXTS) };
  revalidatePath("/painel/admin/equipe");
  return { ok: `${email} agora ajuda na administração.` };
}

export async function adminRemoveHelper(formData: FormData) {
  const supabase = await ready();
  const userId = formData.get("userId");
  if (!supabase || !isUuid(userId)) return;
  const { error } = await supabase.rpc("platform_remove_admin", { p_user_id: userId });
  if (error) console.error("[superadmin] ajudante não saiu:", error.code);
  revalidatePath("/painel/admin/equipe");
}
