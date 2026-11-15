/**
 * Os planos do Alinhavo: a fonte única da página de preço, do simulador e do trial.
 *
 * PREÇO DE LANÇAMENTO decidido pelo Paulo em 15/11/2026 (reunião de diretoria; registro em
 * dados/dados.js → comercial.produtos[0].precoLancamento, pendência `alinhavo-validar-preco-lancamento`):
 *   - Modelista: R$ 69 por usuário/mês.
 *   - Confecção: assento cheio (owner, admin, modelista) R$ 119; assento Estilista R$ 59, só com pelo
 *     menos 1 cheio; Leitura grátis e ilimitado.
 *   - Anual = 10× o mensal (2 meses grátis). Os 10 primeiros clientes mantêm o preço por 12 meses.
 *   - Estilista avulso: não lançar por enquanto (fica `publicado: false`).
 * Ainda é hipótese a validar com os primeiros compradores. Mudou o preço? Mude só aqui.
 * `precoPorUsuarioCents: null` volta o cartão para "Em breve" (sem seletor nem totais).
 */

export type PlanId = "gratis" | "modelista" | "estilista" | "confeccao";
export type Billing = "mensal" | "anual";

export interface Plan {
  id: PlanId;
  nome: string;
  /** Para quem é, em uma frase. */
  publico: string;
  recursos: string[];
  /** Preço por usuário (assento cheio) por mês, em centavos. `null` = ainda não decidido ("Em breve"). */
  precoPorUsuarioCents: number | null;
  /** Assento Estilista (não edita molde), por mês, em centavos; exige pelo menos 1 assento cheio. */
  precoEstilistaCents?: number;
  /** Papel Leitura (só vê e comenta) não paga. */
  leituraGratis?: boolean;
  minUsuarios: number;
  /** `null` = sem limite (o seletor para em `SEAT_LIMIT`). */
  maxUsuarios: number | null;
  /** Dias de teste com tudo liberado (0 = sem teste). */
  trialDias: number;
  /** Fora da página até o Paulo decidir (ex.: Estilista avulso). */
  publicado: boolean;
  /** O cartão em destaque na página. */
  destaque?: boolean;
}

export const TRIAL_DAYS = 15;

/** Anual = 10 mensalidades (2 meses grátis). */
export const ANNUAL_MONTHS = 10;

/** Preço fundador: os primeiros clientes mantêm o preço de lançamento por um ano. */
export const FOUNDER = { clientes: 10, meses: 12 } as const;

/** Até onde o seletor de usuários vai na página; acima disso, conversa direta. */
export const SEAT_LIMIT = 50;

export const PLANS: readonly Plan[] = [
  {
    id: "gratis",
    nome: "Grátis",
    publico: "Para conhecer com um molde de verdade.",
    recursos: ["1 molde salvo, para sempre", "Molde e Prova 3D"],
    precoPorUsuarioCents: 0,
    minUsuarios: 1,
    maxUsuarios: 1,
    trialDias: 0,
    publicado: true,
  },
  {
    id: "modelista",
    nome: "Modelista",
    publico: "Para quem presta modelagem.",
    recursos: ["Molde e Prova 3D", "Aprovação por link", "Scan de molde de papel", "Exporta DXF-AAMA e PDF 1:1"],
    precoPorUsuarioCents: 6900,
    minUsuarios: 1,
    maxUsuarios: null,
    trialDias: TRIAL_DAYS,
    publicado: true,
    destaque: true,
  },
  {
    // Decidido em 15/11/2026: sem plano Estilista avulso por enquanto (sem molde, a estilista sozinha só
    // teria Coleção, Comentários e textos por IA). Reavaliar quando houver molde compartilhado entre
    // organizações. A estilista entra como assento de R$ 59 dentro do Confecção.
    id: "estilista",
    nome: "Estilista",
    publico: "Para quem desenvolve a coleção e acompanha a modelagem.",
    recursos: ["Coleção, produtos e prazos", "Ficha técnica e comentários", "Ver a Prova 3D e pedir aprovação"],
    precoPorUsuarioCents: null,
    minUsuarios: 1,
    maxUsuarios: null,
    trialDias: TRIAL_DAYS,
    publicado: false,
  },
  {
    id: "confeccao",
    nome: "Confecção",
    publico: "Para a equipe, do desenvolvimento ao corte.",
    recursos: ["Tudo do Modelista", "Coleção, ficha técnica e comentários", "Encaixe e fila de riscos", "Textos e fotos de catálogo por IA"],
    precoPorUsuarioCents: 11900,
    precoEstilistaCents: 5900,
    leituraGratis: true,
    minUsuarios: 1,
    maxUsuarios: null,
    trialDias: TRIAL_DAYS,
    publicado: true,
  },
];

