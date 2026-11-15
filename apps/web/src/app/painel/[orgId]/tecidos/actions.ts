"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { readFabricForm } from "@/lib/fabric-form";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const NO_CONFIG = "O Supabase ainda não foi configurado neste ambiente.";
const NO_PERMISSION = "Só donos, admins, modelistas e estilistas cadastram tecidos.";

export async function createFabric(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: NO_CONFIG };
  if (!isUuid(orgId)) return { error: "Organização inválida." };
  if (!(await getCurrentUser())) redirect(`/entrar?next=/painel/${orgId}/tecidos`);

  const read = readFabricForm(formData);
  if ("error" in read) return { error: read.error };
  const supabase = await createClient();
  const { error } = await supabase.from("fabrics").insert({ org_id: orgId, ...read.fields });
  if (error) return { error: error.code === "42501" ? NO_PERMISSION : "Não foi possível cadastrar o tecido." };
  revalidatePath(`/painel/${orgId}/tecidos`);
  return { ok: `Tecido "${read.fields.name}" cadastrado.` };
}

/** Salva o tecido inteiro (dados técnicos e o comportamento na Prova, com a foto). A permissão de verdade é a RLS. */
export async function updateFabric(orgId: string, fabricId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: NO_CONFIG };
  if (!isUuid(orgId) || !isUuid(fabricId)) return { error: "Pedido inválido." };
  if (!(await getCurrentUser())) redirect(`/entrar?next=/painel/${orgId}/tecidos/${fabricId}`);

  const read = readFabricForm(formData);
  if ("error" in read) return { error: read.error };
  const supabase = await createClient();
  const { data, error } = await supabase.from("fabrics").update(read.fields).eq("id", fabricId).eq("org_id", orgId).select("id");
  if (error) return { error: "Não foi possível salvar o tecido." };
  if (!data || data.length === 0) return { error: NO_PERMISSION.replace("cadastram", "editam") };
  revalidatePath(`/painel/${orgId}/tecidos`);
  revalidatePath(`/painel/${orgId}/tecidos/${fabricId}`);
  return { ok: "Tecido salvo. A Prova usa os dados novos na próxima vez que abrir." };
}

export async function deleteFabric(formData: FormData) {
  const orgId = formData.get("orgId");
  const fabricId = formData.get("fabricId");
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(fabricId)) return;
  if (!(await getCurrentUser())) return;
  const supabase = await createClient();
  await supabase.from("fabrics").delete().eq("id", fabricId).eq("org_id", orgId);
  revalidatePath(`/painel/${orgId}/tecidos`);
}
