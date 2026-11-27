import { describe, expect, it } from "vitest";
import { lastMonths, monthKey, monthLabel, roiFee, roiMonth, type RoiBaseline } from "./roi";

const base: RoiBaseline = {
  pilotsPerMonth: 8,
  fabricPerPilotMm: 1800,
  pricePerMeterCents: 3200,
  hoursPerPilot: 6,
  hourRateCents: 2500,
  monthlyFabricMm: 2_000_000,
  efficiencyPct: 78,
  goalMonthlyCents: 100_000,
};

describe("resultados do mês", () => {
  it("pilotos evitados = os de antes − os cortados; tecido e horas de cada um", () => {
    const r = roiMonth(base, { pilotsCut: 5, avgEfficiency: null });
    expect(r.pilotsAvoided).toBe(3);
    expect(r.fabricMm).toBe(5400);
    expect(r.hours).toBe(18);
    expect(r.pilotCents).toBe(Math.round(5.4 * 3200) + 18 * 2500); // R$ 172,80 + R$ 450
    expect(r.nestingCents).toBe(0);
  });

  it("encaixe: aproveitamento melhor que o de antes economiza tecido; pior não conta", () => {
    const r = roiMonth(base, { pilotsCut: null, avgEfficiency: 0.8 });
    expect(r.pilotsAvoided).toBeNull();
    expect(r.nestingFabricMm).toBeCloseTo(2_000_000 * (1 - 0.78 / 0.8));
    expect(roiMonth(base, { pilotsCut: null, avgEfficiency: 0.7 }).nestingFabricMm).toBe(0);
  });

  it("cortou mais que antes: não vira economia negativa", () => {
    expect(roiMonth(base, { pilotsCut: 12, avgEfficiency: null }).pilotsAvoided).toBe(0);
  });

  it("progresso até a meta; sem meta, sem progresso", () => {
    const r = roiMonth(base, { pilotsCut: 5, avgEfficiency: null });
    expect(r.goalProgress).toBeCloseTo(r.netCents / 100_000);
    expect(roiMonth({ ...base, goalMonthlyCents: null }, { pilotsCut: 5, avgEfficiency: null }).goalProgress).toBeNull();
  });

  it("meses", () => {
    expect(monthKey(new Date("2026-11-15T12:00:00Z"))).toBe("2026-11-01");
    expect(lastMonths(3, "2026-01-01")).toEqual(["2026-01-01", "2025-12-01", "2025-11-01"]);
    expect(monthLabel("2026-03-01")).toBe("março de 2026");
  });
});

describe("mensalidade", () => {
  it("a líquida desconta a mensalidade e a meta conta a líquida", () => {
    const r = roiMonth(base, { pilotsCut: 5, avgEfficiency: null, feeCents: 23_800 });
    expect(r.feeCents).toBe(23_800);
    expect(r.netCents).toBe(r.totalCents - 23_800);
    expect(r.paybackMultiple).toBeCloseTo(r.totalCents / 23_800);
    expect(r.goalProgress).toBeCloseTo(r.netCents / 100_000);
  });

  it("sem preço: líquida = bruta, sem retorno", () => {
    const r = roiMonth(base, { pilotsCut: 5, avgEfficiency: null, feeCents: null });
    expect(r.netCents).toBe(r.totalCents);
    expect(r.paybackMultiple).toBeNull();
  });

  it("economia menor que a mensalidade: líquida negativa, meta em 0", () => {
    const r = roiMonth(base, { pilotsCut: 8, avgEfficiency: null, feeCents: 11_900 });
    expect(r.netCents).toBe(-11_900);
    expect(r.goalProgress).toBe(0);
  });
});

describe("mensalidade da organização", () => {
  it("equipe pelo preço de cada papel no plano que vale agora", () => {
    const f = roiFee({ plan_id: "confeccao", status: "ativa" }, ["owner", "modelista", "estilista", "leitura"]);
    expect(f).toEqual({ plan: "confeccao", cents: 2 * 11_900 + 5_900, charging: true });
  });

  it("teste e cortesia: o valor de quando assinar, sem cobrança", () => {
    expect(roiFee({ plan_id: "modelista", status: "trial" }, ["owner"])).toEqual({ plan: "modelista", cents: 6_900, charging: false });
    expect(roiFee({ plan_id: "modelista", status: "cortesia" }, ["owner"]).charging).toBe(false);
  });

  it("vencido conta como Grátis (sem mensalidade)", () => {
    expect(roiFee({ plan_id: "confeccao", status: "vencida" }, ["owner", "admin"])).toEqual({ plan: "gratis", cents: 0, charging: false });
  });
});
