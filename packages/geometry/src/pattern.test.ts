import { describe, expect, it } from "vitest";
import { documento, saiaCurva, saiaReta, SIZES } from "./fixtures";
import { flattenOutline, pieceAtSize, segmentLengths, stepGrading, validatePattern } from "./pattern";
import { polygonArea } from "./polygon";

describe("validatePattern", () => {
  it("aceita um documento correto", () => {
    expect(validatePattern(documento([saiaReta(), { ...saiaCurva(), id: "costas" }]))).toEqual([]);
  });

  it("aponta contorno aberto, ponto inexistente e tamanho fora da grade", () => {
    const p = saiaReta();
    p.outline[3] = { kind: "line", to: "B" };
    p.outline.push({ kind: "line", to: "Z" });
    p.grading = { ...p.grading, A: { XG: { x: 1, y: 0 } } };
    const erros = validatePattern(documento([p]));
    expect(erros).toContain("Frente: o segmento 5 vai para um ponto que não existe (Z).");
    expect(erros).toContain("Frente: o contorno não fecha (o último segmento precisa voltar ao ponto inicial).");
    expect(erros).toContain("Frente: gradação para um tamanho fora da grade (XG).");
  });

  it("aponta grade sem o tamanho base, margens absurdas e partes repetidas", () => {
    const p = saiaReta();
    p.seamAllowance = -5;
    p.seamAllowanceByEdge = { 9: 10 };
    const doc = { ...documento([p, saiaReta()]), baseSize: "GG" };
    const erros = validatePattern(doc);
    expect(erros).toContain('O tamanho base "GG" não está na grade.');
    expect(erros).toContain("Frente: margem de costura fora do intervalo 0 a 100 mm.");
    expect(erros).toContain("Frente: margem definida para um segmento que não existe (9).");
    expect(erros).toContain("Parte repetida: frente.");
  });

  it("recusa coordenadas que não são número", () => {
    const p = saiaReta();
    p.points.A = { x: Number.NaN, y: 0 };
    expect(validatePattern(documento([p]))).toContain("Frente: o ponto A tem coordenada inválida.");
  });
});

describe("gradação", () => {
  it("stepGrading anda para os dois lados do base", () => {
    expect(stepGrading(SIZES, "M", { x: 5, y: 2 })).toEqual({ P: { x: -5, y: -2 }, G: { x: 5, y: 2 } });
    expect(() => stepGrading(SIZES, "XG", { x: 1, y: 1 })).toThrow();
    // nada de -0: o documento salvo e relido tem que ser idêntico
    expect(Object.is(stepGrading(SIZES, "M", { x: 0, y: 5 }).P!.x, 0)).toBe(true);
  });

  it("o tamanho base fica igual ao original", () => {
    const base = pieceAtSize(saiaReta(), "M");
    expect(base.points).toEqual(saiaReta().points);
    expect(base.grading).toBeUndefined();
  });

  it("G fica 1 cm mais largo e 1,5 cm mais comprido que o M", () => {
    const g = pieceAtSize(saiaReta(), "G");
    expect(g.points.C).toEqual({ x: 210, y: 615 });
    expect(polygonArea(flattenOutline(g).polygon)).toBe(210 * 615);
    expect(polygonArea(flattenOutline(pieceAtSize(saiaReta(), "P")).polygon)).toBe(190 * 585);
  });

  it("as alças da curva acompanham as pontas", () => {
    const g = pieceAtSize(saiaCurva(), "G");
    const lateral = g.outline[1]!;
    expect(lateral.kind).toBe("cubic");
    if (lateral.kind !== "cubic") return;
    expect(lateral.c1).toEqual({ x: 240, y: 120 }); // segue B (+10, 0)
    expect(lateral.c2).toEqual({ x: 240, y: 315 }); // segue C (+10, +15)
  });

  it("não altera a peça original", () => {
    const p = saiaReta();
    pieceAtSize(p, "G");
    expect(p).toEqual(saiaReta());
  });
});

describe("contorno", () => {
  it("retângulo vira 4 vértices, cada aresta ligada ao seu segmento", () => {
    const { polygon, edgeSegment } = flattenOutline(saiaReta());
    expect(polygon).toEqual([
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 600 },
      { x: 0, y: 600 },
    ]);
    expect(edgeSegment).toEqual([0, 1, 2, 3]);
  });

  it("a curva vira várias arestas, todas do segmento da lateral", () => {
    const { polygon, edgeSegment } = flattenOutline(saiaCurva());
    expect(polygon.length).toBe(edgeSegment.length);
    expect(polygon.length).toBeGreaterThan(6);
    expect(edgeSegment.filter((s) => s === 1).length).toBe(polygon.length - 3);
  });

  it("mede cada costura", () => {
    expect(segmentLengths(saiaReta())).toEqual([200, 600, 200, 600]);
    const [, lateral] = segmentLengths(saiaCurva());
    expect(lateral).toBeGreaterThan(600); // a curva do quadril é mais longa que a reta
    expect(lateral).toBeLessThan(620);
  });
});
