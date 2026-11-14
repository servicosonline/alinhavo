import type { CommentRow } from "./supabase/database.types";

/** Regras dos comentários na tela. Puras, para testar sem banco nem Realtime. */

export const MAX_COMMENT = 4000;

export type CommentView = Pick<CommentRow, "id" | "author" | "body" | "created_at">;

/**
 * Junta um comentário que chegou (pelo envio ou pelo tempo real) à lista,
 * sem repetir (o mesmo comentário chega pelos dois caminhos) e em ordem de
 * criação.
 */
export function mergeComment(list: readonly CommentView[], incoming: CommentView): CommentView[] {
  if (list.some((c) => c.id === incoming.id)) return [...list];
  return [...list, incoming].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}

export function removeComment(list: readonly CommentView[], id: string): CommentView[] {
  return list.filter((c) => c.id !== id);
}

/** Texto do comentário vindo do formulário: sem espaços nas pontas, 1 a 4000 caracteres. */
export function readCommentBody(raw: unknown): string | null {
  const body = String(raw ?? "").trim();
  return body.length >= 1 && body.length <= MAX_COMMENT ? body : null;
}

/** "agora", "há 5 min", "há 2 h", senão a data e a hora. */
export function whenLabel(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const min = Math.floor((now - t) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  if (min < 24 * 60) return `há ${Math.floor(min / 60)} h`;
  return new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}
