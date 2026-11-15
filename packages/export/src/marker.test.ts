import { buildMarkerLayout, layoutOutline, nest, patternNestPieces, type MarkerLayout } from "@alinhavo/nesting";
import DxfParser from "dxf-parser";
import { describe, expect, it } from "vitest";
import { saia } from "./fixture";
import { exportMarkerDxf } from "./marker-dxf";
import { exportMarkerPlt, PLT_UNITS_PER_MM } from "./marker-plt";

function marker(): MarkerLayout {
  const settings = { widthMm: 1500, gapMm: 0, oneWay: false, demand: { P: 1, M: 2 } };
  const pieces = patternNestPieces(saia(), settings.demand);
  const result = nest(pieces, settings);
  return buildMarkerLayout(pieces, result.placements, settings);
}

type Vertex = { x: number; y: number };
type Entity = { type: string; layer: string; text?: string; vertices?: Vertex[]; shape?: boolean };

describe("risco em DXF", () => {
  const layout = marker();
  const dxf = exportMarkerDxf(layout, { title: "Saia - risco 1", date: new Date(2026, 10, 15) });
  const parsed = new DxfParser().parseSync(dxf) as unknown as { entities: Entity[]; tables: { layer: { layers: Record<string, unknown> } } };

  it("abre num leitor DXF independente, com as camadas do risco", () => {
    expect(Object.keys(parsed.tables.layer.layers).sort()).toEqual(["0", "1", "15", "TECIDO"]);
    expect(dxf.trimEnd().endsWith("EOF")).toBe(true);
  });

  it("uma polilinha fechada por peça cortada, no lugar do risco (Y invertido)", () => {
    const cuts = parsed.entities.filter((e) => e.type === "POLYLINE" && e.layer === "1");
    expect(cuts).toHaveLength(layout.placements.length);
    cuts.forEach((e, i) => {
      expect(e.shape).toBe(true);
      const expected = layoutOutline(layout, layout.placements[i]!);
      expect(e.vertices).toHaveLength(expected.length);
      e.vertices!.forEach((v, k) => {
        expect(v.x).toBeCloseTo(expected[k]!.x, 2);
        expect(v.y).toBeCloseTo(-expected[k]!.y, 2);
        expect(v.x).toBeGreaterThanOrEqual(-0.01);
        expect(v.x).toBeLessThanOrEqual(layout.lengthMm + 0.01);
        expect(v.y).toBeLessThanOrEqual(0.01);
        expect(v.y).toBeGreaterThanOrEqual(-layout.widthMm - 0.01);
      });
    });
  });

  it("tem o retângulo do tecido e os textos de cada peça e do risco", () => {
    const fabric = parsed.entities.filter((e) => e.layer === "TECIDO");
    expect(fabric).toHaveLength(1);
    expect(fabric[0]!.vertices).toEqual([
      expect.objectContaining({ x: 0, y: 0 }),
      expect.objectContaining({ x: layout.lengthMm, y: 0 }),
      expect.objectContaining({ x: layout.lengthMm, y: -1500 }),
      expect.objectContaining({ x: 0, y: -1500 }),
    ]);
    const texts = parsed.entities.filter((e) => e.type === "TEXT").map((e) => e.text);
    expect(texts).toContain("Costas da saia M");
    expect(texts).toContain("Saia - risco 1");
    expect(texts).toContain("Demanda: P=1 M=2");
    expect(texts.length).toBe(layout.placements.length + 4);
  });

  it("recusa risco vazio", () => {
    expect(() => exportMarkerDxf({ ...layout, placements: [] }, { title: "x" })).toThrow();
  });
});

/** Leitor mínimo de HPGL: comandos separados por ";" (LB termina no ETX). */
function readPlt(plt: string) {
  const cmds: { op: string; args: string }[] = [];
  let i = 0;
  while (i < plt.length) {
    const op = plt.slice(i, i + 2);
    if (op === "LB") {
      const end = plt.indexOf("\u0003", i);
      cmds.push({ op, args: plt.slice(i + 2, end) });
      i = end + 2; // ETX e ";"
    } else {
      const end = plt.indexOf(";", i);
      if (end < 0) break;
      cmds.push({ op, args: plt.slice(i + 2, end) });
      i = end + 1;
    }
    while (plt[i] === "\n") i++;
  }
  return cmds;
}

const pairs = (args: string) => {
  const n = args.split(",").map(Number);
  return Array.from({ length: n.length / 2 }, (_, k) => ({ x: n[2 * k]!, y: n[2 * k + 1]! }));
};

describe("risco em HPGL (.plt)", () => {
  const layout = marker();
  const plt = exportMarkerPlt(layout);
  const cmds = readPlt(plt);

  it("começa e termina como a plotter espera", () => {
    expect(cmds.slice(0, 2).map((c) => c.op)).toEqual(["IN", "SP"]);
    expect(cmds.at(-1)).toEqual({ op: "SP", args: "0" });
    expect(cmds.every((c) => /^[A-Z]{2}$/.test(c.op))).toBe(true);
  });

  it("cada peça é um contorno fechado com a caneta 1, dentro do tecido, em 0,025 mm", () => {
    const cut = cmds.slice(0, cmds.findIndex((c) => c.op === "SP" && c.args === "2"));
    const ups = cut.filter((c) => c.op === "PU");
    const downs = cut.filter((c) => c.op === "PD");
    expect(ups).toHaveLength(layout.placements.length);
    expect(downs).toHaveLength(layout.placements.length);
    downs.forEach((d, i) => {
      const start = pairs(ups[i]!.args)[0]!;
      const path = pairs(d.args);
      expect(path.at(-1)).toEqual(start);
      for (const p of [start, ...path]) {
        expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(Math.ceil(layout.lengthMm * PLT_UNITS_PER_MM));
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1500 * PLT_UNITS_PER_MM);
      }
      // Mesmo desenho do risco: Y = largura − y.
      const first = layoutOutline(layout, layout.placements[i]!)[0]!;
      expect(start).toEqual({ x: Math.round(first.x * 40), y: Math.round((1500 - first.y) * 40) });
    });
  });

  it("rótulos com a caneta 2, em ASCII; sem rótulos quando pedido", () => {
    const labels = cmds.filter((c) => c.op === "LB").map((c) => c.args);
    expect(labels).toHaveLength(layout.placements.length);
    expect(labels).toContain("Costas da saia P");
    const bare = readPlt(exportMarkerPlt(layout, { labels: false }));
    expect(bare.some((c) => c.op === "LB" || (c.op === "SP" && c.args === "2"))).toBe(false);
  });
});
