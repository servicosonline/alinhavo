import { describe, expect, it } from "vitest";
import { lastMonths, monthKey, monthLabel, roiMonth, type RoiBaseline } from "./roi";

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
    expect(r.goalProgress).toBeCloseTo(r.totalCents / 100_000);
    expect(roiMonth({ ...base, goalMonthlyCents: null }, { pilotsCut: 5, avgEfficiency: null }).goalProgress).toBeNull();
  });

  it("meses", () => {
    expect(monthKey(new Date("2026-11-15T12:00:00Z"))).toBe("2026-11-01");
    expect(lastMonths(3, "2026-01-01")).toEqual(["2026-01-01", "2025-12-01", "2025-11-01"]);
    expect(monthLabel("2026-03-01")).toBe("março de 2026");
  });
});
