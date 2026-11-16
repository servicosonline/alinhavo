import { describe, expect, it } from "vitest";
import { removePoint, splitSegment } from "./edit";
import { documento, saiaCurva, saiaReta } from "./fixtures";
import {
  addFinish,
  areaCorners,
  FINISH_IMAGE_MAX,
  finishShapes,
  interiorSide,
  offsetPolyline,
  pointOnSegment,
  removeFinish,
  slicePolyline,
  updateFinish,
  validateFinishes,
  type NewFinish,
} from "./finishes";
import { migratePattern, pieceAtSize, validatePattern, type Piece } from "./pattern";
import { garmentAtSize, PAIR_SUFFIX } from "./unfold";

const PNG = "data:image/png;base64,iVBORw0KGgo=";
const pesponto: NewFinish = { kind: "pesponto", segment: 2, distance: 10, rows: 2 };
const ziper: NewFinish = { kind: "ziper", segment: 3, from: 0, to: 0.3 };
const etiqueta: NewFinish = { kind: "etiqueta", anchor: "A", offset: { x: 60, y: 40 }, width: 40, height: 20, rotation: 0, text: "Alinhavo" };
const estampa: NewFinish = { kind: "estampa", anchor: "A", offset: { x: 100, y: 200 }, width: 120, height: 120, rotation: 15, image: PNG };

/** O ponto está dentro do retângulo 0..200 × 0..600 da saia reta? */
const inside = (p: { x: number; y: number }) => p.x > 0 && p.x < 200 && p.y > 0 && p.y < 600;

describe("formato 5", () => {
  it("documento do formato 4 sobe para o 5 sem mudar as partes", () => {
    const v4 = { ...documento(), schema: 4 };
    expect(migratePattern(v4)).toEqual({ ...v4, schema: 6 });
  });

  it("acabamentos válidos passam na validação do molde", () => {
    let doc = documento();
    for (const f of [pesponto, ziper, etiqueta, estampa]) doc = addFinish(doc, "frente", f).doc;
    expect(doc.pieces[0]!.finishes).toHaveLength(4);
    expect(validatePattern(doc)).toEqual([]);
  });
});

describe("validateFinishes", () => {
  const com = (f: object): Piece => ({ ...saiaReta(), finishes: [{ id: "A1", ...f } as never] });

  it("recusa segmento que não existe, dobra e medidas fora da faixa", () => {
    expect(validateFinishes(com({ ...pesponto, segment: 9 }))).toHaveLength(1);
    expect(validateFinishes({ ...com(pesponto), fold: 2 })).toEqual([expect.stringMatching(/dobra/)]);
    expect(validateFinishes(com({ ...pesponto, distance: 80 }))).toHaveLength(1);
    expect(validateFinishes(com({ ...pesponto, rows: 3 }))).toHaveLength(1);
    expect(validateFinishes(com({ ...ziper, from: 0.5, to: 0.4 }))).toHaveLength(1);
  });

  it("recusa ponto de referência que não existe, tamanho e texto fora do limite", () => {
    expect(validateFinishes(com({ ...etiqueta, anchor: "Z" }))).toHaveLength(1);
    expect(validateFinishes(com({ ...etiqueta, width: 2 }))).toHaveLength(1);
    expect(validateFinishes(com({ ...etiqueta, text: "x".repeat(41) }))).toHaveLength(1);
  });

  it("a estampa só aceita imagem PNG, JPEG ou WebP em data URL e até o limite", () => {
    expect(validateFinishes(com(estampa))).toEqual([]);
    expect(validateFinishes(com({ ...estampa, image: "https://exemplo.com/a.png" }))).toHaveLength(1);
    expect(validateFinishes(com({ ...estampa, image: "data:image/svg+xml;base64,PHN2Zz4=" }))).toHaveLength(1);
    expect(validateFinishes(com({ ...estampa, image: `data:image/png;base64,${"A".repeat(FINISH_IMAGE_MAX)}` }))).toHaveLength(1);
  });

  it("recusa id repetido e tipo desconhecido", () => {
    const p = {
      ...saiaReta(),
      finishes: [
        { id: "A1", ...etiqueta },
        { id: "A1", ...etiqueta },
      ] as never,
    };
    expect(validateFinishes(p)).toEqual([expect.stringMatching(/repetido/)]);
    expect(validateFinishes(com({ kind: "bordado" }))).toEqual([expect.stringMatching(/desconhecido/)]);
  });
});

