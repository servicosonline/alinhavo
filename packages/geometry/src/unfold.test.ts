import { describe, expect, it } from "vitest";
import { moveSegment, removePoint, setFold, setPlacement, splitSegment, toggleCurve } from "./edit";
import { documento, saiaCurva, saiaReta } from "./fixtures";
import { flattenOutline, pieceAtSize, segmentLengths, validatePattern, type PatternDocument, type Piece } from "./pattern";
import { polygonArea } from "./polygon";
import { addSeam, flipSeam } from "./seams";
import { drawnHalfSide, garmentAtSize, patternEdgeOf, unfoldPiece } from "./unfold";

/** Meia frente com a dobra no centro (segmento 3, de D a A, em x = 0). */
function meiaFrente(): Piece {
  return { ...saiaCurva(), fold: 3 };
}

function costas(): Piece {
  return { ...saiaReta(), id: "costas", name: "Costas", fold: 3 };
}

describe("unfoldPiece", () => {
  it("sem dobra devolve a própria peça", () => {
    const p = saiaReta();
    const { piece, origin } = unfoldPiece(p);
    expect(piece).toBe(p);
    expect(origin.map((o) => o.segment)).toEqual([0, 1, 2, 3]);
  });

  it("a peça aberta tem o dobro da área e é simétrica pela dobra", () => {
    const half = meiaFrente();
    const { piece } = unfoldPiece(half);
    expect(piece.fold).toBeUndefined();
    const area = (p: Piece) => polygonArea(flattenOutline(p, 0.01).polygon);
    expect(area(piece)).toBeCloseTo(2 * area(half), 0);
    // A dobra está em x = 0: cada ponto da cópia é o espelho em x.
    expect(piece.points["B~"]).toEqual({ x: -200, y: 0 });
    expect(piece.points["C~"]).toEqual({ x: -200, y: 600 });
    // A e D estão na dobra: não ganham cópia.
    expect(piece.points["A~"]).toBeUndefined();
    expect(piece.points["D~"]).toBeUndefined();
  });

  it("contorno: começa no fim da dobra, faz a metade original e volta pela espelhada", () => {
    const { piece, origin } = unfoldPiece(meiaFrente());
    expect(piece.start).toBe("A");
    expect(piece.outline.map((s) => s.to)).toEqual(["B", "C", "D", "C~", "B~", "A"]);
    expect(origin).toEqual([
      { segment: 0, mirrored: false },
      { segment: 1, mirrored: false },
      { segment: 2, mirrored: false },
      { segment: 2, mirrored: true },
      { segment: 1, mirrored: true },
      { segment: 0, mirrored: true },
    ]);
    // A curva espelhada tem o mesmo comprimento da original.
    const len = segmentLengths(piece);
    expect(len[4]).toBeCloseTo(len[1]!, 9);
    expect(validatePattern(documento([piece]))).toEqual([]);
  });

  it("margens por segmento e gradação acompanham o espelho", () => {
    const { piece } = unfoldPiece(meiaFrente()); // a barra (2) tem margem de 30 mm
    expect(piece.seamAllowanceByEdge).toEqual({ 2: 30, 3: 30 });
    // No G a lateral anda +10 mm em x; na cópia, −10 mm.
    expect(piece.grading?.["B~"]?.G).toEqual({ x: -10, y: 0 });
    const g = pieceAtSize(piece, "G");
    expect(g.points["B~"]).toEqual({ x: -210, y: 0 });
  });

  it("abrir e graduar comutam: graduar e depois abrir dá o mesmo contorno", () => {
    const a = flattenOutline(pieceAtSize(unfoldPiece(meiaFrente()).piece, "G"), 0.01).polygon;
    const b = flattenOutline(unfoldPiece(pieceAtSize(meiaFrente(), "G")).piece, 0.01).polygon;
    expect(a.length).toBe(b.length);
    a.forEach((p, i) => {
      expect(p.x).toBeCloseTo(b[i]!.x, 9);
      expect(p.y).toBeCloseTo(b[i]!.y, 9);
    });
  });
});

