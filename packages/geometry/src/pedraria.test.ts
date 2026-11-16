import { describe, expect, it } from "vitest";
import { splitSegment } from "./edit";
import { documento, saiaReta } from "./fixtures";
import { addFinish, finishShapes, PEDRARIA_MAX_STONES, validateFinishes, type NewFinish } from "./finishes";
import { migratePattern, pieceAtSize, validatePattern } from "./pattern";
import { garmentAtSize } from "./unfold";

const PNG = "data:image/png;base64,iVBORw0KGgo=";
const bordado: NewFinish = { kind: "bordado", anchor: "A", offset: { x: 100, y: 150 }, width: 80, height: 60, rotation: 0, image: PNG };
/** Pedras de 4 mm a cada 10 mm na barra (segmento 2, de C a D, 200 mm), 5 mm para dentro. */
const naBarra: NewFinish = { kind: "pedraria", segment: 2, distance: 5, from: 0, to: 1, stone: 4, spacing: 10, color: "#e8e8f0" };
/** Retângulo de 60 × 40 mm com pedras de 3 mm a cada 8 mm. */
const naArea: NewFinish = { kind: "pedraria", anchor: "A", offset: { x: 100, y: 300 }, width: 60, height: 40, rotation: 30, stone: 3, spacing: 8, color: "#c0a060" };

const inside = (p: { x: number; y: number }) => p.x > 0 && p.x < 200 && p.y > 0 && p.y < 600;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe("formato 7", () => {
  it("documento do formato 6 sobe para o 7 sem mudar as partes; 8 é desconhecido", () => {
    const v6 = { ...documento(), schema: 6 };
    expect(migratePattern(v6)).toEqual({ ...v6, schema: 7 });
    expect(migratePattern({ ...documento(), schema: 8 })).toBeNull();
  });

  it("bordado e pedraria (borda e área) passam na validação do molde", () => {
    let doc = documento();
    for (const f of [bordado, naBarra, naArea]) {
      const r = addFinish(doc, "frente", f);
      expect(r.finishId).not.toBeNull();
      doc = r.doc;
    }
    expect(validatePattern(doc)).toEqual([]);
  });

  it("recusa pedra fora do tamanho, distância menor que a pedra, cor inválida, dobra e pedras demais", () => {
    const p = saiaReta();
    const errs = (f: NewFinish, piece = p) => validateFinishes({ ...piece, finishes: [{ ...f, id: "A1" } as never] });
    expect(errs({ ...naBarra, stone: 1 } as NewFinish).join()).toMatch(/pedra de 2 a 12/);
    expect(errs({ ...naBarra, spacing: 3 } as NewFinish).join()).toMatch(/distância entre pedras/);
    expect(errs({ ...naBarra, color: "azul" } as NewFinish).join()).toMatch(/cor/);
    expect(errs(naBarra, { ...p, fold: 2 }).join()).toMatch(/dobra/);
    expect(errs({ ...naArea, width: 1000, height: 1000, stone: 2, spacing: 2 } as NewFinish).join()).toMatch(new RegExp(String(PEDRARIA_MAX_STONES)));
    expect(errs({ ...bordado, image: "data:text/plain;base64,AAAA" } as NewFinish).join()).toMatch(/imagem do bordado/);
  });
});

describe("desenho da pedraria", () => {
  it("na borda: pedras a cada 10 mm, centradas, 5 mm para dentro da barra", () => {
    const doc = addFinish(documento(), "frente", naBarra).doc;
    const [shape] = finishShapes(pieceAtSize(doc.pieces[0]!, "M"));
    if (shape?.kind !== "pedraria") throw new Error("sem pedraria");
    expect(shape.edge).toBe(true);
    expect(shape.radius).toBe(2);
    expect(shape.stones).toHaveLength(21); // 200 mm ÷ 10 + 1
    for (const s of shape.stones) expect(s.y).toBeCloseTo(595, 6);
    for (let i = 1; i < shape.stones.length; i++) expect(dist(shape.stones[i - 1]!, shape.stones[i]!)).toBeCloseTo(10, 6);
  });

  it("na área: pedras dentro do retângulo girado, nenhuma a menos de um espaçamento da outra", () => {
    const doc = addFinish(documento(), "frente", naArea).doc;
    const [shape] = finishShapes(pieceAtSize(doc.pieces[0]!, "M"));
    if (shape?.kind !== "pedraria") throw new Error("sem pedraria");
    expect(shape.edge).toBe(false);
    expect(shape.stones.length).toBeGreaterThan(10);
    const r = (-30 * Math.PI) / 180;
    for (const s of shape.stones) {
      // De volta ao retângulo sem giro, centrado em (100, 300): cabe com a pedra inteira.
      const dx = s.x - 100;
      const dy = s.y - 300;
      const x = dx * Math.cos(r) - dy * Math.sin(r);
      const y = dx * Math.sin(r) + dy * Math.cos(r);
      expect(Math.abs(x)).toBeLessThanOrEqual(30 - 1.5 + 1e-6);
      expect(Math.abs(y)).toBeLessThanOrEqual(20 - 1.5 + 1e-6);
      expect(inside(s)).toBe(true);
    }
    for (let i = 0; i < shape.stones.length; i++) {
      for (let j = i + 1; j < shape.stones.length; j++) expect(dist(shape.stones[i]!, shape.stones[j]!)).toBeGreaterThan(8 - 1e-6);
    }
  });

  it("dividir o segmento da pedraria de borda a desfaz; a de área fica", () => {
    let doc = documento();
    for (const f of [naBarra, naArea]) doc = addFinish(doc, "frente", f).doc;
    const split = splitSegment(doc, "frente", 2, 0.5).doc;
    const kinds = (split.pieces[0]!.finishes ?? []).map((f) => ("segment" in f ? "borda" : "area"));
    expect(kinds).toEqual(["area"]);
  });
});

describe("bordado e pedraria na Prova", () => {
  it("parte na dobra: a pedraria de borda nas duas metades; bordado e pedraria de área uma vez, com a imagem", () => {
    const p = saiaReta();
    p.fold = 3;
    delete p.seamAllowanceByEdge;
    let doc = documento([p]);
    for (const f of [bordado, naBarra, naArea]) doc = addFinish(doc, "frente", f).doc;
    const g = garmentAtSize(doc, "M");
    const count = (kind: string) => g.finishes.filter((f) => f.shape.kind === kind).length;
    expect(count("bordado")).toBe(1);
    expect(count("pedraria")).toBe(3);
    expect(g.finishes.find((f) => f.shape.kind === "bordado")!.image).toBe(PNG);
    const edges = g.finishes.filter((f) => f.shape.kind === "pedraria" && f.shape.edge);
    expect(edges.map((f) => f.mirrored)).toEqual([false, true]);
  });
});
