import "server-only";
import { effectivePlan, planAllows, type PlanId } from "./plans";
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

/** O plano que vale agora (teste vencido ou cancelado = Grátis). Só para a interface: o banco bloqueia de verdade. */
export async function getOrgPlan(supabase: Client, orgId: string): Promise<PlanId> {
  const { data } = await supabase.rpc("org_plan_status", { p_org_id: orgId });
  return effectivePlan(data?.[0] ?? null);
}

/**
 * No Grátis, só o primeiro molde da organização ganha versão nova (os outros ficam para ler), igual a
 * `private.plan_check_pattern_version`. Nos planos com "moldes", nunca trava.
 */
export async function patternLockedByPlan(supabase: Client, orgId: string, patternId: string, plan: PlanId): Promise<boolean> {
  if (planAllows(plan, "moldes")) return false;
  const { data } = await supabase
    .from("patterns")
    .select("id")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id !== patternId;
}

/** Moldes e tabelas de medidas (o limite de 1 molde do Grátis é à parte: `planAllows(plan, "moldes")`). */
export const canEditPatterns = (role: OrgRole | null) => role === "owner" || role === "admin" || role === "modelista";
/** Coleções, produtos, ficha, tecidos e cronograma: quem edita moldes e também a estilista, no plano com coleção. */
export const canEditProducts = (role: OrgRole | null, plan: PlanId) =>
  (canEditPatterns(role) || role === "estilista") && planAllows(plan, "colecao");
/** Encaixe e fila de riscos: só quem edita moldes (não a estilista), no plano com encaixe. */
export const canNest = (role: OrgRole | null, plan: PlanId) => canEditPatterns(role) && planAllows(plan, "encaixe");
