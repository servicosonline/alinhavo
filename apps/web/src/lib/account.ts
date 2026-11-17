/**
 * Regras da conta: nome do perfil, aviso do teste grátis e os primeiros passos (onboarding).
 * Puras: a tela e as ações usam; o banco confere de novo o que é dele.
 */
import { planById, type PlanId } from "./plans";

export type SubscriptionStatus = "trial" | "ativa" | "vencida" | "cancelada" | "cortesia";

/** Nome ou sobrenome: espaços aparados, 1 a `max` letras; vazio vira null. */
export function cleanName(text: unknown, max: number): { ok: true; value: string | null } | { ok: false } {
  const s = String(text ?? "").trim().replace(/\s+/g, " ");
  if (!s) return { ok: true, value: null };
  return s.length <= max ? { ok: true, value: s } : { ok: false };
}

/** Como chamar a pessoa: nome e sobrenome, só o nome, ou o começo do e-mail. */
export function displayName(profile: { first_name: string | null; last_name: string | null } | null, email: string | null | undefined): string {
  const nome = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return nome || (email ? email.split("@")[0]! : "Você");
}

/** Iniciais para o avatar sem foto ("Ana Lima" → "AL"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1]![0] : "")).toUpperCase();
}

export interface PlanStatus {
  plan_id: string;
  status: SubscriptionStatus;
  days_left: number | null;
  /** Fim do teste; `null` = a organização nasceu sem teste (a pessoa já tinha usado o dela). */
  trial_ends_at?: string | null;
}

/**
 * O aviso do plano na barra da organização. `null` = nada a avisar (plano pago em dia ou cortesia).
 * Nada é bloqueado ainda: sem pagamento, o teste vencido só muda o aviso.
 */
export function trialNotice(s: PlanStatus | null): { tone: "info" | "alerta"; text: string } | null {
  if (!s) return null;
  if (s.status === "trial") {
    const d = s.days_left ?? 0;
    if (d <= 0) return { tone: "alerta", text: "O teste grátis termina hoje." };
    return { tone: d <= 3 ? "alerta" : "info", text: d === 1 ? "Teste grátis: falta 1 dia." : `Teste grátis: faltam ${d} dias.` };
  }
  if (s.status === "vencida") {
    // Sem prazo: a organização nasceu sem teste, porque a pessoa já usou o dela (um teste por pessoa).
    if (s.trial_ends_at === null) return { tone: "alerta", text: "O teste grátis já foi usado em outra organização sua. A escolha do plano chega em breve." };
    return { tone: "alerta", text: "O teste grátis terminou. A escolha do plano chega em breve." };
  }
  if (s.status === "cancelada") return { tone: "alerta", text: "O plano foi cancelado." };
  return null;
}

/** Nome do plano para a tela (o id vem do banco; desconhecido aparece como veio). */
export function planName(id: string): string {
  try {
    return planById(id as PlanId).nome;
  } catch {
    return id;
  }
}

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "Teste grátis",
  ativa: "Ativo",
  vencida: "Teste encerrado",
  cancelada: "Cancelado",
  cortesia: "Cortesia",
};

export interface OnboardingProgress {
  has_profile: boolean;
  has_org: boolean;
  has_pattern: boolean;
  has_prova: boolean;
  has_approval: boolean;
  has_invite: boolean;
}

export interface OnboardingStep {
  id: keyof OnboardingProgress;
  title: string;
  hint: string;
  done: boolean;
  /** Para onde o passo leva; `{org}` = a primeira organização. */
  href: string;
}

const STEPS: Omit<OnboardingStep, "done">[] = [
  { id: "has_profile", title: "Complete o seu perfil", hint: "Nome e foto, para a equipe saber quem é quem.", href: "/painel/conta" },
  { id: "has_org", title: "Crie a sua confecção ou ateliê", hint: "É onde ficam moldes, coleções e a equipe.", href: "/painel" },
  { id: "has_pattern", title: "Abra um molde", hint: "Comece de um exemplo (saia, calça ou conjunto) ou do zero.", href: "/painel/{org}/moldes" },
  { id: "has_prova", title: "Prove em 3D", hint: "Veja a peça vestida no corpo da sua tabela.", href: "/painel/{org}/moldes" },
  { id: "has_approval", title: "Peça uma aprovação", hint: "Mande o link para a cliente aprovar sem criar conta.", href: "/painel/{org}/moldes" },
  { id: "has_invite", title: "Convide alguém da equipe", hint: "Modelista, estilista ou só leitura.", href: "/painel/{org}" },
];

/** Os passos na ordem, marcados pelo que a pessoa já fez. Sem organização, os que dependem dela levam ao painel. */
export function onboardingSteps(progress: OnboardingProgress, firstOrgId: string | null): OnboardingStep[] {
  return STEPS.map((s) => ({
    ...s,
    done: progress[s.id],
    href: s.href.includes("{org}") ? (firstOrgId ? s.href.replace("{org}", firstOrgId) : "/painel") : s.href,
  }));
}