describe("operações", () => {
  it("põe com id novo, recusa o inválido, muda e tira", () => {
    const a = addFinish(documento(), "frente", etiqueta);
    const b = addFinish(a.doc, "frente", etiqueta);
    expect([a.finishId, b.finishId]).toEqual(["A1", "A2"]);
    expect(addFinish(b.doc, "frente", { ...etiqueta, anchor: "Z" })).toEqual({ doc: b.doc, finishId: null });

    const moved = updateFinish(b.doc, "frente", "A2", { offset: { x: 10, y: 10 } });
    expect(moved.pieces[0]!.finishes![1]).toMatchObject({ id: "A2", kind: "etiqueta", offset: { x: 10, y: 10 } });
    expect(updateFinish(b.doc, "frente", "A2", { width: 0 })).toBe(b.doc); // inválido: nada muda

    const gone = removeFinish(removeFinish(moved, "frente", "A1"), "frente", "A2");
    expect(gone.pieces[0]!.finishes).toBeUndefined();
  });

  it("não altera o documento original", () => {
    const doc = documento();
    addFinish(doc, "frente", etiqueta);
    expect(doc.pieces[0]!.finishes).toBeUndefined();
  });

  it("dividir um segmento desfaz o acabamento nele e renumera os outros", () => {
    let doc = addFinish(documento(), "frente", { ...pesponto, segment: 1 }).doc;
    doc = addFinish(doc, "frente", { ...pesponto, segment: 2 }).doc;
    const { doc: split } = splitSegment(doc, "frente", 1, 0.5);
    expect(split.pieces[0]!.finishes!.map((f) => ("segment" in f ? f.segment : -1))).toEqual([3]);
    expect(validatePattern(split)).toEqual([]);
  });

  it("apagar o ponto de referência tira a etiqueta presa a ele", () => {
    const doc = addFinish(addFinish(documento(), "frente", { ...etiqueta, anchor: "C" }).doc, "frente", etiqueta).doc;
    const next = removePoint(doc, "frente", "C");
    expect(next.pieces[0]!.finishes!.map((f) => ("anchor" in f ? f.anchor : ""))).toEqual(["A"]);
    expect(validatePattern(next)).toEqual([]);
  });
});

