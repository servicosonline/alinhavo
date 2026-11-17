/**
 * Quanto custa cada pessoa da equipe e o que um convite muda na mensalidade, pelos preços de `lib/plans.ts`
 * (a fonte única). Assento cheio: dono, admin e modelista (editam molde). Estilista: o assento dela, onde o
 * plano tem esse preço (no plano sem ele, conta como cheio). Leitura: grátis. Puro.
 *
 * Ainda não há cobrança (sem meio de pagamento): a conta só aparece na tela, para o dono saber antes de
 * convidar. No teste grátis e na cortesia nada é cobrado, mas o valor de quando assinar aparece igual.
 */
import type { SubscriptionStatus } from "./account";
import { clampSeats, hasPrice, planById, type Plan, type PlanId } from "./plans";

export type TeamRole = "owner" | "admin" | "modelista" | "estilista" | "leitura";
export type SeatKind = "cheio" | "estilista" | "leitura";

export function seatKind(role: TeamRole): SeatKind {
  if (role === "leitura") return "leitura";
  if (role === "estilista") return "estilista";
  return "cheio";
}

function planOrNull(planId: string | null | undefined): Plan | null {
  if (!planId) return null;
  try {
    return planById(planId as PlanId);
  } catch {
    return null;
  }
}

/** Preço por mês de uma pessoa com este papel; null se o plano não tem preço decidido. */
export function rolePriceCents(planId: string | null | undefined, role: TeamRole): number | null {
  const plan = planOrNull(planId);
  if (!plan || !hasPrice(plan)) return null;
  const kind = seatKind(role);
  if (kind === "leitura") return 0;
  if (kind === "estilista") return plan.precoEstilistaCents ?? plan.precoPorUsuarioCents;
  return plan.precoPorUsuarioCents;
}

/** Mensalidade da equipe (o mínimo de assentos cheios do plano vale); null sem preço. */
export function teamMonthlyCents(planId: string | null | undefined, roles: readonly TeamRole[]): number | null {
  const plan = planOrNull(planId);
  if (!plan || !hasPrice(plan)) return null;
  const hasStylistSeat = plan.precoEstilistaCents !== undefined;
  let full = 0;
  let stylists = 0;
  for (const r of roles) {
    const k = seatKind(r);
    if (k === "cheio" || (k === "estilista" && !hasStylistSeat)) full++;
    else if (k === "estilista") stylists++;
  }
  return plan.precoPorUsuarioCents * clampSeats(plan, full) + (plan.precoEstilistaCents ?? 0) * stylists;
}

export type InviteQuote = {
  /** Preço do papel convidado, por mês. */
  roleCents: number;
  /** Mensalidade com quem já está na equipe e os convites ainda não aceitos. */
  beforeCents: number;
  /** Com este convite também. */
  afterCents: number;
  /** Quanto este convite soma (pode ser 0: leitura, ou abaixo do mínimo do plano). */
  deltaCents: number;
  /** Cobrado agora (plano ativo) ou só quando assinar (teste, cortesia, vencida). */
  charging: boolean;
};

/** A conta do convite; null se o plano não tem preço decidido (a tela não mostra valor). */
export function inviteQuote(input: {
  planId: string | null | undefined;
  status: SubscriptionStatus | null | undefined;
  members: readonly TeamRole[];
  pending: readonly TeamRole[];
  role: TeamRole;
}): InviteQuote | null {
  const roleCents = rolePriceCents(input.planId, input.role);
  const team = [...input.members, ...input.pending];
  const beforeCents = teamMonthlyCents(input.planId, team);
  const afterCents = teamMonthlyCents(input.planId, [...team, input.role]);
  if (roleCents === null || beforeCents === null || afterCents === null) return null;
  return { roleCents, beforeCents, afterCents, deltaCents: afterCents - beforeCents, charging: input.status === "ativa" };
}
