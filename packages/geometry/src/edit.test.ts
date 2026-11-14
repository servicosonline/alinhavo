import { describe, expect, it } from "vitest";
import {
  addRectPiece,
  emptyDocument,
  moveHandle,
  movePoint,
  removePiece,
  removePoint,
  renamePiece,
  setEdgeSeamAllowance,
  setSeamAllowance,
  splitSegment,
  toggleCurve,
  translatePiece,
} from "./edit";
import { documento, saiaCurva, saiaReta } from "./fixtures";
import { flattenOutline, pieceAtSize, segmentLengths, validatePattern, type PatternDocument } from "./pattern";
import { polygonArea } from "./polygon";

const congelado = (doc: PatternDocument) => JSON.parse(JSON.stringify(doc)) as PatternDocument;
const peca = (doc: PatternDocument, id = "frente") => doc.pieces.find((p) => p.id === id)!;

describe("partes", () => {
  it("cria um retângulo válido com id único", () => {
    let doc = emptyDocument();
    const a = addRectPiece(doc, { name: "Frente", width: 200, height: 600 });
    const b = addRectPiece(a.doc, { name: "Costas", width: 210, height: 600, origin: { x: 300, y: 0 } });
    doc = b.doc;
    expect([a.pieceId, b.pieceId]).toEqual(["parte1", "parte2"]);
    expect(validatePattern(doc)).toEqual([]);
    expect(polygonArea(flattenOutline(peca(doc, "parte2")).polygon)).toBe(210 * 600);
    expect(peca(doc, "parte2").points.P1).toEqual({ x: 300, y: 0 });
  });

  it("renomeia, muda margem e remove sem tocar no original", () => {
    const doc = documento();
    const antes = congelado(doc);
    expect(peca(renamePiece(doc, "frente", "  Frente da saia ")).name).toBe("Frente da saia");
    expect(renamePiece(doc, "frente", "   ")).toBe(doc);
    expect(peca(setSeamAllowance(doc, "frente", 12.34)).seamAllowance).toBe(12.3);
    expect(setSeamAllowance(doc, "frente", -1)).toBe(doc);
    expect(removePiece(doc, "frente").pieces).toHaveLength(0);
    expect(doc).toEqual(antes);
  });

  it("margem por segmento liga e desliga", () => {
    const doc = documento();
    const com = setEdgeSeamAllowance(doc, "frente", 1, 15);
    expect(peca(com).seamAllowanceByEdge).toEqual({ 1: 15, 2: 30 });
    const sem = setEdgeSeamAllowance(setEdgeSeamAllowance(com, "frente", 1, null), "frente", 2, null);
    expect(peca(sem).seamAllowanceByEdge).toBeUndefined();
    expect(setEdgeSeamAllowance(doc, "frente", 9, 10)).toBe(doc);
  });
});

describe("movePoint", () => {
  it("move o ponto arredondando para décimo de mm", () => {
    const doc = movePoint(documento(), "frente", "C", { x: 210.04, y: 600.06 });
    expect(peca(doc).points.C).toEqual({ x: 210, y: 600.1 });
  });

  it("as alças das curvas que tocam o ponto andam junto", () => {
    const doc = movePoint(documento([saiaCurva()]), "frente", "C", { x: 220, y: 600 });
    const lateral = peca(doc).outline[1]!;
    expect(lateral.kind === "cubic" && lateral.c2).toEqual({ x: 250, y: 300 }); // c2 segue C (+20)
    expect(lateral.kind === "cubic" && lateral.c1).toEqual({ x: 230, y: 120 }); // c1 fica (segue B)
  });

  it("ignora ponto inexistente, coordenada inválida e movimento nulo", () => {
    const doc = documento();
    expect(movePoint(doc, "frente", "Z", { x: 1, y: 1 })).toBe(doc);
    expect(movePoint(doc, "frente", "A", { x: Number.NaN, y: 1 })).toBe(doc);
    expect(movePoint(doc, "frente", "A", { x: 0, y: 0 })).toBe(doc);
    expect(movePoint(doc, "outra", "A", { x: 5, y: 5 })).toBe(doc);
  });
});

describe("curvas", () => {
  it("reta vira curva com alças a 1/3 e 2/3, e volta a ser reta", () => {
    const curva = toggleCurve(documento(), "frente", 0);
    expect(peca(curva).outline[0]).toEqual({ kind: "cubic", c1: { x: 66.7, y: 0 }, c2: { x: 133.3, y: 0 }, to: "B" });
    expect(segmentLengths(peca(curva))[0]).toBeCloseTo(200, 1);
    expect(peca(toggleCurve(curva, "frente", 0)).outline[0]).toEqual({ kind: "line", to: "B" });
  });

  it("move a alça só de curvas", () => {
    const doc = documento([saiaCurva()]);
    const movida = moveHandle(doc, "frente", 1, "c1", { x: 260, y: 100 });
    const seg = peca(movida).outline[1]!;
    expect(seg.kind === "cubic" && seg.c1).toEqual({ x: 260, y: 100 });
    expect(moveHandle(doc, "frente", 0, "c1", { x: 1, y: 1 })).toBe(doc); // segmento 0 é reta
  });
});

