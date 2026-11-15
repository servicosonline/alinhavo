import { describe, expect, it } from "vitest";
import { addFinish, emptyDocument, type PatternDocument, type Piece } from "@alinhavo/geometry";
import { flatSketch, pairHalf, readFlatSketch, SKETCH_ANCHOR_DROP, SKETCH_LEG_GAP, sketchPath } from "./flat-sketch";

const line = (to: string) => ({ kind: "line" as const, to });

/** Meia frente de saia na dobra: 0 cintura, 1 lateral, 2 barra, 3 dobra (centro, x = 0). */
function saiaFrente(side: "frente" | "costas" = "frente", id = "frente"): Piece {
  return {
    id,
    name: side === "frente" ? "Frente" : "Costas",
    points: { A: { x: 0, y: 0 }, B: { x: 180, y: 0 }, C: { x: 230, y: 600 }, D: { x: 0, y: 600 } },
    start: "A",
    outline: [line("B"), line("C"), line("D"), line("A")],
    seamAllowance: 10,
    fold: 3,
    placement: { side, anchor: "cintura", offset: 0 },
  };
}

/** Frente de calça (cortar par): 0 cintura, 1 lateral, 2 barra, 3 entrepernas, 4 gancho (centro em x = 0 no alto). */
function calcaFrente(): Piece {
  return {
    id: "calca",
    name: "Calça frente",
    points: { A: { x: 0, y: 0 }, B: { x: 190, y: 0 }, C: { x: 200, y: 980 }, D: { x: 10, y: 980 }, E: { x: -40, y: 280 } },
    start: "A",
    outline: [line("B"), line("C"), line("D"), line("E"), line("A")],
    seamAllowance: 10,
    cutPair: true,
    placement: { side: "frente", anchor: "cintura", offset: 0, leg: "esquerda" },
  };
}

function doc(pieces: Piece[], seams: PatternDocument["seams"] = []): PatternDocument {
  const d = emptyDocument(["M"], "M");
  d.pieces = pieces;
  d.seams = seams;
  return d;
}

