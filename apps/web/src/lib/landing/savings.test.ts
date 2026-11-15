import { describe, expect, it } from "vitest";
import { EXAMPLE_NESTING, EXAMPLE_PILOTS, nestingPointSavings, parseBrNumber, pilotSavings } from "./savings";

describe("pilotSavings", () => {
  it("faz a conta do exemplo da página", () => {
    const s = pilotSavings(EXAMPLE_PILOTS);
    expect(s.avoided).toBe(4);
    expect(s.fabricMm).toBe(7200);
    expect(s.hours).toBe(24);
    expect(s.fabricCents).toBe(23040);
    expect(s.laborCents).toBe(60000);
    expect(s.monthlyCents).toBe(83040);
    expect(s.yearlyCents).toBe(996480);
  });

  it("nunca evita mais pilotos do que os cortados", () => {
    expect(pilotSavings({ ...EXAMPLE_PILOTS, pilotsPerMonth: 3, avoidedPilots: 10 }).avoided).toBe(3);
  });

  it("trata vazio, negativo e NaN como zero", () => {
    const s = pilotSavings({ ...EXAMPLE_PILOTS, pricePerMeterCents: Number.NaN, hourRateCents: -5 });
    expect(s.fabricCents).toBe(0);
    expect(s.laborCents).toBe(0);
    expect(pilotSavings({ ...EXAMPLE_PILOTS, avoidedPilots: 0 }).monthlyCents).toBe(0);
  });
});

describe("nestingPointSavings", () => {
  it("um ponto de 78% para 79% em 2.000 m poupa ~25,3 m", () => {
    const r = nestingPointSavings({ ...EXAMPLE_NESTING, pricePerMeterCents: 3200 })!;
    expect(r.fabricMm / 1000).toBeCloseTo(25.32, 1);
    expect(r.cents).toBe(81013);
  });

  it("recusa aproveitamento fora de 1..99 e consumo zero", () => {
    expect(nestingPointSavings({ monthlyFabricMm: 1000, efficiencyPct: 0, pricePerMeterCents: 1 })).toBeNull();
    expect(nestingPointSavings({ monthlyFabricMm: 1000, efficiencyPct: 100, pricePerMeterCents: 1 })).toBeNull();
    expect(nestingPointSavings({ monthlyFabricMm: 0, efficiencyPct: 80, pricePerMeterCents: 1 })).toBeNull();
  });
});

describe("parseBrNumber", () => {
  it("lê números como no Brasil", () => {
    expect(parseBrNumber("1,8")).toBe(1.8);
    expect(parseBrNumber("2.000")).toBe(2000);
    expect(parseBrNumber("1.234,50")).toBe(1234.5);
    expect(parseBrNumber("1.8")).toBe(1.8);
    expect(parseBrNumber(" 32 ")).toBe(32);
  });
  it("vazio, negativo ou texto vira 0", () => {
    expect(parseBrNumber("")).toBe(0);
    expect(parseBrNumber("-3")).toBe(0);
    expect(parseBrNumber("abc")).toBe(0);
  });
});
