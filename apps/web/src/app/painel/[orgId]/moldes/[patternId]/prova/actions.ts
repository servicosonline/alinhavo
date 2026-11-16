"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { isUuid } from "@/lib/ids";
import { getOrigin } from "@/lib/origin";
import { APPROVAL_DAYS, approvalErrorMessage, approvalLink, type ApprovalSettings } from "@/lib/prova/approval";
import { base64Bytes, dataUrlBase64, MAX_CAPTURE_BYTES, MAX_CAPTURES, type Capture } from "@/lib/prova/captures";
import { APPROVAL_VIDEO_BUCKET } from "@/lib/prova/approval-video";
import { isFabricPhoto, photoCm, type FabricPhoto } from "@/lib/prova/fabric-options";
import {
  cleanSavedBodyName,
  readSavedBodies,
  readSavedConditions,
  readSavedMeasurements,
  type SavedBodiesResult,
  type SavedBody,
  type SavedBodyPayload,
} from "@/lib/prova/saved-bodies";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ApprovalResult = { ok: true; approvalId: string; link: string; expiresAt: string } | { ok: false; error: string };

const ANGLES = new Set(["atual", "frente", "costas", "lado"]);
const SHORT = (v: unknown) => typeof v === "string" && v.length > 0 && v.length <= 40;

/**
 * Cria a aprovação com as capturas da Prova e devolve o link público. Confere
 * o login de novo; a permissão (quem edita moldes) e a versão ficam no banco.
 */
export async function requestApproval(
  orgId: string,
  patternId: string,
  version: number,
  settings: ApprovalSettings,
  captures: Capture[],
  days: number,
): Promise<ApprovalResult> {
  if (!getSupabaseConfig()) return { ok: false, error: "O Supabase ainda não foi configurado neste ambiente." };
  if (
    !isUuid(orgId) ||
    !isUuid(patternId) ||
    !Number.isInteger(version) ||
    version < 1 ||
    !(APPROVAL_DAYS as readonly number[]).includes(days) ||
    !settings ||
    typeof settings !== "object" ||
    ![settings.size, settings.fabric, settings.pose].every(SHORT) ||
    !Array.isArray(captures) ||
    captures.length < 1 ||
    captures.length > MAX_CAPTURES
  ) {
    return { ok: false, error: "Pedido inválido." };
  }
  const images: { angle: string; data: string }[] = [];
  for (const c of captures) {
    const b64 = c && typeof c.dataUrl === "string" ? dataUrlBase64(c.dataUrl) : null;
    if (!b64 || !ANGLES.has(c.angle) || base64Bytes(b64) > MAX_CAPTURE_BYTES) {
      return { ok: false, error: "Uma das imagens não pôde ser enviada. Capture de novo." };
    }
    images.push({ angle: c.angle, data: b64 });
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre de novo." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_approval", {
    p_pattern_id: patternId,
    p_version: version,
    p_settings: { size: settings.size, fabric: settings.fabric, pose: settings.pose },
    p_images: images,
    p_days: days,
  });
  const row = data?.[0];
  if (error || !row) return { ok: false, error: approvalErrorMessage(error ?? {}) };

  revalidatePath(`/painel/${orgId}/moldes/${patternId}`);
  return { ok: true, approvalId: row.id, link: approvalLink(await getOrigin(), row.token), expiresAt: row.expires_at };
}

/** Revoga um link (apaga a aprovação). A RLS só deixa quem edita moldes. */
export async function revokeApproval(formData: FormData) {
  const orgId = formData.get("orgId");
  const patternId = formData.get("patternId");
  const approvalId = formData.get("approvalId");
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(patternId) || !isUuid(approvalId)) return;
  if (!(await getCurrentUser())) return;
  const supabase = await createClient();
  // O vídeo sai antes: a política do Storage confere a aprovação dona do arquivo.
  const { data: approval } = await supabase.from("approvals").select("video_path").eq("id", approvalId).eq("org_id", orgId).maybeSingle();
  if (approval?.video_path) await supabase.storage.from(APPROVAL_VIDEO_BUCKET).remove([approval.video_path]);
  await supabase.from("approvals").delete().eq("id", approvalId).eq("org_id", orgId);
  revalidatePath(`/painel/${orgId}/moldes/${patternId}`);
}

