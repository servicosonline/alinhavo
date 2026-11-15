import type { ProductStatus } from "./supabase/database.types";

/** Regras da Coleção usadas nas telas. Puras, para testar sem banco. */

export const PRODUCT_STATUSES: readonly ProductStatus[] = ["ideia", "modelagem", "prova", "aprovado", "producao"];

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ideia: "Ideia",
  modelagem: "Modelagem",
  prova: "Prova",
  aprovado: "Aprovado",
  producao: "Produção",
};

export function isProductStatus(v: unknown): v is ProductStatus {
  return typeof v === "string" && (PRODUCT_STATUSES as readonly string[]).includes(v);
}

/** Quantos dias antes do prazo uma etapa aberta conta como "próxima". */
export const SOON_DAYS = 7;

export type MilestoneState = "concluida" | "atrasada" | "proxima" | "futura";

/** Dia AAAA-MM-DD → número de dias (UTC), para comparar só a data. */
function dayNumber(isoDate: string): number {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return Date.UTC(y!, m! - 1, d!) / 86_400_000;
}

/**
 * Situação de uma etapa do cronograma no dia `today` (AAAA-MM-DD, no fuso da
 * confecção). Atrasada: o prazo passou e não foi concluída. Próxima: vence
 * em até SOON_DAYS dias (o próprio dia do prazo ainda não é atraso).
 */
export function milestoneState(dueOn: string, doneAt: string | null, today: string): MilestoneState {
  if (doneAt) return "concluida";
  const left = dayNumber(dueOn) - dayNumber(today);
  if (left < 0) return "atrasada";
  if (left <= SOON_DAYS) return "proxima";
  return "futura";
}

/** Dias de atraso (0 se não está atrasada). */
export function daysLate(dueOn: string, doneAt: string | null, today: string): number {
  if (doneAt) return 0;
  return Math.max(0, dayNumber(today) - dayNumber(dueOn));
}

/** Hoje em AAAA-MM-DD no fuso de São Paulo (a confecção trabalha nele). */
export function todayInBrazil(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

/**
 * Sugerir "aprovado": o cliente aprovou o molde do produto, mas o produto
 * ainda está antes dessa etapa. A mudança é da equipe, nunca automática.
 */
export function suggestApproved(status: ProductStatus, latestApproval: "pendente" | "aprovado" | "ajustes" | null): boolean {
  return latestApproval === "aprovado" && PRODUCT_STATUSES.indexOf(status) < PRODUCT_STATUSES.indexOf("aprovado");
}

/** "2026-12-01" → "01/12/2026" (sem fuso: é só a data). */
export function formatDay(isoDate: string | null): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Lê uma data AAAA-MM-DD de formulário; vazio vira null; inválida, undefined. */
export function readDay(raw: unknown): string | null | undefined {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const t = Date.parse(`${v}T00:00:00Z`);
  return Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== v ? undefined : v;
}

/**
 * Prazo de entrega do produto (products.due_on). Entregue = já aprovado ou em produção: aí não há atraso.
 * Sem prazo: null. Usa as mesmas faixas das etapas (atrasada, vence em breve, no prazo, concluída).
 */
export function productDueState(dueOn: string | null, status: ProductStatus, today: string): MilestoneState | null {
  if (!dueOn) return null;
  const delivered = PRODUCT_STATUSES.indexOf(status) >= PRODUCT_STATUSES.indexOf("aprovado");
  return milestoneState(dueOn, delivered ? dueOn : null, today);
}
