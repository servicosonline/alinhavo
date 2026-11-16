import { describe, expect, it } from "vitest";
import { hexToLinearRgb } from "./colors";
import { WASHES, paintWash, washBase, washable } from "./wash";

const JEANS = "#4a6687";
const lum = (c: ArrayLike<number>, v = 0) => 0.2126 * c[v * 3]! + 0.7152 * c[v * 3 + 1]! + 0.0722 * c[v * 3 + 2]!;

describe("lavagem do jeans", () => {
  it("crua não muda a cor do tecido", () => {
    expect(washBase(JEANS, "crua")).toEqual(hexToLinearRgb(JEANS));
  });

  it("cada lavagem clareia mais que a anterior, de crua até clara", () => {
    const order = ["crua", "escura", "media", "clara"] as const;
    const ls = order.map((w) => lum(washBase(JEANS, w)));
    for (let i = 1; i < ls.length; i++) expect(ls[i]!).toBeGreaterThan(ls[i - 1]!);
  });

  it("estonada desbota onde estica; sem mapa, a cor fica uniforme", () => {
    const stretch = new Float32Array([0, 0.05]);
    const out = paintWash(new Float32Array(6), 0, 2, JEANS, "estonada", stretch, 0.05);
    expect(lum(out, 1)).toBeGreaterThan(lum(out, 0) + 0.05);
    const flat = paintWash(new Float32Array(6), 0, 2, JEANS, "estonada", null, 0.05);
    expect(lum(flat, 1)).toBe(lum(flat, 0));
  });

  it("pinta só a faixa pedida e fica entre 0 e 1", () => {
    const out = new Float32Array(9).fill(-1);
    paintWash(out, 1, 1, JEANS, "clara", new Float32Array([0, 1, 0]), 0.05);
    expect(out[0]).toBe(-1);
    expect(out[6]).toBe(-1);
    for (const c of out.slice(3, 6)) expect(c >= 0 && c <= 1).toBe(true);
  });

  it("só o jeans aceita lavagem e as lavagens têm ids únicos", () => {
    expect(washable("jeans")).toBe(true);
    expect(washable("jeansElastano")).toBe(true);
    expect(washable("malha")).toBe(false);
    expect(new Set(WASHES.map((w) => w.id)).size).toBe(WASHES.length);
  });
});
