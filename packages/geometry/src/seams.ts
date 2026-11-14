import { pieceAtSize, segmentLengths, type PatternDocument, type Seam, type SeamEdge } from "./pattern";

/**
 * Costuras do molde: pares de segmentos que se unem na Prova. Operações
 * puras, como as de `edit.ts`: devolvem documento novo, ou o mesmo quando a
 * operação não faz sentido.
 */

const edgeKey = (e: SeamEdge) => `${e.piece}#${e.segment}`;

function edgeExists(doc: PatternDocument, e: SeamEdge): boolean {
  const piece = doc.pieces.find((p) => p.id === e.piece);
  return !!piece && Number.isInteger(e.segment) && e.segment >= 0 && e.segment < piece.outline.length;
}

/** A costura que usa este segmento, se houver. */
export function seamAt(doc: PatternDocument, edge: SeamEdge): Seam | undefined {
  const key = edgeKey(edge);
  return doc.seams.find((s) => edgeKey(s.a) === key || edgeKey(s.b) === key);
}

/** Costura dois segmentos. Recusa segmento inexistente, repetido ou já costurado. */
export function addSeam(
  doc: PatternDocument,
  a: SeamEdge,
  b: SeamEdge,
  direction: Seam["direction"] = "opposite",
): { doc: PatternDocument; seamId: string | null } {
  if (!edgeExists(doc, a) || !edgeExists(doc, b) || edgeKey(a) === edgeKey(b)) return { doc, seamId: null };
  const isFold = (e: SeamEdge) => doc.pieces.find((p) => p.id === e.piece)?.fold === e.segment;
  if (isFold(a) || isFold(b)) return { doc, seamId: null };
  if (seamAt(doc, a) || seamAt(doc, b)) return { doc, seamId: null };
  const used = new Set(doc.seams.map((s) => s.id));
  let n = 1;
  while (used.has(`costura${n}`)) n++;
  const seam: Seam = { id: `costura${n}`, a: { ...a }, b: { ...b }, direction };
  return { doc: { ...doc, seams: [...doc.seams, seam] }, seamId: seam.id };
}

/** Troca o sentido da costura (oposto ↔ mesmo). */
export function flipSeam(doc: PatternDocument, seamId: string): PatternDocument {
  if (!doc.seams.some((s) => s.id === seamId)) return doc;
  return {
    ...doc,
    seams: doc.seams.map((s) => (s.id === seamId ? { ...s, direction: s.direction === "opposite" ? "same" : "opposite" } : s)),
  };
}

export function removeSeam(doc: PatternDocument, seamId: string): PatternDocument {
  const seams = doc.seams.filter((s) => s.id !== seamId);
  return seams.length === doc.seams.length ? doc : { ...doc, seams };
}

/**
 * Ajusta as costuras de uma parte depois de uma edição que renumerou os
 * segmentos dela. `map` leva o índice antigo ao novo; `null` desfaz a
 * costura (o segmento sumiu ou mudou de comprimento por divisão).
 */
export function remapSeams(
  doc: PatternDocument,
  pieceId: string,
  map: (segment: number) => number | null,
): PatternDocument {
  let changed = false;
  const seams: Seam[] = [];
  for (const seam of doc.seams) {
    const move = (e: SeamEdge): SeamEdge | null => {
      if (e.piece !== pieceId) return e;
      const to = map(e.segment);
      return to === null ? null : to === e.segment ? e : { ...e, segment: to };
    };
    const a = move(seam.a);
    const b = move(seam.b);
    if (!a || !b) {
      changed = true;
      continue;
    }
    if (a !== seam.a || b !== seam.b) changed = true;
    seams.push(a === seam.a && b === seam.b ? seam : { ...seam, a, b });
  }
  return changed ? { ...doc, seams } : doc;
}

/** Tira as costuras que tocam a parte (ao apagá-la). */
export function dropPieceSeams(doc: PatternDocument, pieceId: string): PatternDocument {
  return remapSeams(doc, pieceId, () => null);
}

export type SeamLength = { a: number; b: number; /** a − b, em mm. */ diff: number };

/**
 * Comprimento dos dois lados de cada costura, em mm, no tamanho pedido (ou
 * no base). Para avisar quando um lado é maior que o outro (franzido ou erro).
 */
export function seamLengths(doc: PatternDocument, size = doc.baseSize): Map<string, SeamLength> {
  const lengths = new Map<string, number[]>();
  for (const piece of doc.pieces) lengths.set(piece.id, segmentLengths(pieceAtSize(piece, size)));
  const out = new Map<string, SeamLength>();
  for (const seam of doc.seams) {
    const a = lengths.get(seam.a.piece)?.[seam.a.segment];
    const b = lengths.get(seam.b.piece)?.[seam.b.segment];
    if (a === undefined || b === undefined) continue;
    out.set(seam.id, { a, b, diff: a - b });
  }
  return out;
}