describe("garmentAtSize", () => {
  it("costura entre duas peças dobradas vira duas costuras, uma de cada lado", () => {
    const { doc } = addSeam(documento([meiaFrente(), costas()]), { piece: "frente", segment: 1 }, { piece: "costas", segment: 1 }, "same");
    const { pieces, seams } = garmentAtSize(doc, "M");
    expect(pieces.map((p) => p.outline.length)).toEqual([6, 6]);
    expect(seams).toEqual([
      { id: "costura1", a: { piece: "frente", segment: 1 }, b: { piece: "costas", segment: 1 }, direction: "same" },
      { id: "costura1~espelho", a: { piece: "frente", segment: 4 }, b: { piece: "costas", segment: 4 }, direction: "same" },
    ]);
    // Os dois lados de cada costura têm o mesmo comprimento que no molde.
    const lens = pieces.map((p) => segmentLengths(p));
    expect(lens[0]![4]).toBeCloseTo(lens[0]![1]!, 9);
  });

  it("com posição na Prova, liga as metades do mesmo lado do corpo (e o sentido acompanha)", () => {
    // Frente e costas desenhadas iguais (centro à esquerda, lateral à direita): vistas por
    // fora, a meia frente desenhada é o lado esquerdo do corpo e a meia costas, o direito.
    const frente: Piece = { ...meiaFrente(), placement: { side: "frente", anchor: "cintura", offset: 0 } };
    const tras: Piece = { ...costas(), placement: { side: "costas", anchor: "cintura", offset: 0 } };
    expect(drawnHalfSide(frente)).toBe("esquerda");
    expect(drawnHalfSide(tras)).toBe("direita");
    expect(drawnHalfSide(meiaFrente())).toBeNull(); // sem posição, não dá para saber

    const { doc } = addSeam(documento([frente, tras]), { piece: "frente", segment: 1 }, { piece: "costas", segment: 1 }, "same");
    const { seams } = garmentAtSize(doc, "M");
    // Cruza: original da frente com a cópia das costas, e vice-versa; a cópia anda ao
    // contrário, então "mesmo sentido" vira "oposto".
    expect(seams).toEqual([
      { id: "costura1", a: { piece: "frente", segment: 1 }, b: { piece: "costas", segment: 4 }, direction: "opposite" },
      { id: "costura1~espelho", a: { piece: "frente", segment: 4 }, b: { piece: "costas", segment: 1 }, direction: "opposite" },
    ]);
  });

  it("peça sem dobra costurada numa dobrada: só o lado original é costurado", () => {
    const solta: Piece = { ...saiaReta(), id: "lateral", name: "Lateral" };
    const { doc } = addSeam(documento([meiaFrente(), solta]), { piece: "frente", segment: 1 }, { piece: "lateral", segment: 3 });
    expect(garmentAtSize(doc, "M").seams).toHaveLength(1);
  });
});