describe("splitSegment", () => {
  it("divide a reta no meio, e as metades herdam a margem", () => {
    const { doc, pointId } = splitSegment(documento(), "frente", 2); // barra, margem 30
    const p = peca(doc);
    expect(pointId).toBe("P1");
    expect(p.points.P1).toEqual({ x: 100, y: 600 });
    expect(p.outline.map((s) => s.to)).toEqual(["B", "C", "P1", "D", "A"]);
    expect(p.seamAllowanceByEdge).toEqual({ 2: 30, 3: 30 });
    expect(validatePattern(doc)).toEqual([]);
  });

  it("divide a curva sem mudar o desenho", () => {
    const original = documento([saiaCurva()]);
    const { doc } = splitSegment(original, "frente", 1, 0.4);
    const antes = segmentLengths(peca(original))[1]!;
    const [, a, b] = segmentLengths(peca(doc));
    expect(a! + b!).toBeCloseTo(antes, 0);
    expect(polygonArea(flattenOutline(peca(doc)).polygon)).toBeCloseTo(polygonArea(flattenOutline(peca(original)).polygon), -1);
  });

  it("o ponto novo gradua pela média das pontas", () => {
    const { doc, pointId } = splitSegment(documento(), "frente", 1); // lateral B→C
    // B anda (10,0) e C anda (10,15) no G: o meio anda (10, 7,5)
    expect(peca(doc).grading?.[pointId!]?.G).toEqual({ x: 10, y: 7.5 });
    const g = pieceAtSize(peca(doc), "G");
    expect(g.points[pointId!]).toEqual({ x: 210, y: 307.5 });
  });

  it("recusa t fora de (0, 1) e segmento inexistente", () => {
    const doc = documento();
    expect(splitSegment(doc, "frente", 0, 0).doc).toBe(doc);
    expect(splitSegment(doc, "frente", 0, 1).doc).toBe(doc);
    expect(splitSegment(doc, "frente", 7).pointId).toBeNull();
  });
});

describe("removePoint", () => {
  it("apagar um ponto junta os dois segmentos numa reta", () => {
    const { doc } = splitSegment(documento(), "frente", 0); // cintura ganha P1 no meio
    const limpo = removePoint(doc, "frente", "P1");
    expect(peca(limpo).outline).toEqual(saiaReta().outline);
    expect(peca(limpo).points.P1).toBeUndefined();
    expect(validatePattern(limpo)).toEqual([]);
  });

  it("apagar o ponto inicial muda o início e mantém o contorno fechado", () => {
    const { doc } = splitSegment(documento(), "frente", 1); // 5 pontos
    const semA = removePoint(doc, "frente", "A");
    const p = peca(semA);
    expect(p.start).toBe("B");
    expect(p.outline.at(-1)!.to).toBe("B");
    expect(p.grading?.A).toBeUndefined();
    expect(validatePattern(semA)).toEqual([]);
    // a barra (margem 30) era o segmento 3 e agora é o 2
    expect(p.seamAllowanceByEdge).toEqual({ 2: 30 });
  });

  it("não deixa a parte com menos de 3 pontos", () => {
    const triangulo = removePoint(documento(), "frente", "D");
    expect(peca(triangulo).outline).toHaveLength(3);
    expect(removePoint(triangulo, "frente", "C")).toBe(triangulo);
  });

  it("inserir e apagar um ponto na barra não muda a margem dela", () => {
    const original = documento();
    const { doc, pointId } = splitSegment(original, "frente", 2); // barra com 3 cm
    const volta = removePoint(doc, "frente", pointId!);
    expect(peca(volta).seamAllowanceByEdge).toEqual({ 2: 30 });
    expect(peca(volta).outline).toEqual(peca(original).outline);
  });

  it("juntar segmentos com margens diferentes volta à margem padrão", () => {
    const comLateral = setEdgeSeamAllowance(documento(), "frente", 1, 15); // lateral 1,5; barra 3
    const semC = removePoint(comLateral, "frente", "C"); // lateral + barra viram uma reta
    expect(peca(semC).seamAllowanceByEdge).toBeUndefined();
  });

  it("apagar o ponto inicial entre dois segmentos de mesma margem mantém a margem", () => {
    let doc = setEdgeSeamAllowance(documento(), "frente", 3, 20);
    doc = setEdgeSeamAllowance(doc, "frente", 0, 20); // centro da frente e cintura, 2 cm
    const p = peca(removePoint(doc, "frente", "A"));
    expect(p.outline.at(-1)).toEqual({ kind: "line", to: "B" }); // D→B
    expect(p.seamAllowanceByEdge).toEqual({ 1: 30, 2: 20 });
  });

  it("a margem da barra sobrevive quando se apaga um ponto antes dela", () => {
    const doc = removePoint(documento(), "frente", "B"); // cintura+lateral viram uma reta
    expect(peca(doc).outline.map((s) => s.to)).toEqual(["C", "D", "A"]);
    expect(peca(doc).seamAllowanceByEdge).toEqual({ 1: 30 }); // barra C→D
  });
});

describe("translatePiece", () => {
  it("move pontos e alças juntos, sem mudar forma nem gradação", () => {
    const doc = documento([saiaCurva()]);
    const movido = translatePiece(doc, "frente", { x: 300, y: -50 });
    const p = peca(movido);
    expect(p.points.A).toEqual({ x: 300, y: -50 });
    const lateral = p.outline[1]!;
    expect(lateral.kind === "cubic" && lateral.c1).toEqual({ x: 530, y: 70 });
    expect(segmentLengths(p)).toEqual(segmentLengths(peca(doc)));
    expect(p.grading).toEqual(peca(doc).grading);
    expect(translatePiece(doc, "frente", { x: 0, y: 0 })).toBe(doc);
  });
});
