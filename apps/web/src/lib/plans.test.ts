import { describe, expect, it } from "vitest";
import {
  PLANS,
  ANNUAL_MONTHS,
  SEAT_LIMIT,
  TRIAL_DAYS,
  clampSeats,
  clampStylists,
  planChargeCents,
  planById,
  planMonthlyCents,
  publishedPlans,
  recommendPlan,
  type Plan,
  type PlanAnswers,
} from "./plans";

const base: PlanAnswers = { users: 1, whoModels: "eu-modelo", nesting: false, production: "pequena" };

/** Os mesmos planos, com preço de teste (o preço real ainda não foi decidido). */
const priced: Plan[] = PLANS.map((p) => (p.id === "gratis" ? p : { ...p, precoPorUsuarioCents: 10_000 }));

describe("planos", () => {
  it("os preços são os de lançamento decididos pelo Paulo (15/11/2026)", () => {
    expect(planById("gratis").precoPorUsuarioCents).toBe(0);
    expect(planById("modelista").precoPorUsuarioCents).toBe(6900);
    expect(planById("confeccao").precoPorUsuarioCents).toBe(11900);
    expect(planById("confeccao").precoEstilistaCents).toBe(5900);
    expect(planById("confeccao").leituraGratis).toBe(true);
    expect(planById("estilista").precoPorUsuarioCents).toBeNull(); // avulso não lançado
    expect(ANNUAL_MONTHS).toBe(10);
  });

  it("os pagos têm 15 dias de teste; o Estilista fica fora da página", () => {
    expect(PLANS.filter((p) => p.id !== "gratis").every((p) => p.trialDias === TRIAL_DAYS)).toBe(true);
    expect(publishedPlans().map((p) => p.id)).toEqual(["gratis", "modelista", "confeccao"]);
  });

  it("ids únicos", () => {
    expect(new Set(PLANS.map((p) => p.id)).size).toBe(PLANS.length);
  });
});

describe("total por usuários", () => {
  it("sem preço decidido, sem total", () => {
    expect(planMonthlyCents(planById("estilista"), 3)).toBeNull();
  });

  it("Confecção: assentos cheios + estilistas; anual = 10 mensalidades", () => {
    const c = planById("confeccao");
    expect(planMonthlyCents(c, { full: 1, stylists: 4 })).toBe(11900 + 4 * 5900); // R$ 355, a conta da diretoria
    expect(planChargeCents(c, { full: 2 }, "anual")).toBe(2 * 11900 * 10);
    expect(planChargeCents(planById("modelista"), 1, "mensal")).toBe(6900);
    // Modelista não tem assento estilista: o número é ignorado.
    expect(planMonthlyCents(planById("modelista"), { full: 1, stylists: 3 })).toBe(6900);
    expect(clampStylists(c, -2)).toBe(0);
  });

  it("preço × usuários, dentro dos limites", () => {
    const modelista = priced.find((p) => p.id === "modelista")!;
    expect(planMonthlyCents(modelista, 3)).toBe(30_000);
    expect(planMonthlyCents(modelista, 0)).toBe(10_000);
    expect(planMonthlyCents(modelista, 999)).toBe(10_000 * SEAT_LIMIT);
  });

  it("o Grátis é sempre 1 usuário e R$ 0", () => {
    expect(clampSeats(planById("gratis"), 5)).toBe(1);
    expect(planMonthlyCents(planById("gratis"), 5)).toBe(0);
  });

  it("quantidade quebrada ou inválida vira inteiro dentro do limite", () => {
    expect(clampSeats(planById("modelista"), 2.7)).toBe(2);
    expect(clampSeats(planById("modelista"), Number.NaN)).toBe(1);
  });
});

describe("plano indicado", () => {
  it("modelista sozinha → Modelista", () => {
    expect(recommendPlan(base).plan.id).toBe("modelista");
  });

  it("encaixe, equipe, 3+ usuários ou produção grande → Confecção", () => {
    expect(recommendPlan({ ...base, nesting: true }).plan.id).toBe("confeccao");
    expect(recommendPlan({ ...base, whoModels: "equipe" }).plan.id).toBe("confeccao");
    expect(recommendPlan({ ...base, users: 3 }).plan.id).toBe("confeccao");
    expect(recommendPlan({ ...base, production: "grande" }).plan.id).toBe("confeccao");
  });

  it("só coleção: Confecção enquanto o Estilista não é publicado; Estilista depois", () => {
    expect(recommendPlan({ ...base, whoModels: "colecao" }).plan.id).toBe("confeccao");
    const comEstilista = PLANS.map((p) => (p.id === "estilista" ? { ...p, publicado: true } : p));
    expect(recommendPlan({ ...base, whoModels: "colecao" }, comEstilista).plan.id).toBe("estilista");
  });

  it("nunca indica plano fora da página nem o Grátis", () => {
    const answers: PlanAnswers[] = [];
    for (const users of [1, 2, 5])
      for (const whoModels of ["eu-modelo", "colecao", "equipe"] as const)
        for (const nesting of [false, true])
          for (const production of ["pequena", "media", "grande"] as const) answers.push({ users, whoModels, nesting, production });
    for (const a of answers) {
      const { plan, reason } = recommendPlan(a);
      expect(plan.publicado).toBe(true);
      expect(plan.id).not.toBe("gratis");
      expect(reason.length).toBeGreaterThan(10);
    }
  });
});
