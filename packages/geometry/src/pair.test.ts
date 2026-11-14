import { describe, expect, it } from "vitest";
import { moveSegment, setCutPair, setFold } from "./edit";
import { documento, saiaReta } from "./fixtures";
import { flattenOutline, migratePattern, segmentLengths, validatePattern, type PatternDocument, type Piece } from "./pattern";
import { signedArea } from "./polygon";
import { addSeam, continuationSegments } from "./seams";
import { garmentAtSize, pairCopy, patternEdgeOf, PAIR_SUFFIX } from "./unfold";

/**
 * Meia calça simplificada (frente esquerda): retângulo com a barra embaixo.
 * Segmentos: 0 cintura, 1 lateral, 2 barra, 3 entrepernas + gancho (aqui reto).
 */
function frenteCalca(): Piece {
  return {
    ...saiaReta(),
    cutPair: true,
    placement: { side: "frente", anchor: "cintura", offset: 0, leg: "esquerda" },
  };
}

function costasCalca(): Piece {
  return { ...frenteCalca(), id: "costas", name: "Costas", placement: { side: "costas", anchor: "cintura", offset: 0, leg: "esquerda" } };
}

/** Frente e costas de par, laterais costuradas e gancho da frente costurado no par. */
function calca(): PatternDocument {
  let doc = documento([frenteCalca(), costasCalca()]);
  doc = addSeam(doc, { piece: "frente", segment: 1 }, { piece: "costas", segment: 1 }, "same").doc;
  doc = addSeam(doc, { piece: "frente", segment: 3 }, { piece: "frente", segment: 3 }).doc;
  return doc;
}

describe("formato 4", () => {
  it("documento do formato 3 sobe para o 4 sem mudar as partes", () => {
    const v3 = { ...documento([saiaReta()]), schema: 3 };
    expect(migratePattern(v3)).toEqual({ ...v3, schema: 4 });
  });

  it("valida cortar par: não combina com dobra; costura com o próprio par só em parte de par", () => {
    expect(validatePattern(calca())).toEqual([]);
    const comDobra = documento([{ ...frenteCalca(), fold: 3 }]);
    expect(validatePattern(comDobra)).toContain("Frente: cortar par não combina com dobra.");
    const semPar: PatternDocument = { ...documento([saiaReta()]), seams: [{ id: "c1", a: { piece: "frente", segment: 3 }, b: { piece: "frente", segment: 3 }, direction: "same" }] };
    expect(validatePattern(semPar).join(" ")).toMatch(/só se costura nele mesmo numa parte de cortar par/);
    const pernaErrada = documento([{ ...frenteCalca(), placement: { side: "frente", anchor: "cintura", offset: 0, leg: "meio" as never } }]);
    expect(validatePattern(pernaErrada)).toContain("Frente: posição na Prova inválida.");
  });
});

describe("pairCopy", () => {
  it("espelha a parte, mantém o sentido do contorno e troca a perna", () => {
    const p = frenteCalca();
    const { piece: c, origin } = pairCopy(p);
    expect(c.id).toBe("frente" + PAIR_SUFFIX);
    expect(c.cutPair).toBeUndefined();
    expect(c.placement?.leg).toBe("direita");
    const area = (q: Piece) => signedArea(flattenOutline(q).polygon);
    expect(area(c)).toBeCloseTo(area(p), 6); // mesmo sentido de giro e mesma área
    // O segmento i da cópia tem o comprimento do segmento de onde veio.
    const lp = segmentLengths(p);
    segmentLengths(c).forEach((l, i) => expect(l).toBeCloseTo(lp[origin[i]!.segment]!, 9));
    // Espelho: x refletido em volta do centro (0..200 → 200..0), y igual.
    expect(c.points.B).toEqual({ x: 0, y: 0 });
    expect(c.points.D).toEqual({ x: 200, y: 600 });
    // Gradação: x com sinal trocado.
    expect(c.grading?.B?.G).toEqual({ x: -10, y: 0 });
    // Margem da barra (segmento 2) acompanha.
    const barraNaCopia = origin.findIndex((o) => o.segment === 2);
    expect(c.seamAllowanceByEdge?.[barraNaCopia]).toBe(30);
  });
});

