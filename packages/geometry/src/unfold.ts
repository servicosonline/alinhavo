import { pieceAtSize, type PatternDocument, type Piece, type Seam, type Segment } from "./pattern";
import type { Point } from "./polygon";

/**
 * Peças cortadas na dobra: o molde guarda só metade, e a peça real é essa
 * metade mais o espelho dela pela linha da dobra. Funções puras.
 */

/** Tira o "−0" que a reflexão produz (só para o documento sair limpo). */
const clean = (v: number) => v + 0;

/** De onde veio cada segmento da peça aberta: o segmento original e se é a cópia espelhada. */
export type SegmentOrigin = { segment: number; mirrored: boolean };

export type UnfoldedPiece = { piece: Piece; origin: SegmentOrigin[] };

/**
 * Abre a peça pela dobra. A peça devolvida não tem dobra; o contorno começa
 * na ponta final da dobra, percorre a metade original e volta pela metade
 * espelhada (que é percorrida ao contrário). Pontos fora da dobra ganham
 * uma cópia espelhada (id com "~"); margens, gradação e fio acompanham.
 * Sem dobra, devolve a própria peça.
 */
export function unfoldPiece(piece: Piece): UnfoldedPiece {
  const n = piece.outline.length;
  const f = piece.fold;
  const fold = f === undefined ? undefined : piece.outline[f];
  if (f === undefined || !fold || fold.kind !== "line") {
    return { piece, origin: piece.outline.map((_, i) => ({ segment: i, mirrored: false })) };
  }

  const startOf = (i: number) => (i === 0 ? piece.start : piece.outline[i - 1]!.to);
  const pId = startOf(f);
  const qId = fold.to;
  const P = piece.points[pId]!;
  const Q = piece.points[qId]!;
  const len = Math.hypot(Q.x - P.x, Q.y - P.y);
  const u = { x: (Q.x - P.x) / len, y: (Q.y - P.y) / len };
  const reflect = (X: Point): Point => {
    const dx = X.x - P.x;
    const dy = X.y - P.y;
    const t = dx * u.x + dy * u.y;
    return { x: clean(P.x + 2 * t * u.x - dx), y: clean(P.y + 2 * t * u.y - dy) };
  };
  /** Espelha um deslocamento (gradação): só a parte linear da reflexão. */
  const reflectVector = (v: Point): Point => {
    const t = v.x * u.x + v.y * u.y;
    return { x: clean(2 * t * u.x - v.x), y: clean(2 * t * u.y - v.y) };
  };

  // Ids das cópias espelhadas, sem colidir com os existentes.
  const used = new Set(Object.keys(piece.points));
  const mirrorId = new Map<string, string>([
    [pId, pId],
    [qId, qId],
  ]);
  for (const id of Object.keys(piece.points)) {
    if (mirrorId.has(id)) continue;
    let m = `${id}~`;
    while (used.has(m)) m += "~";
    used.add(m);
    mirrorId.set(id, m);
  }

  const points: Record<string, Point> = { ...piece.points };
  for (const [id, m] of mirrorId) if (m !== id) points[m] = reflect(piece.points[id]!);

  // Metade original: de Q (fim da dobra) até P (início da dobra).
  const half: number[] = [];
  for (let j = 1; j < n; j++) half.push((f + j) % n);
  const outline: Segment[] = [];
  const origin: SegmentOrigin[] = [];
  for (const k of half) {
    outline.push(piece.outline[k]!);
    origin.push({ segment: k, mirrored: false });
  }
  // Metade espelhada, ao contrário: de P de volta a Q.
  for (const k of [...half].reverse()) {
    const seg = piece.outline[k]!;
    const to = mirrorId.get(startOf(k))!;
    outline.push(seg.kind === "line" ? { kind: "line", to } : { kind: "cubic", c1: reflect(seg.c2), c2: reflect(seg.c1), to });
    origin.push({ segment: k, mirrored: true });
  }

  const unfolded: Piece = { ...piece, points, start: qId, outline };
  delete unfolded.fold;

  const byEdge: Record<number, number> = {};
  origin.forEach((o, i) => {
    const v = piece.seamAllowanceByEdge?.[o.segment];
    if (v !== undefined) byEdge[i] = v;
  });
  if (Object.keys(byEdge).length) unfolded.seamAllowanceByEdge = byEdge;
  else delete unfolded.seamAllowanceByEdge;

  if (piece.grading) {
    const grading: Record<string, Record<string, Point>> = { ...piece.grading };
    for (const [id, bySize] of Object.entries(piece.grading)) {
      const m = mirrorId.get(id);
      if (!m || m === id) continue;
      grading[m] = Object.fromEntries(Object.entries(bySize).map(([s, d]) => [s, reflectVector(d)]));
    }
    unfolded.grading = grading;
  }

  return { piece: unfolded, origin };
}

/**
 * A roupa pronta para a Prova num tamanho: as partes graduadas e abertas
 * pela dobra, e as costuras refeitas para elas. Uma costura entre dois
 * segmentos que foram espelhados vira duas (a original e a do espelho,
 * id com "~espelho"); se só um lado foi espelhado, a cópia fica sem costura.
 */
export function garmentAtSize(doc: PatternDocument, size: string): { pieces: Piece[]; seams: Seam[] } {
  const where = new Map<string, Map<number, { plain?: number; mirror?: number }>>();
  const pieces = doc.pieces.map((p) => {
    const { piece, origin } = unfoldPiece(pieceAtSize(p, size));
    const map = new Map<number, { plain?: number; mirror?: number }>();
    origin.forEach((o, i) => {
      const entry = map.get(o.segment) ?? {};
      if (o.mirrored) entry.mirror = i;
      else entry.plain = i;
      map.set(o.segment, entry);
    });
    where.set(p.id, map);
    return piece;
  });

  const seams: Seam[] = [];
  for (const seam of doc.seams) {
    const a = where.get(seam.a.piece)?.get(seam.a.segment);
    const b = where.get(seam.b.piece)?.get(seam.b.segment);
    if (a?.plain === undefined || b?.plain === undefined) continue;
    seams.push({ ...seam, a: { piece: seam.a.piece, segment: a.plain }, b: { piece: seam.b.piece, segment: b.plain } });
    if (a.mirror !== undefined && b.mirror !== undefined) {
      seams.push({
        ...seam,
        id: `${seam.id}~espelho`,
        a: { piece: seam.a.piece, segment: a.mirror },
        b: { piece: seam.b.piece, segment: b.mirror },
      });
    }
  }
  return { pieces, seams };
}
