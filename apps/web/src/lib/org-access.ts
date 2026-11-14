import "server-only";
import type { createClient } from "./supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
export type OrgRole = "owner" | "admin" | "modelista" | "estilista" | "leitura";

/** Papel do usuário na organização (null se não for membro). Só para a interface: a RLS decide de verdade. */
export async function getMyRole(supabase: Client, orgId: string, userId: string): Promise<OrgRole | null> {
  const { data } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

export const canEditPatterns = (role: OrgRole | null) => role === "owner" || role === "admin" || role === "modelista";
