import "server-only";
import type { SupportMessageView } from "@/components/support/conversation";
import type { createClient } from "./supabase/server";

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** A conversa e as mensagens (a RLS decide se a pessoa pode ler: sem permissão, volta null). */
export async function loadSupportThread(supabase: Awaited<ReturnType<typeof createClient>>, threadId: string) {
  const [{ data: thread }, { data: messages }] = await Promise.all([
    supabase.from("support_threads").select("id, subject, status, org_id, user_id, created_at").eq("id", threadId).maybeSingle(),
    supabase.from("support_messages").select("id, body, from_admin, created_at").eq("thread_id", threadId).order("created_at"),
  ]);
  if (!thread) return null;
  const views: SupportMessageView[] = (messages ?? []).map((m) => ({
    id: m.id,
    body: m.body,
    fromAdmin: m.from_admin,
    when: quando.format(new Date(m.created_at)),
  }));
  return { thread, messages: views };
}