describe("flatSketch", () => {
  it("parte na dobra: a peça inteira, simétrica no centro, na vista do seu lado", () => {
    const s = flatSketch(doc([saiaFrente(), saiaFrente("costas", "costas")]));
    expect(s.views.map((v) => v.side)).toEqual(["frente", "costas"]);
    const f = s.views[0]!;
    expect(f.bounds.minX).toBeCloseTo(-230);
    expect(f.bounds.maxX).toBeCloseTo(230);
    expect(f.outline).toHaveLength(1);
    expect(f.pieces).toHaveLength(1);
    // Cintura na altura da referência.
    expect(f.bounds.minY).toBeCloseTo(SKETCH_ANCHOR_DROP.cintura);
  });

  it("cortar par: a parte e o espelho se encontram no alto do gancho e as pernas ficam separadas abaixo dele", () => {
    const pants = doc([calcaFrente()], [{ id: "g", a: { piece: "calca", segment: 4 }, b: { piece: "calca", segment: 4 }, direction: "same" }]);
    const v = flatSketch(pants).views[0]!;
    expect(v.pieces).toHaveLength(2);
    expect(v.bounds.minX).toBeCloseTo(-200);
    expect(v.bounds.maxX).toBeCloseTo(200);
    // Um contorno só (juntas da cintura ao gancho), com o vértice do gancho no centro.
    expect(v.outline).toHaveLength(1);
    const crotchY = SKETCH_ANCHOR_DROP.cintura + 280;
    expect(v.outline[0]!.some((p) => Math.abs(p.x) < 0.2 && Math.abs(p.y - crotchY) < 0.5)).toBe(true);
    // Abaixo do gancho, nada do contorno perto do centro: as pernas não viram saia.
    expect(v.outline[0]!.filter((p) => p.y > crotchY + 40 && Math.abs(p.x) < 5)).toEqual([]);
    // Na barra, a entreperna do desenho fica a SKETCH_LEG_GAP do centro (a do molde, em 1 cm, passaria dele).
    const hemInner = v.outline[0]!.filter((p) => Math.abs(p.y - (SKETCH_ANCHOR_DROP.cintura + 980)) < 0.5).map((p) => Math.abs(p.x));
    expect(Math.min(...hemInner)).toBeCloseTo(SKETCH_LEG_GAP, 0);
  });

  it("metade de costas (centro à direita no molde): corta do lado certo", () => {
    // Uma perna de costas já centrada: fica em x < 0, a ponta do gancho passa para x > 0.
    const poly = [
      { x: -200, y: 0 },
      { x: 0, y: 0 },
      { x: 60, y: 300 },
      { x: -10, y: 1000 },
      { x: -210, y: 1000 },
    ];
    const [half] = pairHalf(poly, true);
    expect(Math.max(...half!.map((p) => p.x))).toBeLessThanOrEqual(0.05);
    expect(Math.min(...half!.map((p) => p.x))).toBeCloseTo(-210);
    // Sem perna (ex.: um colete em par): só corta no centro.
    expect(Math.max(...pairHalf(poly, false)[0]!.map((p) => p.x))).toBeLessThanOrEqual(0.05);
  });

  it("cortar par sem gancho costurado: o centro é a borda do lado do centro (à esquerda, na frente)", () => {
    const v = flatSketch(doc([calcaFrente()])).views[0]!;
    // Borda mais à esquerda é a ponta do gancho (x = -40): o centro vai para lá.
    expect(v.bounds.maxX).toBeCloseTo(240);
    expect(v.bounds.minX).toBeCloseTo(-240);
  });

  it("partes laterais ou sem posição ficam de fora, avisadas; sem frente nem costas, sem vistas", () => {
    const manga: Piece = {
      ...saiaFrente(),
      id: "manga",
      name: "Manga",
      fold: undefined,
      placement: { side: "esquerda", anchor: "ombro", offset: 0 },
    };
    const solta: Piece = { ...saiaFrente(), id: "solta", name: "Bolso", fold: undefined, placement: undefined };
    const s = flatSketch(doc([manga, solta]));
    expect(s.views).toEqual([]);
    expect(s.skipped).toEqual(["Manga", "Bolso"]);
  });

  it("altura pela referência: o que fica no ombro vem acima do que fica na cintura", () => {
    const top: Piece = { ...saiaFrente(), id: "top", name: "Top", placement: { side: "frente", anchor: "ombro", offset: 0 } };
    const v = flatSketch(doc([top, saiaFrente()])).views[0]!;
    const minYs = v.pieces.map((p) => Math.min(...p.map((q) => q.y)));
    expect(minYs).toEqual([SKETCH_ANCHOR_DROP.ombro, SKETCH_ANCHOR_DROP.cintura]);
  });

  it("acabamentos: pesponto nas duas metades da dobra; etiqueta uma vez, com o texto", () => {
    let d = doc([saiaFrente()]);
    d = addFinish(d, "frente", { kind: "pesponto", segment: 2, distance: 10, rows: 1 }).doc;
    d = addFinish(d, "frente", { kind: "etiqueta", anchor: "A", offset: { x: 40, y: 30 }, width: 40, height: 20, rotation: 0, text: "M" }).doc;
    const marks = flatSketch(d).views[0]!.marks;
    const pesp = marks.filter((m) => m.kind === "pesponto");
    expect(pesp).toHaveLength(2);
    const xs = pesp.map((m) => (m.kind === "pesponto" ? m.lines[0]!.map((p) => p.x) : []));
    expect(Math.min(...xs[0]!)).toBeGreaterThanOrEqual(-0.01); // a metade desenhada
    expect(Math.max(...xs[1]!)).toBeLessThanOrEqual(0.01); // o espelho
    expect(marks.filter((m) => m.kind === "etiqueta")).toEqual([expect.objectContaining({ label: 'Etiqueta "M"' })]);
  });
});

describe("caminho e leitura", () => {
  it("caminho SVG em mm, fechado ou aberto", () => {
    expect(
      sketchPath(
        [
          { x: 0, y: 0 },
          { x: 10.04, y: 5 },
        ],
        true,
      ),
    ).toBe("M0 0L10 5Z");
    expect(sketchPath([], false)).toBe("");
  });

  it("lê o desenho guardado; recusa o que não é do formato", () => {
    const s = flatSketch(doc([saiaFrente()]));
    expect(readFlatSketch(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(readFlatSketch({ schema: 2, views: [], skipped: [] })).toBeNull();
    expect(readFlatSketch(null)).toBeNull();
  });
});