export function planById(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Plano desconhecido: ${id}`);
  return plan;
}

/** Os planos que aparecem na página, na ordem. */
export function publishedPlans(plans: readonly Plan[] = PLANS): Plan[] {
  return plans.filter((p) => p.publicado);
}

/** O preço já foi decidido? */
export function hasPrice(plan: Plan): plan is Plan & { precoPorUsuarioCents: number } {
  return plan.precoPorUsuarioCents !== null;
}

/** Assentos cheios dentro dos limites do plano (inteiro). */
export function clampSeats(plan: Plan, seats: number): number {
  const max = Math.min(plan.maxUsuarios ?? SEAT_LIMIT, SEAT_LIMIT);
  const n = Number.isFinite(seats) ? Math.floor(seats) : plan.minUsuarios;
  return Math.max(plan.minUsuarios, Math.min(max, n));
}

/** Assentos Estilista (0 se o plano não tem esse assento). */
export function clampStylists(plan: Plan, stylists: number): number {
  if (plan.precoEstilistaCents === undefined) return 0;
  const n = Number.isFinite(stylists) ? Math.floor(stylists) : 0;
  return Math.max(0, Math.min(SEAT_LIMIT, n));
}

export interface Seats {
  /** Assentos cheios (editam molde). */
  full: number;
  /** Assentos Estilista (só no plano que tem esse preço). */
  stylists?: number;
}

/** Total por mês, em centavos; `null` se o preço não foi decidido. Aceita só o número de assentos cheios. */
export function planMonthlyCents(plan: Plan, seats: number | Seats): number | null {
  if (!hasPrice(plan)) return null;
  const s = typeof seats === "number" ? { full: seats } : seats;
  const stylists = clampStylists(plan, s.stylists ?? 0);
  return plan.precoPorUsuarioCents * clampSeats(plan, s.full) + (plan.precoEstilistaCents ?? 0) * stylists;
}

/** O que se paga de uma vez: a mensalidade, ou o ano (10 mensalidades). */
export function planChargeCents(plan: Plan, seats: number | Seats, billing: Billing): number | null {
  const monthly = planMonthlyCents(plan, seats);
  if (monthly === null) return null;
  return billing === "anual" ? monthly * ANNUAL_MONTHS : monthly;
}

export type WhoModels = "eu-modelo" | "colecao" | "equipe";
export type ProductionSize = "pequena" | "media" | "grande";

export interface PlanAnswers {
  /** Quantas pessoas vão usar. */
  users: number;
  whoModels: WhoModels;
  /** Faz encaixe (risco) na confecção? */
  nesting: boolean;
  /** Peças produzidas por mês: até 500, 500 a 5.000, mais de 5.000. */
  production: ProductionSize;
}

export const PRODUCTION_LABEL: Record<ProductionSize, string> = {
  pequena: "Até 500 peças por mês",
  media: "De 500 a 5.000 peças por mês",
  grande: "Mais de 5.000 peças por mês",
};

/**
 * Qual plano indicar no simulador, com o motivo em uma frase. Só indica plano publicado:
 * enquanto o Estilista estiver fora da página, quem só desenvolve coleção vai para a Confecção.
 */
export function recommendPlan(answers: PlanAnswers, plans: readonly Plan[] = PLANS): { plan: Plan; reason: string } {
  const visible = (id: PlanId) => plans.find((p) => p.id === id && p.publicado);
  const confeccao = visible("confeccao") ?? planById("confeccao");
  const users = Math.max(1, Math.floor(answers.users) || 1);

  if (answers.nesting) {
    return { plan: confeccao, reason: "O encaixe e a fila de riscos estão no plano Confecção." };
  }
  if (answers.whoModels === "equipe" || users >= 3 || answers.production === "grande") {
    return { plan: confeccao, reason: "Para a equipe trabalhar no mesmo molde, da coleção ao corte." };
  }
  if (answers.whoModels === "colecao") {
    const estilista = visible("estilista");
    if (estilista) return { plan: estilista, reason: "Você acompanha a coleção e a aprovação sem precisar modelar." };
    return { plan: confeccao, reason: "Coleção, ficha técnica e aprovação estão no plano Confecção." };
  }
  const modelista = visible("modelista") ?? confeccao;
  return { plan: modelista, reason: "Molde, Prova 3D e aprovação por link, para quem modela." };
}
