import { describe, expect, it } from "vitest";
import { saia } from "./fixture";
import { buildMarkerLayout, layoutOutline, readMarkerLayout, MarkerLayoutError, type MarkerSettings } from "./layout";
import { nest, placedOutline, type NestPlacement } from "./nest";
import { patternNestPieces } from "./pattern";

const settings: MarkerSettings = { widthMm: 1500, gapMm: 0, oneWay: false, demand: { P: 1, M: 2 } };

function run(s: MarkerSettings = settings) {
  const pieces = patternNestPieces(saia(), s.demand);
  const result = nest(pieces, { widthMm: s.widthMm, gapMm: s.gapMm, oneWay: s.oneWay });
  return { pieces, result };
}

/** As posições como chegam do navegador (JSON). */
const wire = (p: NestPlacement[]): NestPlacement[] => JSON.parse(JSON.stringify(p));

describe("buildMarkerLayout", () => {
  it("aceita o risco do motor e recalcula comprimento e aproveitamento", () => {
    const { pieces, result } = run();
    const layout = buildMarkerLayout(pieces, wire(result.placements), settings);
    expect(layout.schema).toBe(1);
    expect(layout.placements).toHaveLength(9);
    expect(layout.lengthMm).toBeCloseTo(result.lengthMm, 1);
    expect(layout.efficiency).toBeCloseTo(result.efficiency, 4);
    expect(layout.demand).toEqual({ P: 1, M: 2 });
    // O contorno salvo desenha a peça onde o motor pôs (arredondado a 0,01 mm).
    const pl = result.placements[0]!;
    const fromLayout = layoutOutline(layout, layout.placements[0]!);
    const fromNest = placedOutline(pieces.find((p) => p.id === pl.pieceId)!, pl);
    fromLayout.forEach((q, i) => {
      expect(q.x).toBeCloseTo(fromNest[i]!.x, 1);
      expect(q.y).toBeCloseTo(fromNest[i]!.y, 1);
    });
    expect(readMarkerLayout(JSON.parse(JSON.stringify(layout)))).toEqual(layout);
  });

  it("recusa peça faltando, repetida ou que não existe no molde", () => {
    const { pieces, result } = run();
    const p = wire(result.placements);
    expect(() => buildMarkerLayout(pieces, p.slice(1), settings)).toThrow(/demanda pede 9/);
    expect(() => buildMarkerLayout(pieces, [...p.slice(1), p[1]!], settings)).toThrow(/duas vezes/);
    expect(() => buildMarkerLayout(pieces, [...p.slice(1), { ...p[0]!, pieceId: "outra@M" }], settings)).toThrow(/não existe/);
    expect(() => buildMarkerLayout(pieces, [...p.slice(1), { ...p[0]!, copy: 5 }], settings)).toThrow(/Cópia inválida/);
    expect(() => buildMarkerLayout(pieces, "x", settings)).toThrow(MarkerLayoutError);
  });

  it("recusa peça deformada, fora do fio, espelhada à toa ou fora do tecido", () => {
    const { pieces, result } = run();
    const p = wire(result.placements);
    const swap = (i: number, change: (pl: NestPlacement) => NestPlacement) => p.map((pl, j) => (j === i ? change(pl) : pl));
    expect(() => buildMarkerLayout(pieces, swap(0, (pl) => ({ ...pl, transform: { ...pl.transform, a: pl.transform.a * 1.1, b: pl.transform.b * 1.1 } })), settings)).toThrow(/deformada/);
    // Girar 90°: rígido, mas o fio fica atravessado.
    const turn = (pl: NestPlacement) => {
      const { a, b, c, d } = pl.transform;
      return { ...pl, transform: { ...pl.transform, a: -b, b: a, c: -d, d: c } };
    };
    expect(() => buildMarkerLayout(pieces, swap(0, turn), settings)).toThrow(/fio/);
    expect(() => buildMarkerLayout(pieces, swap(0, (pl) => ({ ...pl, mirrored: !pl.mirrored })), settings)).toThrow(/Espelho/);
    const flipY = (pl: NestPlacement) => ({ ...pl, transform: { ...pl.transform, b: -pl.transform.b, d: -pl.transform.d } });
    expect(() => buildMarkerLayout(pieces, swap(0, flipY), settings)).toThrow(/Espelho/);
    expect(() => buildMarkerLayout(pieces, swap(0, (pl) => ({ ...pl, transform: { ...pl.transform, ty: pl.transform.ty + 2000 } })), settings)).toThrow(/sai do tecido/);
    expect(() => buildMarkerLayout(pieces, swap(0, (pl) => ({ ...pl, transform: { ...pl.transform, tx: Number.NaN } })), settings)).toThrow(/inválida/);
  });

  it("tecido com sentido não aceita peça girada 180°", () => {
    const { pieces, result } = run();
    expect(result.placements.some((p) => p.rotation === 180)).toBe(true);
    expect(() => buildMarkerLayout(pieces, wire(result.placements), { ...settings, oneWay: true })).toThrow(/sentido/);
    const one = run({ ...settings, oneWay: true });
    expect(buildMarkerLayout(one.pieces, wire(one.result.placements), { ...settings, oneWay: true }).oneWay).toBe(true);
  });

  it("readMarkerLayout recusa o que não é formato 1", () => {
    expect(readMarkerLayout(null)).toBeNull();
    expect(readMarkerLayout({ schema: 2 })).toBeNull();
    expect(readMarkerLayout({ schema: 1, pieces: [], placements: [] })).toBeNull();
  });
});
