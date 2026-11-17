"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { isUuid } from "@/lib/ids";
import { isProductPhotoPath } from "@/lib/product-photo";
import { createClient } from "@/lib/supabase/server";

const TEXTS = { noPermission: "Você não tem permissão para trocar a foto deste produto.", fallback: "Não deu para salvar a foto. Tente de novo." };

/**
 * Liga a foto já enviada pelo navegador (bucket privado `produtos`, pasta do produto) e apaga a anterior;
 * `null` tira a foto (volta a imagem automática). Quem pode é quem edita produtos (a RLS confere).
 */
export async function setProductPhoto(orgId: string, productId: string, path: string | null): Promise<{ error?: string }> {
  if (!(await getCurrentUser())) return { error: "Entre de novo para continuar." };
  if (!isUuid(orgId) || !isUuid(productId)) return { error: "Produto inválido." };
  if (path !== null && !isProductPhotoPath(path, orgId, productId)) return { error: "Caminho da foto inválido." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("products").select("photo_path").eq("id", productId).eq("org_id", orgId).maybeSingle();
  const { data, error } = await supabase.from("products").update({ photo_path: path }).eq("id", productId).eq("org_id", orgId).select("id");
  if (error) return { error: dbErrorMessage(error, TEXTS) };
  if (!data?.length) return { error: TEXTS.noPermission };
  const old = before?.photo_path;
  if (old && old !== path) {
    const { error: rmError } = await supabase.storage.from("produtos").remove([old]);
    if (rmError) console.error("[produto] foto antiga não apagada");
  }
  revalidatePath(`/painel/${orgId}/produtos/${productId}`);
  revalidatePath(`/painel/${orgId}/colecoes`, "layout");
  return {};
}