describe("dobra e posição no editor", () => {
  const base = (): PatternDocument => documento([saiaReta()]);

  it("marca e desmarca a dobra; recusa curva, segmento inexistente e segmento costurado", () => {
    const doc = setFold(base(), "frente", 3);
    expect(doc.pieces[0]!.fold).toBe(3);
    expect(setFold(doc, "frente", null).pieces[0]!.fold).toBeUndefined();
    const curva = toggleCurve(base(), "frente", 1);
    expect(setFold(curva, "frente", 1)).toBe(curva);
    expect(setFold(base(), "frente", 9).pieces[0]!.fold).toBeUndefined();
    const { doc: costurado } = addSeam(documento([saiaReta(), costas()]), { piece: "frente", segment: 1 }, { piece: "costas", segment: 1 });
    expect(setFold(costurado, "frente", 1)).toBe(costurado);
  });

  it("não costura a dobra", () => {
    const { seamId } = addSeam(documento([meiaFrente(), costas()]), { piece: "frente", segment: 3 }, { piece: "costas", segment: 1 });
    expect(seamId).toBeNull();
  });

  it("validação: dobra curva, inexistente ou costurada é erro", () => {
    expect(validatePattern(documento([{ ...saiaCurva(), fold: 1 }]))).toContain("Frente: a dobra precisa ser um segmento reto.");
    expect(validatePattern(documento([{ ...saiaReta(), fold: 7 }]))).toContain("Frente: a dobra está num segmento que não existe.");
    const doc: PatternDocument = {
      ...documento([meiaFrente(), costas()]),
      seams: [{ id: "c", a: { piece: "frente", segment: 3 }, b: { piece: "costas", segment: 1 }, direction: "opposite" }],
    };
    expect(validatePattern(doc).join(" ")).toMatch(/a dobra não pode ser costurada/);
  });

  it("virar a dobra em curva tira a dobra; dividir ou juntar segmentos ajusta o índice", () => {
    const doc = setFold(base(), "frente", 3);
    expect(toggleCurve(doc, "frente", 3).pieces[0]!.fold).toBeUndefined();
    expect(splitSegment(doc, "frente", 0).doc.pieces[0]!.fold).toBe(4);
    expect(splitSegment(doc, "frente", 3).doc.pieces[0]!.fold).toBeUndefined();
    // Apagar B junta o topo (0) com a lateral (1): a dobra (3) vira 2.
    expect(removePoint(doc, "frente", "B").pieces[0]!.fold).toBe(2);
    // Apagar A junta a dobra (3) com o topo (0): a dobra some.
    expect(removePoint(doc, "frente", "A").pieces[0]!.fold).toBeUndefined();
  });

  it("posição na Prova: define, arredonda, tira e valida", () => {
    const doc = setPlacement(base(), "frente", { side: "frente", anchor: "cintura", offset: 12.34 });
    expect(doc.pieces[0]!.placement).toEqual({ side: "frente", anchor: "cintura", offset: 12.3 });
    expect(validatePattern(doc)).toEqual([]);
    expect(setPlacement(doc, "frente", null).pieces[0]!.placement).toBeUndefined();
    expect(setPlacement(base(), "frente", { side: "frente", anchor: "cintura", offset: 5000 }).pieces[0]!.placement).toBeUndefined();
    const ruim = documento([{ ...saiaReta(), placement: { side: "cima" as never, anchor: "cintura", offset: 0 } }]);
    expect(validatePattern(ruim)).toContain("Frente: posição na Prova inválida.");
  });

  it("inverter o sentido da costura", () => {
    const { doc, seamId } = addSeam(documento([saiaReta(), costas()]), { piece: "frente", segment: 1 }, { piece: "costas", segment: 1 });
    expect(flipSeam(doc, seamId!).seams[0]!.direction).toBe("same");
    expect(flipSeam(flipSeam(doc, seamId!), seamId!).seams[0]!.direction).toBe("opposite");
  });
});

describe("da Prova para o molde", () => {
  it("cada segmento da peça aberta aponta o segmento do molde, inclusive na metade espelhada", () => {
    const g = garmentAtSize(documento([meiaFrente()]), "G");
    // Aberta pela dobra (3): metade original 0, 1, 2 e espelhada 2, 1, 0.
    expect(g.origin.frente!.map((o) => [o.segment, o.mirrored])).toEqual([
      [0, false],
      [1, false],
      [2, false],
      [2, true],
      [1, true],
      [0, true],
    ]);
    expect(patternEdgeOf(g, "frente", 3)).toEqual({ piece: "frente", segment: 2 });
    expect(patternEdgeOf(g, "frente", 6)).toBeNull();
    expect(patternEdgeOf(g, "outra", 0)).toBeNull();
  });

  it("clicar na barra espelhada e alongar 4 cm alonga a barra inteira na Prova", () => {
    const doc = documento([meiaFrente()]);
    const edge = patternEdgeOf(garmentAtSize(doc, "M"), "frente", 3)!;
    const depois = garmentAtSize(moveSegment(doc, edge.piece, edge.segment, 40), "M");
    const lens = segmentLengths(depois.pieces[0]!);
    const antes = segmentLengths(garmentAtSize(doc, "M").pieces[0]!);
    // Barra igual nas duas metades; laterais (1 e 4) cresceram o mesmo tanto.
    expect(lens[2]).toBeCloseTo(lens[3]!, 6);
    expect(lens[1]! - antes[1]!).toBeCloseTo(lens[4]! - antes[4]!, 6);
    expect(lens[1]! - antes[1]!).toBeGreaterThan(39);
  });
});
