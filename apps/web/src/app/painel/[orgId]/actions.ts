"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getOrigin } from "@/lib/origin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const INVITE_ROLES = ["admin", "modelista", "estilista", "leitura"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// As permissões de verdade estão na RLS (só owner/admin convidam). Aqui só
// validamos a entrada e traduzimos os erros.

export async function createInvite(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O Supabase ainda não foi configurado neste ambiente." };
  if (!isUuid(orgId)) return { error: "Organização inválida." };
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=/painel/${orgId}`);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Digite um e-mail válido." };
  if (!INVITE_ROLES.includes(role as (typeof INVITE_ROLES)[number])) return { error: "Escolha um papel." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .insert({ org_id: orgId, email, role: role as (typeof INVITE_ROLES)[number] })
    .select("token")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Já existe um convite pendente para este e-mail." };
    if (error.code === "42501") return { error: "Só donos e admins podem convidar." };
    return { error: "Não foi possível criar o convite." };
  }

  revalidatePath(`/painel/${orgId}`);
  return {
    ok: `Convite criado para ${email}. Envie o link abaixo (vale por 7 dias).`,
    link: `${await getOrigin()}/convite/${data.token}`,
  };
}

export async function cancelInvite(formData: FormData) {
  const orgId = formData.get("orgId");
  const inviteId = formData.get("inviteId");
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(inviteId)) return;
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=/painel/${orgId}`);

  const supabase = await createClient();
  await supabase.from("invites").delete().eq("id", inviteId).eq("org_id", orgId);
  revalidatePath(`/painel/${orgId}`);
}
