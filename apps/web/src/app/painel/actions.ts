"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function createOrg(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O Supabase ainda não foi configurado neste ambiente." };
  // A ação confere o login por conta própria; não confia só no proxy.
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/painel");

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 120) return { error: "O nome precisa ter entre 2 e 120 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_org", { p_name: name });
  if (error || !data) return { error: "Não foi possível criar a organização. Tente de novo." };

  redirect(`/painel/${data.id}`);
}
