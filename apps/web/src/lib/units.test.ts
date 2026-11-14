import { describe, expect, it } from "vitest";
import { formatCm, parseCmToMm } from "./units";

describe("unidades", () => {
  it("mostra mm como cm com vírgula", () => {
    expect(formatCm(125)).toBe("12,5");
    expect(formatCm(600)).toBe("60");
    expect(formatCm(12.3)).toBe("1,23");
    expect(formatCm(0)).toBe("0");
    expect(formatCm(-40)).toBe("-4");
  });

  it("lê cm com vírgula ou ponto e devolve mm", () => {
    expect(parseCmToMm("12,5")).toBe(125);
    expect(parseCmToMm(" 60 ")).toBe(600);
    expect(parseCmToMm("1.23")).toBe(12.3);
    expect(parseCmToMm("-4")).toBe(-40);
  });

  it("recusa o que não é número", () => {
    for (const ruim of ["", "abc", "12,5cm", "1,2,3", "--1"]) expect(parseCmToMm(ruim), ruim).toBeNull();
  });

  it("ida e volta não perde precisão", () => {
    for (const mm of [0.1, 12.3, 125, 999.9]) expect(parseCmToMm(formatCm(mm))).toBe(mm);
  });
});