describe("garmentAtSize com cortar par", () => {
  it("cada parte de par vira duas; lateral costurada dos dois lados e gancho liga a parte ao par", () => {
    const g = garmentAtSize(calca(), "M");
    expect(g.pieces.map((p) => p.id)).toEqual(["frente", "frente~par", "costas", "costas~par"]);
    const ids = g.seams.map((s) => s.id);
    expect(ids).toEqual(["costura1", "costura1~par", "costura2"]);
    const lateralPar = g.seams[1]!;
    expect(lateralPar.a.piece).toBe("frente~par");
    expect(lateralPar.b.piece).toBe("costas~par");
    expect(lateralPar.direction).toBe("same");
    const gancho = g.seams[2]!;
    expect([gancho.a.piece, gancho.b.piece]).toEqual(["frente", "frente~par"]);
    expect(gancho.direction).toBe("opposite"); // a cópia anda ao contrário
    // Os dois lados de cada costura têm o mesmo comprimento.
    const len = (e: { piece: string; segment: number }) => segmentLengths(g.pieces.find((p) => p.id === e.piece)!)[e.segment]!;
    for (const s of g.seams) expect(len(s.a)).toBeCloseTo(len(s.b), 9);
  });

  it("o clique na cópia do par volta para a parte do molde", () => {
    const g = garmentAtSize(calca(), "M");
    const barraNaCopia = g.origin["frente~par"]!.findIndex((o) => o.segment === 2);
    expect(patternEdgeOf(g, "frente~par", barraNaCopia)).toEqual({ piece: "frente", segment: 2 });
    expect(patternEdgeOf(g, "frente", 2)).toEqual({ piece: "frente", segment: 2 });
  });

  it("+4 cm na barra do molde alonga as duas pernas na Prova", () => {
    const depois = garmentAtSize(moveSegment(calca(), "frente", 2, 40), "M");
    const antes = garmentAtSize(calca(), "M");
    const lateral = (g: typeof antes, id: string) => {
      const p = g.pieces.find((q) => q.id === id)!;
      const i = g.origin[id]!.findIndex((o) => o.segment === 1);
      return segmentLengths(p)[i]!;
    };
    expect(lateral(depois, "frente") - lateral(antes, "frente")).toBeCloseTo(40, 6);
    expect(lateral(depois, "frente~par") - lateral(antes, "frente~par")).toBeCloseTo(40, 6);
  });
});

describe("edição com cortar par", () => {
  it("liga e desliga; desligar desfaz a costura com o par; dobra e par se excluem", () => {
    const doc = calca();
    const sem = setCutPair(doc, "frente", false);
    expect(sem.pieces[0]!.cutPair).toBeUndefined();
    expect(sem.seams.map((s) => s.id)).toEqual(["costura1"]);
    expect(setCutPair(doc, "frente", true)).toBe(doc); // já ligado
    const dobrada = setFold(documento([saiaReta()]), "frente", 3);
    expect(setCutPair(dobrada, "frente", true)).toBe(dobrada);
    expect(setFold(doc, "costas", 3)).toBe(doc);
  });

  it("costura com o próprio par só em parte de par, começo com começo por padrão", () => {
    const solta = documento([saiaReta()]);
    expect(addSeam(solta, { piece: "frente", segment: 3 }, { piece: "frente", segment: 3 }).seamId).toBeNull();
    const doc = calca();
    expect(doc.seams.find((s) => s.id === "costura2")?.direction).toBe("same");
  });

  it("a continuação da barra segue a lateral até as costas e ignora o gancho", () => {
    expect(continuationSegments(calca(), { piece: "frente", segment: 2 })).toEqual([{ piece: "costas", segment: 2 }]);
    // A cintura toca o gancho (costurado no par): do outro lado é a própria cintura.
    expect(continuationSegments(calca(), { piece: "frente", segment: 0 })).toEqual([{ piece: "costas", segment: 0 }]);
  });
});