/**
 * Foto de um tecido cadastrado, para a Prova (a lista da página vem sem as
 * fotos, que são pesadas). Pela RLS: só membros da organização leem.
 */
export async function fabricPhoto(orgId: string, fabricId: string): Promise<FabricPhoto | null> {
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(fabricId)) return null;
  if (!(await getCurrentUser())) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("fabrics").select("texture, texture_cm").eq("id", fabricId).eq("org_id", orgId).maybeSingle();
  if (!data || !isFabricPhoto(data.texture)) return null;
  return { dataUrl: data.texture, cm: photoCm(data.texture_cm === null ? undefined : Number(data.texture_cm)) };
}

const BODY_TEXTS = { noPermission: "Só donos, admins e modelistas salvam e apagam manequins.", fallback: "Não conseguimos salvar o manequim agora. Tente de novo." };

async function savedBodiesOf(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string): Promise<SavedBody[]> {
  const { data } = await supabase.from("body_presets").select("id, name, measurements, conditions, updated_at").eq("org_id", orgId);
  return readSavedBodies(data ?? []);
}

/**
 * Salva o corpo da Prova com um nome. Com um nome que já existe, atualiza esse
 * manequim. O servidor relê medidas e condições pelos limites do corpo; a
 * permissão (quem edita moldes) e o limite por organização ficam no banco.
 */
export async function saveBodyPreset(orgId: string, rawName: string, payload: SavedBodyPayload): Promise<SavedBodiesResult> {
  if (!getSupabaseConfig()) return { ok: false, error: "O Supabase ainda não foi configurado neste ambiente." };
  const name = cleanSavedBodyName(rawName);
  if (!name.ok) return { ok: false, error: name.error };
  const measurements = readSavedMeasurements(payload?.measurements);
  if (!isUuid(orgId) || Object.keys(measurements).length === 0) return { ok: false, error: "Pedido inválido." };
  const conditions = readSavedConditions(payload?.conditions);
  if (!(await getCurrentUser())) return { ok: false, error: "Sua sessão expirou. Entre de novo." };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("body_presets").select("id").eq("org_id", orgId).eq("name", name.value).maybeSingle();
  const res = existing
    ? await supabase.from("body_presets").update({ measurements, conditions }).eq("id", existing.id).eq("org_id", orgId).select("id")
    : await supabase.from("body_presets").insert({ org_id: orgId, name: name.value, measurements, conditions }).select("id");
  const id = res.data?.[0]?.id;
  if (res.error || !id) {
    if (res.error) console.error("[prova] manequim não salvo:", res.error.code);
    // Atualização barrada pela RLS não dá erro: volta sem linha.
    return { ok: false, error: res.error ? (res.error.code === "23505" ? "Já existe um manequim com esse nome." : dbErrorMessage(res.error, BODY_TEXTS)) : BODY_TEXTS.noPermission };
  }
  return { ok: true, list: await savedBodiesOf(supabase, orgId), savedId: id };
}

/** Apaga um manequim salvo (pela RLS: só quem edita moldes). */
export async function deleteBodyPreset(orgId: string, id: string): Promise<SavedBodiesResult> {
  if (!getSupabaseConfig()) return { ok: false, error: "O Supabase ainda não foi configurado neste ambiente." };
  if (!isUuid(orgId) || !isUuid(id)) return { ok: false, error: "Pedido inválido." };
  if (!(await getCurrentUser())) return { ok: false, error: "Sua sessão expirou. Entre de novo." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("body_presets").delete().eq("id", id).eq("org_id", orgId).select("id");
  if (error || !data?.length) {
    if (error) console.error("[prova] manequim não apagado:", error.code);
    return { ok: false, error: error ? dbErrorMessage(error, BODY_TEXTS) : BODY_TEXTS.noPermission };
  }
  return { ok: true, list: await savedBodiesOf(supabase, orgId) };
}
