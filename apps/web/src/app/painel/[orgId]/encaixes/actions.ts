"use server";

import { migratePattern, validatePattern, type PatternDocument } from "@alinhavo/geometry";
import { buildMarkerLayout, MarkerLayoutError, patternNestPieces, type SizeDemand } from "@alinhavo/nesting";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { checkMarkerInput, PIECES_MAX, garmentCount, type MarkerInput } from "@/lib/encaixe/marker";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// Permissão de verdade: RLS e as funções da fila (owner, admin, modelista e estilista).

const NO_PERMISSION = "Só donos, admins, modelistas e estilistas usam a fila de encaixes.";
const SESSION = "Sua sessão expirou ou o pedido é inválido.";

async function ctx(orgId: unknown) {
  if (!getSupabaseConfig() || !isUuid(orgId)) return null;
  if (!(await getCurrentUser())) return null;
  return { supabase: await createClient(), orgId };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function loadDoc(supabase: Supabase, patternId: string | null, version: number): Promise<PatternDocument | null> {
  if (!patternId) return null;
  const { data } = await supabase.from("pattern_versions").select("document").eq("pattern_id", patternId).eq("number", version).maybeSingle();
  const doc = migratePattern(data?.document);
  return doc && validatePattern(doc).length === 0 ? doc : null;
}

const message = (error: { code?: string; message?: string } | null, fallback: string) =>
  dbErrorMessage(error, { noPermission: NO_PERMISSION, fallback });

const revalidate = (orgId: string, productId?: string) => {
  revalidatePath(`/painel/${orgId}/encaixes`);
  if (productId) {
    revalidatePath(`/painel/${orgId}/produtos/${productId}`);
    revalidatePath(`/painel/${orgId}/produtos/${productId}/encaixe`);
  }
};

/** Põe um encaixe na fila (na versão atual do molde do produto). */
export async function enqueueNestJob(orgId: string, productId: string, input: unknown): Promise<{ error?: string; ok?: string }> {
  const c = await ctx(orgId);
  if (!c || !isUuid(productId)) return { error: SESSION };
  const { data: product } = await c.supabase.from("products").select("pattern_id").eq("id", productId).eq("org_id", orgId).maybeSingle();
  if (!product?.pattern_id) return { error: "Ligue um molde ao produto antes de encaixar." };
  const { data: pattern } = await c.supabase.from("patterns").select("current_version").eq("id", product.pattern_id).eq("org_id", orgId).maybeSingle();
  const doc = pattern ? await loadDoc(c.supabase, product.pattern_id, pattern.current_version) : null;
  if (!doc) return { error: "A versão atual do molde não pôde ser lida." };
  const settings = checkMarkerInput(doc.sizes, input);
  if (!settings) return { error: "Demanda ou medidas do tecido inválidas." };
  const perGarment = doc.pieces.reduce((s, p) => s + (p.cutPair ? 2 : 1), 0);
  if (garmentCount(settings.demand) * perGarment > PIECES_MAX) return { error: `Risco grande demais (até ${PIECES_MAX} peças cortadas).` };

  const { error } = await c.supabase.rpc("enqueue_nest_job", {
    p_product_id: productId,
    p_width_mm: settings.widthMm,
    p_demand: settings.demand as unknown as Json,
    p_gap_mm: settings.gapMm,
    p_one_way: settings.oneWay,
  });
  if (error) return { error: message(error, "Não foi possível pôr na fila.") };
  revalidate(orgId, productId);
  return { ok: "Encaixe posto na fila." };
}

export type ClaimedJob = {
  id: string;
  productId: string;
  productName: string;
  version: number;
  input: MarkerInput;
  doc: PatternDocument;
};

/**
 * Pega o próximo pedido da organização para processar neste navegador,
 * com o molde da versão do pedido. Pedido com molde ilegível vira erro e o
 * próximo é tentado.
 */
export async function claimNextNestJob(orgId: string): Promise<{ job: ClaimedJob | null } | { error: string }> {
  const c = await ctx(orgId);
  if (!c) return { error: SESSION };
  for (let tries = 0; tries < 5; tries++) {
    const { data: job, error } = await c.supabase.rpc("claim_nest_job", { p_org_id: orgId });
    if (error) return { error: message(error, "Não foi possível pegar o próximo pedido.") };
    if (!job?.id) return { job: null };
    const doc = await loadDoc(c.supabase, job.pattern_id, job.pattern_version);
    const { data: product } = await c.supabase.from("products").select("name").eq("id", job.product_id).eq("org_id", orgId).maybeSingle();
    const input: MarkerInput = {
      demand: job.demand as unknown as SizeDemand,
      widthMm: job.width_mm,
      gapMm: Number(job.gap_mm),
      oneWay: job.one_way,
    };
    if (!doc || !product || !checkMarkerInput(doc.sizes, input)) {
      await c.supabase.rpc("fail_nest_job", { p_job_id: job.id, p_error: "A versão do molde deste pedido não pôde ser lida ou não tem esses tamanhos." });
      continue;
    }
    revalidate(orgId);
    return { job: { id: job.id, productId: job.product_id, productName: product.name, version: job.pattern_version, input, doc } };
  }
  return { job: null };
}

/** Progresso de 0 a 1; false quando o pedido não está mais com você (pare). */
export async function reportNestProgress(orgId: string, jobId: string, progress: number): Promise<boolean> {
  const c = await ctx(orgId);
  if (!c || !isUuid(jobId) || !Number.isFinite(progress)) return false;
  const { data } = await c.supabase.rpc("nest_job_progress", { p_job_id: jobId, p_progress: progress });
  return data === true;
}

/**
 * Conclui o pedido com as posições calculadas no navegador: as peças são
 * remontadas da versão do molde do pedido e conferidas (`buildMarkerLayout`)
 * antes de gravar o risco. Risco que não confere vira erro no pedido.
 */
export async function finishNestJob(orgId: string, jobId: string, placements: unknown): Promise<{ error?: string; number?: number }> {
  const c = await ctx(orgId);
  if (!c || !isUuid(jobId)) return { error: SESSION };
  const { data: job } = await c.supabase
    .from("nest_jobs")
    .select("product_id, pattern_id, pattern_version, width_mm, gap_mm, one_way, demand")
    .eq("id", jobId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!job) return { error: "Pedido não encontrado." };
  const doc = await loadDoc(c.supabase, job.pattern_id, job.pattern_version);
  const settings = doc ? checkMarkerInput(doc.sizes, { demand: job.demand, widthMm: job.width_mm, gapMm: Number(job.gap_mm), oneWay: job.one_way }) : null;
  if (!doc || !settings) return failNestJob(orgId, jobId, "A versão do molde deste pedido não pôde ser lida.");

  let layout;
  try {
    layout = buildMarkerLayout(patternNestPieces(doc, settings.demand), placements, settings);
  } catch (err) {
    const why = err instanceof MarkerLayoutError ? err.message : "erro ao conferir";
    return failNestJob(orgId, jobId, `O risco não confere com o molde: ${why}`);
  }
  const { data: marker, error } = await c.supabase.rpc("finish_nest_job", {
    p_job_id: jobId,
    p_length_mm: layout.lengthMm,
    p_efficiency: layout.efficiency,
    p_layout: layout as unknown as Json,
  });
  if (error || !marker) return { error: message(error, "Não foi possível salvar o risco.") };
  revalidate(orgId, job.product_id);
  return { number: marker.number };
}

export async function failNestJob(orgId: string, jobId: string, reason: string): Promise<{ error: string }> {
  const c = await ctx(orgId);
  if (!c || !isUuid(jobId)) return { error: SESSION };
  const text = String(reason).slice(0, 500);
  await c.supabase.rpc("fail_nest_job", { p_job_id: jobId, p_error: text });
  revalidate(orgId);
  return { error: text };
}

/** Parou de processar: o pedido volta à fila sem gastar tentativa. */
export async function releaseNestJob(orgId: string, jobId: string): Promise<void> {
  const c = await ctx(orgId);
  if (!c || !isUuid(jobId)) return;
  await c.supabase.rpc("release_nest_job", { p_job_id: jobId });
  revalidate(orgId);
}

export async function retryNestJob(formData: FormData) {
  const c = await ctx(formData.get("orgId"));
  const jobId = formData.get("jobId");
  if (!c || !isUuid(jobId)) return;
  await c.supabase.rpc("retry_nest_job", { p_job_id: jobId });
  revalidate(c.orgId);
}

export async function deleteNestJob(formData: FormData) {
  const c = await ctx(formData.get("orgId"));
  const jobId = formData.get("jobId");
  if (!c || !isUuid(jobId)) return;
  await c.supabase.from("nest_jobs").delete().eq("id", jobId).eq("org_id", c.orgId);
  revalidate(c.orgId);
}
