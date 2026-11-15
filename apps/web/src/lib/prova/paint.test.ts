import { describe, expect, it } from "vitest";
import type { MapSummary } from "@alinhavo/cloth";
import { pressureColor } from "./colors";
import { garmentPaint, hexToLinearRgb } from "./paint";
import type { ProvaMaps, ProvaPart } from "./protocol";

const summary: MapSummary = { maxStretch: 0, highStretch: 0, areaNearLimit: 0, minClearance: 0, maxClearance: 0 };
const maps = (stretch: number[], clearance: number[]): ProvaMaps => ({
  stretch: Float32Array.from(stretch),
  clearance: Float32Array.from(clearance),
  summary,
});
const part = (start: number, count: number, fabric: ProvaPart["fabric"], fabricLimit: number, main = false): ProvaPart => ({
  name: fabric,
  main,
  start,
  count,
  triStart: 0,
  triCount: 0,
  fabric,
  fabricLimit,
});
const rgb = (c: Float32Array, v: number) => [c[v * 3], c[v * 3 + 1], c[v * 3 + 2]];

describe("garmentPaint", () => {
  it("uma roupa na vista Tecido: sem cor por vértice (vale a do tecido)", () => {
    expect(garmentPaint("tecido", null, [part(0, 3, "malha", 0.25, true)], 3)).toBeNull();
  });

  it("look na vista Tecido: cada roupa com a sua cor", () => {
    const c = garmentPaint("tecido", null, [part(0, 2, "malha", 0.25, true), part(2, 2, "malha", 0.25)], 4)!;
    expect(rgb(c, 0)).toEqual(rgb(c, 1));
    expect(rgb(c, 2)).toEqual(rgb(c, 3));
    expect(rgb(c, 0)).not.toEqual(rgb(c, 2)); // mesmo tecido, tons diferentes
  });

  it("pressão: cada roupa contra o limite do seu tecido", () => {
    const m = maps([0.03, 0.03], [0, 0]);
    const c = garmentPaint("pressao", m, [part(0, 1, "jeans", 0.03, true), part(1, 1, "malha", 0.25)], 2)!;
    // O mapa chega em Float32: compara de perto, não bit a bit.
    pressureColor(0.03, 0.03).forEach((v, k) => expect(rgb(c, 0)[k]).toBeCloseTo(v, 5));
    expect(rgb(c, 0)).not.toEqual(rgb(c, 1)); // 3% é o limite do jeans, pouco para a malha
  });

  it("a cor por vértice é linear, como o three faz com a cor do material", () => {
    expect(hexToLinearRgb("#ffffff")).toEqual([1, 1, 1]);
    expect(hexToLinearRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToLinearRgb("#808080")[0]).toBeCloseTo(0.2158, 3); // cinza médio do sRGB
  });

  it("sem mapa ainda: pressão e folga ficam com a vista Tecido", () => {
    expect(garmentPaint("pressao", null, [part(0, 1, "malha", 0.25, true)], 1)).toBeNull();
    expect(garmentPaint("folga", null, [part(0, 1, "malha", 0.25, true)], 1)).toBeNull();
  });

  it("folga: cor pelo mapa de folga em todos os vértices", () => {
    const c = garmentPaint("folga", maps([0, 0], [0, 80]), [part(0, 2, "malha", 0.25, true)], 2)!;
    expect(c).toHaveLength(6);
    expect(rgb(c, 0)).not.toEqual(rgb(c, 1));
  });
});