describe("desenho", () => {
  it("o pesponto fica dentro da parte, à distância pedida da costura", () => {
    const doc = addFinish(documento(), "frente", pesponto).doc;
    const [shape] = finishShapes(doc.pieces[0]!);
    if (shape?.kind !== "pesponto") throw new Error("sem pesponto");
    expect(shape.lines).toHaveLength(2);
    // Barra em y = 600: as carreiras ficam em 590 e 584, dentro.
    expect(shape.lines[0]!.every((p) => Math.abs(p.y - 590) < 1e-9)).toBe(true);
    expect(shape.lines[1]!.every((p) => Math.abs(p.y - 584) < 1e-9)).toBe(true);
  });

  it("acha o lado de dentro nos dois sentidos de contorno", () => {
    const p = saiaReta();
    const reverso: Piece = {
      ...p,
      outline: [
        { kind: "line", to: "D" },
        { kind: "line", to: "C" },
        { kind: "line", to: "B" },
        { kind: "line", to: "A" },
      ],
    };
    expect(interiorSide(reverso)).toBe(-interiorSide(p));
    for (const piece of [p, reverso]) {
      const line = offsetPolyline([piece.points.A!, piece.points[piece.outline[0]!.to]!], 5, interiorSide(piece));
      // As pontas caem na borda (canto); o meio da linha fica 5 mm para dentro.
      expect(inside({ x: (line[0]!.x + line[1]!.x) / 2, y: (line[0]!.y + line[1]!.y) / 2 })).toBe(true);
    }
  });

  it("o pesponto acompanha uma lateral curva sem sair da parte", () => {
    const doc = addFinish(documento([saiaCurva()]), "frente", { kind: "pesponto", segment: 1, distance: 8, rows: 1 }).doc;
    const [shape] = finishShapes(doc.pieces[0]!);
    if (shape?.kind !== "pesponto") throw new Error("sem pesponto");
    expect(shape.lines[0]!.length).toBeGreaterThan(5);
    expect(shape.lines[0]!.every((pt) => pt.x < 232)).toBe(true); // a curva vai até ~222
  });

  it("o zíper cobre só o trecho pedido do segmento", () => {
    const doc = addFinish(documento(), "frente", ziper).doc; // centro da frente, de D (y 600) para A (y 0)
    const [shape] = finishShapes(doc.pieces[0]!);
    if (shape?.kind !== "ziper") throw new Error("sem zíper");
    const ys = shape.axis.map((p) => p.y);
    expect(Math.max(...ys)).toBeCloseTo(600);
    expect(Math.min(...ys)).toBeCloseTo(420); // 30% de 600
    expect(shape.band.every((p) => p.x >= -1e-9 && p.x <= 10 + 1e-9)).toBe(true); // 1 cm para dentro
  });

  it("etiqueta e estampa: retângulo preso ao ponto, girado, acompanhando a gradação", () => {
    const piece = { ...saiaReta(), finishes: [{ id: "A1", ...estampa, anchor: "C", offset: { x: -100, y: -100 }, rotation: 90 }] } as Piece;
    const base = areaCorners(piece, piece.finishes![0] as never);
    expect(base.center).toEqual({ x: 100, y: 500 });
    expect(base.corners[0].x).toBeCloseTo(160); // girado 90°: −w/2, −h/2 vai para (+h/2, −w/2)
    const g = pieceAtSize(piece, "G");
    const [shape] = finishShapes(g);
    if (shape?.kind !== "estampa") throw new Error("sem estampa");
    expect(shape.center).toEqual({ x: 110, y: 515 }); // C anda (10, 15) no G
  });

  it("ponto no segmento e trecho de polilinha pelo comprimento", () => {
    expect(pointOnSegment(saiaReta(), 0, 0.25)).toEqual({ x: 50, y: 0 });
    expect(
      slicePolyline(
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ],
        0.25,
        0.75,
      ),
    ).toEqual([
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });
});

describe("na roupa da Prova (garmentAtSize)", () => {
  const dobrada = (): Piece => ({ ...saiaReta(), fold: 3 }); // centro da frente na dobra (x = 0)

  it("peça na dobra: pesponto nas duas metades, etiqueta uma vez; a peça aberta não leva a lista", () => {
    let doc = addFinish(documento([dobrada()]), "frente", pesponto).doc;
    doc = addFinish(doc, "frente", etiqueta).doc;
    const g = garmentAtSize(doc, "M");
    expect(g.pieces.every((p) => p.finishes === undefined)).toBe(true);
    const pesp = g.finishes.filter((f) => f.shape.kind === "pesponto");
    expect(pesp.map((f) => f.mirrored)).toEqual([false, true]);
    // A metade espelhada fica do outro lado da dobra (x negativo).
    const xs = (f: (typeof pesp)[number]) => (f.shape.kind === "pesponto" ? f.shape.lines[0]!.map((p) => p.x) : []);
    expect(Math.max(...xs(pesp[1]!))).toBeLessThanOrEqual(1e-9);
    expect(Math.min(...xs(pesp[0]!))).toBeGreaterThanOrEqual(-1e-9);
    const labels = g.finishes.filter((f) => f.shape.kind === "etiqueta");
    expect(labels).toHaveLength(1);
    expect(labels[0]!.text).toBe("Alinhavo");
  });

  it("cortar par: a cópia leva tudo espelhado, a etiqueta continua legível", () => {
    const doc = addFinish(documento([{ ...saiaReta(), cutPair: true }]), "frente", { ...etiqueta, rotation: 0 }).doc;
    const g = garmentAtSize(doc, "M");
    const [original, copia] = g.finishes;
    expect(copia!.piece).toBe(`frente${PAIR_SUFFIX}`);
    expect(copia!.mirrored).toBe(true);
    if (original!.shape.kind !== "etiqueta" || copia!.shape.kind !== "etiqueta") throw new Error();
    // Espelhada em x, com os cantos trocados: o canto 0 continua à esquerda do canto 1.
    expect(copia!.shape.corners[0].x).toBeLessThan(copia!.shape.corners[1].x);
    expect(original!.shape.corners[0].x).toBeLessThan(original!.shape.corners[1].x);
  });

  it("acompanha o tamanho", () => {
    const doc = addFinish(documento(), "frente", { ...etiqueta, anchor: "C", offset: { x: 0, y: 0 } }).doc;
    const c = (size: string) => {
      const f = garmentAtSize(doc, size).finishes[0]!.shape;
      return f.kind === "etiqueta" ? f.center : null;
    };
    expect(c("M")).toEqual({ x: 200, y: 600 });
    expect(c("G")).toEqual({ x: 210, y: 615 });
  });
});
