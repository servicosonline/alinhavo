"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/** Mensagens que o banco (accept_invite) pode devolver e que podemos mostrar como estão. */
const MENSAGENS_DO_BANCO = [
  "Convite inválido.",
  "Convite já usado.",
  "Convite expirado.",
  "Você já faz parte desta organização.",
];

export async function acceptInvite(token: string): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O Supabase ainda não foi configurado neste ambiente." };
  if (!isUuid(token)) return { error: "Convite inválido." };
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=/convite/${token}`);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error || !data) {
    const conhecida = MENSAGENS_DO_BANCO.find((m) => error?.message.includes(m));
    return { error: conhecida ?? "Não foi possível aceitar o convite." };
  }

  redirect(`/painel/${data.org_id}`);
}
