import { describe, expect, it } from "vitest";
import { addFinish } from "./finishes";
import { documento, saiaReta } from "./fixtures";
import { garmentAtSize } from "./unfold";
import type { Piece } from "./pattern";
import type { Point } from "./polygon";

/** Ponto na fração t de um segmento reto da peça. */
function at(piece: Piece, segment: number, t: number): Point {
  const a = piece.points[segment === 0 ? piece.start : piece.outline[segment - 1]!.to]!;
  const b = piece.points[piece.outline[segment]!.to]!;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Saia com zíper nos primeiros 30% da lateral (segmento 1, de B para C). */
function comZiper(piece: Piece) {
  const r = addFinish(documento([piece]), piece.id, { kind: "ziper", segment: 1, from: 0, to: 0.3 });
  if (!r.finishId) throw new Error("zíper não entrou");
  return { doc: r.doc, id: r.finishId };
}

describe("trecho do zíper nas peças da Prova", () => {
  it("parte sem dobra nem par: o trecho do molde, no mesmo segmento", () => {
    const { doc, id } = comZiper(saiaReta());
    const g = garmentAtSize(doc, "M");
    expect(g.openings).toEqual([{ finishId: id, piece: "frente", segment: 1, from: 0, to: 0.3 }]);
  });

  it("parte na dobra: o zíper nas duas metades, a espelhada ao contrário e no lugar espelhado", () => {
    const p = saiaReta();
    p.fold = 3; // centro da frente
    delete p.seamAllowanceByEdge;
    const { doc } = comZiper(p);
    const g = garmentAtSize(doc, "M");
    expect(g.openings).toHaveLength(2);
    const piece = g.pieces[0]!;
    const [plain, mirror] = g.openings;
    expect(mirror!.from).toBeCloseTo(0.7, 9);
    expect(mirror!.to).toBeCloseTo(1, 9);
    // O começo do zíper (alto da lateral) é o mesmo ponto nas duas metades, espelhado pelo centro (x = 0).
    const top = at(piece, plain!.segment, plain!.from);
    const topMirror = at(piece, mirror!.segment, mirror!.to);
    expect(topMirror.x).toBeCloseTo(-top.x, 6);
    expect(topMirror.y).toBeCloseTo(top.y, 6);
    const end = at(piece, plain!.segment, plain!.to);
    const endMirror = at(piece, mirror!.segment, mirror!.from);
    expect(endMirror.y).toBeCloseTo(end.y, 6);
  });

  it("cortar par: a cópia leva o zíper ao contrário, na mesma altura", () => {
    const p = saiaReta();
    p.cutPair = true;
    const { doc } = comZiper(p);
    const g = garmentAtSize(doc, "M");
    expect(g.openings.map((o) => o.piece)).toEqual(["frente", "frente~par"]);
    const copy = g.pieces.find((q) => q.id === "frente~par")!;
    const [plain, pair] = g.openings;
    expect(at(copy, pair!.segment, pair!.to).y).toBeCloseTo(at(g.pieces[0]!, plain!.segment, plain!.from).y, 6);
    expect(at(copy, pair!.segment, pair!.from).y).toBeCloseTo(at(g.pieces[0]!, plain!.segment, plain!.to).y, 6);
  });

  it("sem zíper, sem trecho", () => {
    expect(garmentAtSize(documento([saiaReta()]), "M").openings).toEqual([]);
  });
});
