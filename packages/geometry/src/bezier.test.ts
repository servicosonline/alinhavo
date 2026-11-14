import { describe, expect, it } from "vitest";
import { cubicLength, cubicPoint, flattenCubic, type Cubic } from "./bezier";

// Aproximação clássica de um quarto de circunferência de raio 100 mm.
const K = 0.5522847498;
const quarto: Cubic = {
  p0: { x: 100, y: 0 },
  c1: { x: 100, y: 100 * K },
  c2: { x: 100 * K, y: 100 },
  p3: { x: 0, y: 100 },
};

describe("Bézier cúbica", () => {
  it("passa pelas pontas em t=0 e t=1", () => {
    expect(cubicPoint(quarto, 0)).toEqual(quarto.p0);
    expect(cubicPoint(quarto, 1)).toEqual(quarto.p3);
  });

  it("mede um quarto de círculo de raio 100 como ~157,08 mm", () => {
    expect(cubicLength(quarto)).toBeCloseTo((Math.PI * 100) / 2, 1);
  });

  it("os pontos da amostragem ficam a no máximo a tolerância do círculo", () => {
    const pontos = flattenCubic(quarto, 0.1);
    expect(pontos.at(-1)).toEqual(quarto.p3);
    for (const p of pontos) {
      // a aproximação de Bézier erra ~0,03 mm do círculo; somamos a tolerância
      expect(Math.abs(Math.hypot(p.x, p.y) - 100)).toBeLessThan(0.15);
    }
  });

  it("uma curva reta vira um único segmento", () => {
    const reta: Cubic = { p0: { x: 0, y: 0 }, c1: { x: 10, y: 0 }, c2: { x: 20, y: 0 }, p3: { x: 30, y: 0 } };
    expect(flattenCubic(reta)).toEqual([{ x: 30, y: 0 }]);
    expect(cubicLength(reta)).toBe(30);
  });
});
