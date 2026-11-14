import { describe, expect, it } from "vitest";
import { saiaCurva, saiaReta } from "./fixtures";
import { flattenOutline, pieceAtSize } from "./pattern";
import { polygonArea, type Point } from "./polygon";
import { offsetPolygon, offsetPolygonDetailed, seamAllowanceOutline } from "./seam-allowance";

const quadrado: Point[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

function caixa(pts: Point[]) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

describe("offsetPolygon", () => {
  it("margem de 1 cm num quadrado de 10 cm dá um quadrado de 12 cm", () => {
    const out = offsetPolygon(quadrado, [10, 10, 10, 10]);
    expect(out).toEqual([
      { x: -10, y: -10 },
      { x: 110, y: -10 },
      { x: 110, y: 110 },
      { x: -10, y: 110 },
    ]);
  });

  it("dá o mesmo resultado nos dois sentidos de giro", () => {
    const horario = [...quadrado].reverse();
    expect(polygonArea(offsetPolygon(horario, [10, 10, 10, 10]))).toBeCloseTo(120 * 120, 6);
  });

  it("respeita margem diferente por aresta", () => {
    // arestas: 0 topo, 1 direita, 2 base, 3 esquerda
    const out = offsetPolygon(quadrado, [10, 5, 30, 0]);
    expect(caixa(out)).toEqual({ minX: 0, maxX: 105, minY: -10, maxY: 130 });
  });

  it("canto côncavo (L) recua para dentro do recorte sem se cruzar", () => {
    const L: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 50 },
      { x: 50, y: 100 },
      { x: 0, y: 100 },
    ];
    const out = offsetPolygon(L, Array(6).fill(10));
    expect(out).toContainEqual({ x: 60, y: 60 }); // canto interno empurrado para fora do L
    // caixa de -10 a 110 nos dois eixos, menos o recorte de (60,60) a (110,110)
    expect(polygonArea(out)).toBeCloseTo(120 * 120 - 50 * 50, 6);
  });

  it("canto muito agudo vira chanfro em vez de uma ponta enorme", () => {
    const agulha: Point[] = [
      { x: 0, y: 0 },
      { x: 1000, y: 10 },
      { x: 0, y: 20 },
    ];
    const out = offsetPolygon(agulha, [10, 10, 10]);
    expect(out.length).toBe(4); // a ponta virou dois pontos
    expect(Math.max(...out.map((p) => p.x))).toBeLessThan(1050);
  });
});

describe("seamAllowanceOutline", () => {
  it("saia reta: 1 cm nas laterais e na cintura, 3 cm na barra", () => {
    expect(caixa(seamAllowanceOutline(saiaReta()))).toEqual({ minX: -10, maxX: 210, minY: -10, maxY: 630 });
  });

  it("acompanha a gradação", () => {
    expect(caixa(seamAllowanceOutline(pieceAtSize(saiaReta(), "G")))).toEqual({
      minX: -10,
      maxX: 220,
      minY: -10,
      maxY: 645,
    });
  });

  it("na lateral curva, todo ponto do corte fica ~1 cm do molde", () => {
    const peca = saiaCurva();
    const molde = flattenOutline(peca).polygon;
    const corte = seamAllowanceOutline(peca);
    const lateral = corte.filter((p) => p.x > 205 && p.y > 20 && p.y < 580);
    expect(lateral.length).toBeGreaterThan(3);
    for (const p of lateral) {
      const menor = Math.min(
        ...molde.map((a, i) => {
          const b = molde[(i + 1) % molde.length]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
          return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
        }),
      );
      expect(menor).toBeGreaterThan(9.9);
      expect(menor).toBeLessThan(10.2);
    }
  });
});

describe("offsetPolygonDetailed", () => {
  it("diz de qual vértice veio cada ponto, inclusive no chanfro", () => {
    expect(offsetPolygonDetailed(quadrado, [10, 10, 10, 10]).source).toEqual([0, 1, 2, 3]);
    const agulha: Point[] = [
      { x: 0, y: 0 },
      { x: 1000, y: 10 },
      { x: 0, y: 20 },
    ];
    const r = offsetPolygonDetailed(agulha, [10, 10, 10]);
    expect(r.points).toHaveLength(r.source.length);
    expect(r.source.filter((s) => s === 1)).toHaveLength(2); // a ponta virou dois pontos
  });
});
