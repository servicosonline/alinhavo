"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { isProductStatus, readDay } from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Permissão de verdade: RLS (owner, admin, modelista e estilista editam). Aqui, validação e mensagens.

const NO_CONFIG = "O Supabase ainda não foi configurado neste ambiente.";
const NO_PERMISSION = "Só donos, admins, modelistas e estilistas editam coleções e produtos.";

async function ready(path: string) {
  if (!getSupabaseConfig()) return null;
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(path)}`);
  return createClient();
}

const text = (v: FormDataEntryValue | null, max: number) => {
  const s = String(v ?? "").trim();
  return s.length > max ? null : s;
};

export async function createCollection(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(orgId)) return { error: "Organização inválida." };
  const supabase = await ready(`/painel/${orgId}/colecoes`);
  if (!supabase) return { error: NO_CONFIG };

  const name = text(formData.get("name"), 120);
  const season = text(formData.get("season"), 60);
  const startsOn = readDay(formData.get("starts_on"));
  const launchOn = readDay(formData.get("launch_on"));
  if (!name) return { error: "Dê um nome à coleção (até 120 caracteres)." };
  if (season === null) return { error: "Temporada com até 60 caracteres." };
  if (startsOn === undefined || launchOn === undefined) return { error: "Data inválida." };
  if (startsOn && launchOn && launchOn < startsOn) return { error: "O lançamento não pode vir antes do início." };

  const { data, error } = await supabase
    .from("collections")
    .insert({ org_id: orgId, name, season: season || null, starts_on: startsOn, launch_on: launchOn })
    .select("id")
    .single();
  if (error || !data) return { error: error?.code === "42501" ? NO_PERMISSION : "Não foi possível criar a coleção." };
  redirect(`/painel/${orgId}/colecoes/${data.id}`);
}

export async function createProduct(orgId: string, collectionId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(orgId) || !isUuid(collectionId)) return { error: "Pedido inválido." };
  const path = `/painel/${orgId}/colecoes/${collectionId}`;
  const supabase = await ready(path);
  if (!supabase) return { error: NO_CONFIG };

  const name = text(formData.get("name"), 120);
  const reference = text(formData.get("reference"), 40);
  if (!name) return { error: "Dê um nome ao produto (até 120 caracteres)." };
  if (reference === null) return { error: "Referência com até 40 caracteres." };

  const { error } = await supabase
    .from("products")
    .insert({ org_id: orgId, collection_id: collectionId, name, reference: reference || null });
  if (error) {
    if (error.code === "23505") return { error: "Já existe um produto com essa referência." };
    return { error: error.code === "42501" ? NO_PERMISSION : "Não foi possível criar o produto." };
  }
  revalidatePath(path);
  return { ok: `Produto "${name}" criado.` };
}

export async function createMilestone(orgId: string, collectionId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(orgId) || !isUuid(collectionId)) return { error: "Pedido inválido." };
  const path = `/painel/${orgId}/colecoes/${collectionId}`;
  const supabase = await ready(path);
  if (!supabase) return { error: NO_CONFIG };

  const title = text(formData.get("title"), 120);
  const dueOn = readDay(formData.get("due_on"));
  const assigneeRaw = formData.get("assignee");
  const assignee = assigneeRaw === "" || assigneeRaw === null ? null : isUuid(assigneeRaw) ? assigneeRaw : undefined;
  if (!title) return { error: "Dê um nome à etapa (até 120 caracteres)." };
  if (!dueOn) return { error: "Escolha o prazo da etapa." };
  if (assignee === undefined) return { error: "Responsável inválido." };

  const { error } = await supabase.from("milestones").insert({ org_id: orgId, collection_id: collectionId, title, due_on: dueOn, assignee });
  if (error) return { error: error.code === "42501" ? NO_PERMISSION : "Não foi possível criar a etapa." };
  revalidatePath(path);
  return { ok: `Etapa "${title}" criada.` };
}

/** Formulários simples (sem estado): status, molde, concluir e apagar etapa. Erros caem na RLS e a tela recarrega. */
async function simple(formData: FormData) {
  const orgId = formData.get("orgId");
  const back = String(formData.get("back") ?? "");
  if (!getSupabaseConfig() || !isUuid(orgId) || !back.startsWith(`/painel/${orgId}/`)) return null;
  const supabase = await ready(back);
  return supabase ? { supabase, orgId, back } : null;
}

export async function setProductStatus(formData: FormData) {
  const ctx = await simple(formData);
  const productId = formData.get("productId");
  const status = formData.get("status");
  if (!ctx || !isUuid(productId) || !isProductStatus(status)) return;
  await ctx.supabase.from("products").update({ status }).eq("id", productId).eq("org_id", ctx.orgId);
  revalidatePath(ctx.back);
}

export async function linkProductPattern(formData: FormData) {
  const ctx = await simple(formData);
  const productId = formData.get("productId");
  const raw = formData.get("patternId");
  const patternId = raw === "" || raw === null ? null : isUuid(raw) ? raw : undefined;
  if (!ctx || !isUuid(productId) || patternId === undefined) return;
  // FK composta impede molde de outra organização; índice único, molde em dois produtos.
  await ctx.supabase.from("products").update({ pattern_id: patternId }).eq("id", productId).eq("org_id", ctx.orgId);
  revalidatePath(ctx.back);
}

export async function toggleMilestone(formData: FormData) {
  const ctx = await simple(formData);
  const id = formData.get("milestoneId");
  const done = formData.get("done") === "1";
  if (!ctx || !isUuid(id)) return;
  await ctx.supabase
    .from("milestones")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("org_id", ctx.orgId);
  revalidatePath(ctx.back);
}

export async function deleteMilestone(formData: FormData) {
  const ctx = await simple(formData);
  const id = formData.get("milestoneId");
  if (!ctx || !isUuid(id)) return;
  await ctx.supabase.from("milestones").delete().eq("id", id).eq("org_id", ctx.orgId);
  revalidatePath(ctx.back);
}
