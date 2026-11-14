import { describe, expect, it } from "vitest";
import { clearanceColor, fillColors, heat, LOOSE_MM, pressureColor } from "./colors";

const red = (c: number[]) => c[0]!;
const blue = (c: number[]) => c[2]!;

describe("heat", () => {
  it("pontas: azul em 0 e vermelho em 1; fora da faixa fica na ponta", () => {
    expect(heat(0)).toEqual(heat(-3));
    expect(heat(1)).toEqual(heat(9));
    expect(blue(heat(0))).toBeGreaterThan(red(heat(0)));
    expect(red(heat(1))).toBeGreaterThan(blue(heat(1)));
    expect(heat(Number.NaN)).toEqual(heat(0));
  });

  it("o azul nunca aumenta conforme sobe (o amarelo, mais claro, fica entre o verde e o vermelho)", () => {
    let prev = heat(0);
    for (let t = 0.05; t <= 1.0001; t += 0.05) {
      const c = heat(t);
      expect(blue(c)).toBeLessThanOrEqual(blue(prev) + 1e-12);
      prev = c;
    }
  });
});

describe("mapas", () => {
  it("pressão: sem tensão é azul, no limite do tecido é vermelho, folgado continua azul", () => {
    expect(pressureColor(0, 0.05)).toEqual(heat(0));
    expect(pressureColor(0.05, 0.05)).toEqual(heat(1));
    expect(pressureColor(-0.02, 0.05)).toEqual(heat(0));
    expect(pressureColor(0.025, 0.05)).toEqual(heat(0.5));
  });

  it("folga: encostado é vermelho, solto é azul", () => {
    expect(clearanceColor(0)).toEqual(heat(1));
    expect(clearanceColor(LOOSE_MM)).toEqual(heat(0));
    expect(clearanceColor(500)).toEqual(heat(0));
  });

  it("preenche três canais por vértice", () => {
    const out = fillColors([0, LOOSE_MM], clearanceColor);
    expect(out).toHaveLength(6);
    expect(Array.from(out.slice(0, 3))).toEqual(heat(1).map((v) => Math.fround(v)));
  });
});
