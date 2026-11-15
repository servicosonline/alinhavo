"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getOrigin } from "@/lib/origin";
import { APPROVAL_DAYS, approvalErrorMessage, approvalLink, type ApprovalSettings } from "@/lib/prova/approval";
import { base64Bytes, dataUrlBase64, MAX_CAPTURE_BYTES, MAX_CAPTURES, type Capture } from "@/lib/prova/captures";
import { APPROVAL_VIDEO_BUCKET } from "@/lib/prova/approval-video";
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
