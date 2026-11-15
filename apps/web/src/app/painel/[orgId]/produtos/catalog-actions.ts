"use server";

import { revalidatePath } from "next/cache";
import { catalogPhotoPrompt, photoSettings, readCaptureImage, readPhotoOptions, safetyIdentifier } from "@/lib/ai/catalog-photo";
import { callCatalogPhoto } from "@/lib/ai/image-call";
import { getOpenAiClient } from "@/lib/ai/openai-client";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// Fotos de catálogo por IA (Fase 6d). Permissão de verdade: reserve_ai_generation,
// as políticas do bucket `catalogo` e create_catalog_photo (quem edita produtos).

const NO_PERMISSION = "Só donos, admins, modelistas e estilistas geram fotos do produto.";

/** Por quanto tempo o endereço da foto devolvido vale, em s. */
const SIGNED_URL_SECONDS = 3600;

export type CatalogPhotoResult = { ok: true; photoId: string; url: string | null } | { ok: false; error: string };

/**
 * Gera uma foto de catálogo a partir de uma captura da Prova. Reserva a
 * geração (permissão e limite do mês), chama a OpenAI, guarda o JPEG no bucket
 * `catalogo` com a sessão da pessoa, registra a foto e encerra a geração.
 * Demora (até uns 2 min): a página que chama ajusta o maxDuration.
 */
export async function generateCatalogPhoto(
  orgId: string,
  productId: string,
  captureDataUrl: string,
  rawOptions: unknown,
): Promise<CatalogPhotoResult> {
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(productId)) return { ok: false, error: "Pedido inválido." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre de novo." };
  const options = readPhotoOptions(rawOptions);
  if (!options) return { ok: false, error: "Opções da foto inválidas." };
  const capture = readCaptureImage(captureDataUrl);
  if (!capture.ok) return capture;
  const ai = getOpenAiClient();
  if (!ai) return { ok: false, error: "As fotos por IA ainda não foram configuradas neste ambiente (OPENAI_API_KEY)." };

  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("name, fabrics(name)").eq("id", productId).eq("org_id", orgId).maybeSingle();
  if (!product) return { ok: false, error: "Produto não encontrado." };

  const { data: generationId, error: reserveError } = await supabase.rpc("reserve_ai_generation", {
    p_product_id: productId,
    p_kind: "foto_catalogo",
  });
  if (reserveError || !generationId) {
    return { ok: false, error: dbErrorMessage(reserveError, { noPermission: NO_PERMISSION, fallback: "Não foi possível pedir a foto agora." }) };
  }

  const result = await callCatalogPhoto(ai, {
    image: capture.bytes,
    mime: capture.mime,
    prompt: catalogPhotoPrompt(options, { name: product.name, fabric: product.fabrics?.name ?? null }),
    quality: options.quality,
    safetyId: await safetyIdentifier(user.id),
  });
  const finish = (ok: boolean) =>
    supabase.rpc("finish_ai_generation", {
      p_id: generationId,
      p_ok: ok,
      p_model: result.model,
      p_input_tokens: result.inputTokens,
      p_output_tokens: result.outputTokens,
    });
  if (!result.ok) {
    await finish(false);
    return { ok: false, error: result.error };
  }

  // Daqui em diante a OpenAI já cobrou: se guardar falhar, a geração conta no limite
  // do mês (encerrada como pronta, com os tokens), mesmo sem foto.
  const path = `${orgId}/${productId}/${generationId}.${result.ext}`;
  const bucket = supabase.storage.from("catalogo");
  const { error: uploadError } = await bucket.upload(path, result.bytes, { contentType: result.mime, upsert: false });
  if (uploadError) {
    await finish(true);
    return { ok: false, error: "A foto ficou pronta, mas não foi possível guardá-la. Tente de novo." };
  }
  const { error: createError } = await supabase.rpc("create_catalog_photo", {
    p_generation_id: generationId,
    p_ext: result.ext,
    p_settings: photoSettings(options) as unknown as Json,
    p_model: result.model,
  });
  await finish(true);
  if (createError) {
    await bucket.remove([path]);
    return { ok: false, error: dbErrorMessage(createError, { noPermission: NO_PERMISSION, fallback: "Não foi possível registrar a foto." }) };
  }

  revalidatePath(`/painel/${orgId}/produtos/${productId}`);
  const { data: signed } = await bucket.createSignedUrl(path, SIGNED_URL_SECONDS);
  return { ok: true, photoId: generationId, url: signed?.signedUrl ?? null };
}

/** Apaga a foto: o arquivo primeiro (a política confere pelo caminho), depois a linha. */
export async function deleteCatalogPhoto(formData: FormData) {
  const orgId = formData.get("orgId");
  const productId = formData.get("productId");
  const photoId = formData.get("photoId");
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(productId) || !isUuid(photoId)) return;
  if (!(await getCurrentUser())) return;
  const supabase = await createClient();
  const { data: photo } = await supabase.from("catalog_photos").select("path").eq("id", photoId).eq("org_id", orgId).maybeSingle();
  if (!photo) return;
  const { error } = await supabase.storage.from("catalogo").remove([photo.path]);
  if (error) return;
  await supabase.from("catalog_photos").delete().eq("id", photoId).eq("org_id", orgId);
  revalidatePath(`/painel/${orgId}/produtos/${productId}`);
}
