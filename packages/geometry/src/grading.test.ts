import { describe, expect, it } from "vitest";
import { documento, saiaCurva, saiaReta } from "./fixtures";
import { applyGrade, linearStep, setBaseSize, setPointGrading, setPointStepGrading, setSizes } from "./grading";
import { pieceAtSize, validatePattern, type PatternDocument, type Piece } from "./pattern";

const peca = (doc: PatternDocument) => doc.pieces[0]!;

/** Desenho de uma parte num tamanho: pontos e alças, para comparar. */
function desenho(piece: Piece, size: string) {
  const p = pieceAtSize(piece, size);
  return { points: p.points, outline: p.outline };
}

describe("linearStep", () => {
  it("reconhece passo regular, ponto parado e gradação irregular", () => {
    const p = saiaReta();
    const sizes = ["P", "M", "G"];
    expect(linearStep(p, "C", sizes, "M")).toEqual({ x: 10, y: 15 });
    expect(linearStep(p, "A", sizes, "M")).toEqual({ x: 0, y: 0 });
    const torto = { ...p, grading: { ...p.grading, C: { P: { x: -10, y: -15 }, G: { x: 12, y: 15 } } } };
    expect(linearStep(torto, "C", sizes, "M")).toBeNull();
  });
});

describe("gradação por ponto", () => {
  it("define o passo do ponto em todos os tamanhos", () => {
    const doc = setPointStepGrading(documento(), "frente", "A", { x: 0, y: -5 });
    expect(peca(doc).grading?.A).toEqual({ P: { x: 0, y: 5 }, G: { x: 0, y: -5 } });
    expect(pieceAtSize(peca(doc), "G").points.A).toEqual({ x: 0, y: -5 });
  });

  it("passo zero tira a gradação do ponto", () => {
    const doc = setPointStepGrading(documento(), "frente", "C", { x: 0, y: 0 });
    expect(peca(doc).grading?.C).toBeUndefined();
  });

  it("edita um tamanho só, e o base não aceita deslocamento", () => {
    const doc = setPointGrading(documento(), "frente", "C", "G", { x: 12, y: 15 });
    expect(peca(doc).grading?.C).toEqual({ P: { x: -10, y: -15 }, G: { x: 12, y: 15 } });
    expect(linearStep(peca(doc), "C", doc.sizes, doc.baseSize)).toBeNull();
    expect(setPointGrading(doc, "frente", "C", "M", { x: 1, y: 1 })).toBe(doc);
    const semG = setPointGrading(doc, "frente", "C", "G", null);
    expect(peca(semG).grading?.C).toEqual({ P: { x: -10, y: -15 } });
  });
});

describe("setSizes", () => {
  it("tamanho novo ganha o passo dos pontos regulares", () => {
    const doc = setSizes(documento(), ["PP", "P", "M", "G", "GG"]);
    expect(doc.sizes).toEqual(["PP", "P", "M", "G", "GG"]);
    expect(peca(doc).grading?.C?.GG).toEqual({ x: 20, y: 30 });
    expect(peca(doc).grading?.C?.PP).toEqual({ x: -20, y: -30 });
    expect(validatePattern(doc)).toEqual([]);
  });

  it("tirar um tamanho apaga a gradação dele, e pontos irregulares guardam os outros", () => {
    const irregular = setPointGrading(documento(), "frente", "C", "G", { x: 12, y: 15 });
    const doc = setSizes(irregular, ["M", "G"]);
    expect(peca(doc).grading?.C).toEqual({ G: { x: 12, y: 15 } });
    expect(peca(doc).grading?.B).toEqual({ G: { x: 10, y: 0 } });
    expect(validatePattern(doc)).toEqual([]);
  });

  it("recusa grade sem o base, vazia ou com repetidos", () => {
    const doc = documento();
    expect(setSizes(doc, ["P", "G"])).toBe(doc);
    expect(setSizes(doc, [])).toBe(doc);
    expect(setSizes(doc, ["M", "M"])).toBe(doc);
    expect(setSizes(doc, ["P", "M", "G"])).toBe(doc);
  });
});

describe("setBaseSize", () => {
  it("trocar o base não muda nenhum tamanho (retas e curvas)", () => {
    for (const piece of [saiaReta(), saiaCurva()]) {
      const antes = documento([piece]);
      const depois = setBaseSize(antes, "G");
      expect(depois.baseSize).toBe("G");
      for (const size of antes.sizes) {
        expect(desenho(peca(depois), size), `${piece.name} ${size}`).toEqual(desenho(peca(antes), size));
      }
      expect(validatePattern(depois)).toEqual([]);
    }
  });

  it("as coordenadas passam a ser as do novo base", () => {
    const doc = setBaseSize(documento(), "G");
    expect(peca(doc).points.C).toEqual({ x: 210, y: 615 });
    expect(peca(doc).grading?.C?.M).toEqual({ x: -10, y: -15 });
    expect(peca(doc).grading?.C?.G).toBeUndefined();
  });

  it("ida e volta devolve o documento original", () => {
    const doc = documento([saiaCurva()]);
    expect(setBaseSize(setBaseSize(doc, "P"), "M")).toEqual(doc);
  });

  it("ignora base fora da grade ou igual ao atual", () => {
    const doc = documento();
    expect(setBaseSize(doc, "GG")).toBe(doc);
    expect(setBaseSize(doc, "M")).toBe(doc);
  });
});

describe("applyGrade", () => {
  it("adota a grade da tabela trocando o base sem mudar os tamanhos existentes", () => {
    const antes = documento([saiaCurva()]);
    const r = applyGrade(antes, ["PP", "P", "M", "G", "GG"], "G");
    expect("doc" in r).toBe(true);
    if (!("doc" in r)) return;
    expect(r.doc.sizes).toEqual(["PP", "P", "M", "G", "GG"]);
    expect(r.doc.baseSize).toBe("G");
    for (const size of antes.sizes) expect(desenho(peca(r.doc), size)).toEqual(desenho(peca(antes), size));
    expect(validatePattern(r.doc)).toEqual([]);
  });

  it("explica quando o base da tabela não existe no molde", () => {
    const r = applyGrade(documento(), ["38", "40", "42"], "40");
    expect(r).toEqual({ error: expect.stringContaining("O molde não tem o tamanho 40") });
    expect(applyGrade(documento(), ["P", "P"], "P")).toEqual({ error: "A tabela não tem uma grade válida." });
  });
});
