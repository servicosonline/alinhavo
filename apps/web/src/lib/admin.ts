/**
 * Regras do painel do superadmin: valor do pacote de cada cliente (pelos assentos e lib/plans.ts), leitura
 * da ficha do cliente (platform_client) e filtros. Puro.
 */
import type { SubscriptionStatus } from "./account";
import { planById, planMonthlyCents, type PlanId } from "./plans";

export type PlatformRole = "dono" | "suporte";

/**
 * Valor por mês do pacote, pelos assentos de hoje: cheios (dono, admin, modelista) e estilistas; leitura não
 * paga. Teste, cortesia e cancelada não pagam (0). Plano desconhecido ou sem preço: null.
 */
export function packageMonthlyCents(planId: string | null, status: SubscriptionStatus | null, full: number, stylists: number): number | null {
  if (!planId) return null;
  if (status === "trial" || status === "cortesia" || status === "cancelada" || status === "vencida") return 0;
  let plan;
  try {
    plan = planById(planId as PlanId);
  } catch {
    return null;
  }
  return planMonthlyCents(plan, { full: Math.max(full, plan.minUsuarios), stylists });
}

/** O valor que o cliente pagaria no plano dele, se estivesse ativo (para o teste: quanto vale converter). */
export function potentialMonthlyCents(planId: string | null, full: number, stylists: number): number | null {
  return packageMonthlyCents(planId, "ativa", full, stylists);
}

export type ClientFilter = "todos" | "trial" | "vencida" | "ativa" | "cortesia" | "parados";

export const CLIENT_FILTERS: { id: ClientFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "trial", label: "Em teste" },
  { id: "vencida", label: "Teste encerrado" },
  { id: "ativa", label: "Pagantes" },
  { id: "cortesia", label: "Cortesia" },
  { id: "parados", label: "Sem uso há 14 dias" },
];

const DAY = 86_400_000;

/** O cliente entra no filtro? "parados" = sem nenhuma ação há 14 dias ou mais. */
export function matchesFilter(c: { status: SubscriptionStatus | null; last_activity: string | null }, f: ClientFilter, now: number = Date.now()): boolean {
  if (f === "todos") return true;
  if (f === "parados") return !c.last_activity || now - new Date(c.last_activity).getTime() >= 14 * DAY;
  return c.status === f;
}

export interface ClientMember {
  userId: string;
  email: string;
  role: string;
  joinedAt: string;
  lastActivity: string | null;
}

export interface ClientDetail {
  id: string;
  name: string;
  createdAt: string;
  thumbnailPath: string | null;
  plan: { planId: string; status: SubscriptionStatus; trialEndsAt: string | null } | null;
  members: ClientMember[];
  usage: Record<string, number>;
  ai: Record<string, { n: number; inputTokens: number; outputTokens: number }>;
  activity: { action: string; meta: Record<string, unknown>; email: string | null; createdAt: string }[];
  invites: { id: string; email: string; role: string; token: string; expiresAt: string }[];
}

const s = (v: unknown) => (typeof v === "string" ? v : "");
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const arr = (v: unknown) => (Array.isArray(v) ? v.map(obj) : []);

/** Lê o JSON de platform_client sem confiar no formato. */
export function readClientDetail(raw: unknown): ClientDetail | null {
  const r = obj(raw);
  if (!s(r.id)) return null;
  const plan = obj(r.plan);
  return {
    id: s(r.id),
    name: s(r.name),
    createdAt: s(r.created_at),
    thumbnailPath: s(r.thumbnail_path) || null,
    plan: s(plan.plan_id) ? { planId: s(plan.plan_id), status: s(plan.status) as SubscriptionStatus, trialEndsAt: s(plan.trial_ends_at) || null } : null,
    members: arr(r.members).map((m) => ({
      userId: s(m.user_id),
      email: s(m.email),
      role: s(m.role),
      joinedAt: s(m.joined_at),
      lastActivity: s(m.last_activity) || null,
    })),
    usage: Object.fromEntries(Object.entries(obj(r.usage)).map(([k, v]) => [k, Number(v) || 0])),
    ai: Object.fromEntries(
      Object.entries(obj(r.ai)).map(([k, v]) => {
        const o = obj(v);
        return [k, { n: Number(o.n) || 0, inputTokens: Number(o.input_tokens) || 0, outputTokens: Number(o.output_tokens) || 0 }];
      }),
    ),
    activity: arr(r.activity).map((a) => ({ action: s(a.action), meta: obj(a.meta), email: s(a.email) || null, createdAt: s(a.created_at) })),
    invites: arr(r.invites).map((i) => ({ id: s(i.id), email: s(i.email), role: s(i.role), token: s(i.token), expiresAt: s(i.expires_at) })),
  };
}

/** Rótulos curtos do uso (as ações do registro de atividade), na ordem do trabalho. */
export const USAGE_LABELS: [string, string][] = [
  ["molde_criado", "Moldes criados"],
  ["versao_salva", "Versões salvas"],
  ["prova_aberta", "Provas abertas"],
  ["aprovacao_pedida", "Aprovações pedidas"],
  ["aprovacao_decidida", "Aprovações respondidas"],
  ["produto_criado", "Produtos criados"],
  ["produto_status", "Mudanças de status"],
  ["ficha_gerada", "Fichas geradas"],
  ["risco_salvo", "Riscos salvos"],
  ["acompanhamento_criado", "Links para a cliente"],
];

/** Texto do registro de auditoria. */
export function auditText(action: string, meta: Record<string, unknown>): string {
  switch (action) {
    case "convite_criado":
      return `criou um convite (${String(meta.papel ?? "")})`;
    case "papel_mudou":
      return `mudou o papel para ${String(meta.para ?? "")}`;
    case "membro_removido":
      return "tirou uma pessoa da organização";
    case "plano_mudou":
      return `mudou o plano para ${String(meta.status ?? "")}${meta.dias ? ` (${String(meta.dias)} dias)` : ""}`;
    case "admin_adicionado":
      return `adicionou um ajudante (${String(meta.papel ?? "")})`;
    case "admin_removido":
      return "tirou um ajudante";
    default:
      return action.replace(/_/g, " ");
  }
}

/** Tipos de geração por IA, como a tela do superadmin chama. */
export const AI_KIND_LABEL: Record<string, string> = { textos_produto: "Textos", foto_catalogo: "Fotos" };

/** Quanto do limite do mês já foi (0 a 1+), para destacar quem está perto do teto. */
export function aiUsageShare(used: number, limit: number): number {
  return limit > 0 ? used / limit : used > 0 ? Infinity : 0;
}
