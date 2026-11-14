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

/**
 * Costura dois segmentos. Recusa segmento inexistente, já costurado ou
 * dobra. O mesmo segmento dos dois lados só vale em parte de cortar par:
 * costura com o par espelhado (gancho), por padrão começo com começo.
 */
export function addSeam(
  doc: PatternDocument,
  a: SeamEdge,
  b: SeamEdge,
  direction?: Seam["direction"],
): { doc: PatternDocument; seamId: string | null } {
  if (!edgeExists(doc, a) || !edgeExists(doc, b)) return { doc, seamId: null };
  const self = edgeKey(a) === edgeKey(b);
  if (self && doc.pieces.find((p) => p.id === a.piece)?.cutPair !== true) return { doc, seamId: null };
  const isFold = (e: SeamEdge) => doc.pieces.find((p) => p.id === e.piece)?.fold === e.segment;
  if (isFold(a) || isFold(b)) return { doc, seamId: null };
  if (seamAt(doc, a) || seamAt(doc, b)) return { doc, seamId: null };
  const used = new Set(doc.seams.map((s) => s.id));
  let n = 1;
  while (used.has(`costura${n}`)) n++;
  const seam: Seam = { id: `costura${n}`, a: { ...a }, b: { ...b }, direction: direction ?? (self ? "same" : "opposite") };
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

/**
 * Segmentos que "continuam" este do outro lado das costuras: quem alonga a
 * barra da frente quase sempre alonga a das costas, senão a costura lateral
 * fica com comprimentos diferentes. Para cada ponta do segmento, olha o
 * vizinho que toca a ponta; se ele é costurado, o segmento que toca a ponta
 * correspondente do outro lado da costura entra na lista, e a busca segue
 * dali. A dobra não é atravessada (a metade espelhada é o próprio segmento).
 * Não inclui o segmento de partida.
 */
export function continuationSegments(doc: PatternDocument, edge: SeamEdge): SeamEdge[] {
  const byId = new Map(doc.pieces.map((p) => [p.id, p]));
  if (!edgeExists(doc, edge)) return [];
  const seen = new Set([edgeKey(edge)]);
  const out: SeamEdge[] = [];
  const queue: SeamEdge[] = [edge];
  while (queue.length) {
    const cur = queue.shift()!;
    const n = byId.get(cur.piece)!.outline.length;
    // Vizinho que termina no começo do segmento e vizinho que sai do fim dele.
    const ends = [
      { segment: (cur.segment - 1 + n) % n, atEnd: true },
      { segment: (cur.segment + 1) % n, atEnd: false },
    ];
    for (const { segment, atEnd } of ends) {
      const neighbor = { piece: cur.piece, segment };
      const seam = seamAt(doc, neighbor);
      // Costura com o próprio par (gancho): do outro lado está o mesmo segmento do molde.
      if (!seam || edgeKey(seam.a) === edgeKey(seam.b)) continue;
      const mine = edgeKey(seam.a) === edgeKey(neighbor);
      const other = mine ? seam.b : seam.a;
      // A ponta do vizinho que toca o segmento casa com qual ponta do outro lado?
      const otherAtEnd = seam.direction === "same" ? atEnd : !atEnd;
      const m = byId.get(other.piece)!.outline.length;
      // Fim do outro lado → o segmento seguinte sai dali; começo → o anterior chega ali.
      const next = { piece: other.piece, segment: otherAtEnd ? (other.segment + 1) % m : (other.segment - 1 + m) % m };
      const key = edgeKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      if (byId.get(next.piece)!.fold === next.segment) continue;
      out.push(next);
      queue.push(next);
    }
  }
  return out;
}

export type SeamLength ={ a: number; b: number; /** a − b, em mm. */ diff: number };

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
