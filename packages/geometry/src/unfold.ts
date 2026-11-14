import { pieceAtSize, type PatternDocument, type Piece, type Seam, type SeamEdge, type Segment } from "./pattern";
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
 * Em que lado do corpo fica a metade desenhada de uma peça dobrada, pela
 * posição na Prova: vista pelo lado de fora, a direita de quem olha a
 * frente é a esquerda do corpo, e a de quem olha as costas é a direita.
 * Null quando não dá para saber (sem dobra, sem posição ou peça lateral).
 */
export function drawnHalfSide(piece: Piece): "esquerda" | "direita" | null {
  const side = piece.placement?.side;
  const f = piece.fold;
  if (f === undefined || (side !== "frente" && side !== "costas")) return null;
  const from = piece.points[f === 0 ? piece.start : piece.outline[f - 1]!.to];
  const to = piece.points[piece.outline[f]!.to];
  if (!from || !to) return null;
  const foldU = (from.x + to.x) / 2;
  const pts = Object.values(piece.points);
  const s = pts.reduce((sum, p) => sum + p.x, 0) / pts.length - foldU;
  if (Math.abs(s) < 1e-6) return null;
  const towardViewerRight = s > 0;
  return side === "frente" ? (towardViewerRight ? "esquerda" : "direita") : towardViewerRight ? "direita" : "esquerda";
}

/**
 * A roupa pronta para a Prova num tamanho: as partes graduadas e abertas
 * pela dobra, e as costuras refeitas para elas. Uma costura entre dois
 * segmentos que foram espelhados vira duas, uma em cada lado do corpo (id
 * com "~espelho" na segunda): cada cópia é ligada à do mesmo lado do corpo
 * (`drawnHalfSide`). Se só um lado foi espelhado, a cópia fica sem costura.
 *
 * `origin[pieceId][i]` diz de qual segmento do molde veio o segmento i da
 * peça aberta: é o caminho de volta de um clique na Prova para o molde.
 */
export function garmentAtSize(doc: PatternDocument, size: string): Garment {
  const where = new Map<string, Map<number, { plain?: number; mirror?: number }>>();
  const drawnSide = new Map(doc.pieces.map((p) => [p.id, drawnHalfSide(p)]));
  const origins: Record<string, SegmentOrigin[]> = {};
  const pieces = doc.pieces.map((p) => {
    const { piece, origin } = unfoldPiece(pieceAtSize(p, size));
    origins[p.id] = origin;
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
    if (a.mirror === undefined || b.mirror === undefined) {
      seams.push({ ...seam, a: { piece: seam.a.piece, segment: a.plain }, b: { piece: seam.b.piece, segment: b.plain } });
      continue;
    }
    // As metades desenhadas estão em lados opostos do corpo: cruza as cópias.
    // A cópia espelhada é percorrida ao contrário, então cruzar inverte o sentido.
    const sideA = drawnSide.get(seam.a.piece);
    const sideB = drawnSide.get(seam.b.piece);
    const cross = !!sideA && !!sideB && sideA !== sideB;
    const direction: Seam["direction"] = cross ? (seam.direction === "same" ? "opposite" : "same") : seam.direction;
    seams.push({
      ...seam,
      direction,
      a: { piece: seam.a.piece, segment: a.plain },
      b: { piece: seam.b.piece, segment: cross ? b.mirror : b.plain },
    });
    seams.push({
      ...seam,
      id: `${seam.id}~espelho`,
      direction,
      a: { piece: seam.a.piece, segment: a.mirror },
      b: { piece: seam.b.piece, segment: cross ? b.plain : b.mirror },
    });
  }
  return { pieces, seams, origin: origins };
}

export type Garment = { pieces: Piece[]; seams: Seam[]; origin: Record<string, SegmentOrigin[]> };

/** O segmento do molde de onde veio o segmento `segment` da peça aberta `pieceId`. */
export function patternEdgeOf(garment: Garment, pieceId: string, segment: number): SeamEdge | null {
  const o = garment.origin[pieceId]?.[segment];
  return o ? { piece: pieceId, segment: o.segment } : null;
}
