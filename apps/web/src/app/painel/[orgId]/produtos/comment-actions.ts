"use server";

import { getCurrentUser } from "@/lib/auth";
import { readCommentBody } from "@/lib/comments";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CommentResult =
  | { error?: string; ok?: string; comment?: { id: string; author: string | null; body: string; created_at: string } }
  | undefined;

/** Novo comentário (o autor é quem está logado: o banco preenche e a RLS confere). */
export async function addComment(orgId: string, productId: string, _prev: CommentResult, formData: FormData): Promise<CommentResult> {
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(productId)) return { error: "Pedido inválido." };
  if (!(await getCurrentUser())) return { error: "Sua sessão expirou. Entre de novo." };
  const body = readCommentBody(formData.get("body"));
  if (!body) return { error: "Escreva o comentário (até 4000 caracteres)." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({ org_id: orgId, product_id: productId, body })
    .select("id, author, body, created_at")
    .single();
  if (error || !data) return { error: error?.code === "42501" ? "Só membros da organização comentam." : "Não foi possível enviar o comentário." };
  // Sem revalidar a página: a lista se atualiza pelo tempo real (e pelo retorno, para quem enviou).
  return { ok: "Enviado.", comment: data };
}

export async function deleteComment(orgId: string, commentId: string): Promise<{ ok: boolean }> {
  if (!getSupabaseConfig() || !isUuid(orgId) || !isUuid(commentId)) return { ok: false };
  if (!(await getCurrentUser())) return { ok: false };
  const supabase = await createClient();
  const { error, count } = await supabase.from("comments").delete({ count: "exact" }).eq("id", commentId).eq("org_id", orgId);
  return { ok: !error && (count ?? 0) > 0 };
}
