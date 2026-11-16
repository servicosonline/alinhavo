import { finishExtras, finishShapes, mapFinishShape, type GarmentFinish } from "./finishes";
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

/**
 * `reflect`: o espelho usado na metade espelhada (dobra) ou na cópia (par),
 * nas coordenadas da parte; ausente quando a parte não tem dobra.
 */
export type UnfoldedPiece = { piece: Piece; origin: SegmentOrigin[]; reflect?: (p: Point) => Point; fold?: FoldLine };

/** A linha da dobra de uma peça aberta (eixo de simetria), nas coordenadas da peça. */
export type FoldLine = { from: Point; to: Point };

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

  return { piece: unfolded, origin, reflect, fold: { from: { ...P }, to: { ...Q } } };
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

/** Sufixo do id da cópia espelhada de uma parte de cortar par. */
export const PAIR_SUFFIX = "~par";

/**
 * A segunda peça de um cortar par: a parte espelhada (x → −x em volta do
 * centro), percorrida ao contrário para manter o sentido do contorno. O
 * segmento i da cópia veio do segmento `origin[i].segment` da parte. Na
 * Prova ela veste o outro lado: a perna da posição é trocada.
 */
export function pairCopy(piece: Piece): UnfoldedPiece {
  const n = piece.outline.length;
  const xs = Object.values(piece.points).map((p) => p.x);
  const c = (Math.min(...xs) + Math.max(...xs)) / 2;
  const reflect = (X: Point): Point => ({ x: clean(2 * c - X.x), y: X.y });
  const startOf = (i: number) => (i === 0 ? piece.start : piece.outline[i - 1]!.to);

  const points: Record<string, Point> = {};
  for (const [id, p] of Object.entries(piece.points)) points[id] = reflect(p);

  // Ao contrário: o segmento k (de A a B) vira de B' a A'; as alças trocam de lugar.
  const outline: Segment[] = [];
  const origin: SegmentOrigin[] = [];
  for (let k = n - 1; k >= 0; k--) {
    const seg = piece.outline[k]!;
    const to = startOf(k);
    outline.push(seg.kind === "line" ? { kind: "line", to } : { kind: "cubic", c1: reflect(seg.c2), c2: reflect(seg.c1), to });
    origin.push({ segment: k, mirrored: true });
  }

  const copy: Piece = { ...piece, id: piece.id + PAIR_SUFFIX, name: `${piece.name} (par)`, points, start: piece.start, outline };
  delete copy.cutPair;
  const byEdge: Record<number, number> = {};
  origin.forEach((o, i) => {
    const v = piece.seamAllowanceByEdge?.[o.segment];
    if (v !== undefined) byEdge[i] = v;
  });
  if (Object.keys(byEdge).length) copy.seamAllowanceByEdge = byEdge;
  else delete copy.seamAllowanceByEdge;
  if (piece.grading) {
    copy.grading = Object.fromEntries(
      Object.entries(piece.grading).map(([id, bySize]) => [
        id,
        Object.fromEntries(Object.entries(bySize).map(([size, d]) => [size, { x: clean(-d.x), y: d.y }])),
      ]),
    );
  }
  if (piece.grainline) copy.grainline = { from: reflect(piece.grainline.to), to: reflect(piece.grainline.from) };
  const other = (side: "esquerda" | "direita") => (side === "esquerda" ? "direita" : "esquerda");
  if (piece.placement?.leg) copy.placement = { ...piece.placement, leg: other(piece.placement.leg) };
  if (piece.placement?.arm) copy.placement = { ...(copy.placement ?? piece.placement), arm: other(piece.placement.arm) };
  return { piece: copy, origin, reflect };
}

/**
 * A roupa pronta para a Prova num tamanho: as partes graduadas, abertas
 * pela dobra e com o par das partes de cortar par, e as costuras refeitas
 * para elas.
 *
 * - Dobra: uma costura entre dois segmentos espelhados vira duas, uma em
 *   cada lado do corpo (id com "~espelho" na segunda); cada cópia é ligada
 *   à do mesmo lado do corpo (`drawnHalfSide`). Se só um lado foi
 *   espelhado, a cópia fica sem costura.
 * - Parte de par que veste um membro (`placement.arm` ou `leg`) com parte na
 *   dobra (manga na cava do corpo): a parte e o par são costurados cada um na
 *   metade aberta do mesmo lado do corpo.
 * - Cortar par: costura entre duas partes de par vira duas, parte com parte
 *   e par com par (id com "~par"); costura do segmento com ele mesmo liga a
 *   parte ao seu par (gancho). Entre uma parte de par e outra sem par nem
 *   dobra (ou sem membro), só a parte desenhada é costurada.
 *
 * `origin[pieceId][i]` diz de qual segmento do molde veio o segmento i da
 * peça da Prova, e `source[pieceId]` de qual parte do molde (a cópia do par
 * tem outro id): é o caminho de volta de um clique na Prova.
 */
export function garmentAtSize(doc: PatternDocument, size: string): Garment {
  const where = new Map<string, Map<number, { plain?: number; mirror?: number }>>();
  const pairWhere = new Map<string, Map<number, number>>();
  const drawnSide = new Map(doc.pieces.map((p) => [p.id, drawnHalfSide(p)]));
  /** Lado do corpo do membro que a parte de par veste (braço ou perna da posição). */
  const memberSide = new Map(doc.pieces.map((p) => [p.id, p.placement?.arm ?? p.placement?.leg ?? null]));
  const origins: Record<string, SegmentOrigin[]> = {};
  const source: Record<string, string> = {};
  const foldLine: Record<string, FoldLine> = {};
  const pieces: Piece[] = [];
  const finishes: GarmentFinish[] = [];
  for (const p of doc.pieces) {
    const graded = pieceAtSize(p, size);
    const { piece: opened, origin, reflect, fold } = unfoldPiece(graded);
    if (fold) foldLine[p.id] = fold;
    // A peça da Prova não leva a lista de acabamentos (os índices de segmento mudaram).
    const { finishes: _own, ...piece } = opened;
    // Acabamentos: desenhados na parte (no tamanho); a peça aberta não os leva
    // na lista (os índices de segmento mudaram), vão prontos em `finishes`.
    const shapes = finishShapes(graded);
    for (const shape of shapes) {
      finishes.push({ piece: p.id, finishId: shape.id, shape, mirrored: false, ...finishExtras(graded, shape.id) });
      // Pesponto e zíper seguem a borda nas duas metades; etiqueta e estampa ficam uma vez
      // (o retângulo posto sobre a dobra já cobre as duas metades da peça aberta).
      if (reflect && (shape.kind === "pesponto" || shape.kind === "ziper")) {
        finishes.push({ piece: p.id, finishId: shape.id, shape: mapFinishShape(shape, reflect, true), mirrored: true });
      }
    }
    origins[p.id] = origin;
    source[p.id] = p.id;
    const map = new Map<number, { plain?: number; mirror?: number }>();
    origin.forEach((o, i) => {
      const entry = map.get(o.segment) ?? {};
      if (o.mirrored) entry.mirror = i;
      else entry.plain = i;
      map.set(o.segment, entry);
    });
    where.set(p.id, map);
    pieces.push(piece);
    if (p.cutPair && p.fold === undefined) {
      const pair = pairCopy(graded);
      origins[pair.piece.id] = pair.origin;
      source[pair.piece.id] = p.id;
      pairWhere.set(p.id, new Map(pair.origin.map((o, i) => [o.segment, i])));
      const { finishes: _pairOwn, ...pairPiece } = pair.piece;
      // O par leva tudo, espelhado (é a outra peça cortada).
      for (const shape of shapes) {
        finishes.push({
          piece: pairPiece.id,
          finishId: shape.id,
          shape: mapFinishShape(shape, pair.reflect!, true),
          mirrored: true,
          ...finishExtras(graded, shape.id),
        });
      }
      pieces.push(pairPiece);
    }
  }

  const seams: Seam[] = [];
  for (const seam of doc.seams) {
    const a = where.get(seam.a.piece)?.get(seam.a.segment);
    const b = where.get(seam.b.piece)?.get(seam.b.segment);
    if (a?.plain === undefined || b?.plain === undefined) continue;
    const pairA = pairWhere.get(seam.a.piece)?.get(seam.a.segment);
    const pairB = pairWhere.get(seam.b.piece)?.get(seam.b.segment);

    // Segmento costurado no próprio par (gancho): a cópia anda ao contrário,
    // então o sentido gravado no molde se inverte.
    if (seam.a.piece === seam.b.piece && seam.a.segment === seam.b.segment) {
      if (pairA !== undefined) {
        seams.push({
          ...seam,
          direction: seam.direction === "same" ? "opposite" : "same",
          a: { piece: seam.a.piece, segment: a.plain },
          b: { piece: seam.a.piece + PAIR_SUFFIX, segment: pairA },
        });
      }
      continue;
    }

    if (pairA !== undefined && pairB !== undefined) {
      // As duas cópias andam ao contrário: o sentido da costura se mantém.
      seams.push({ ...seam, a: { piece: seam.a.piece, segment: a.plain }, b: { piece: seam.b.piece, segment: b.plain } });
      seams.push({
        ...seam,
        id: seam.id + PAIR_SUFFIX,
        a: { piece: seam.a.piece + PAIR_SUFFIX, segment: pairA },
        b: { piece: seam.b.piece + PAIR_SUFFIX, segment: pairB },
      });
      continue;
    }

    // Parte de par (que veste um membro: manga, perna) com parte na dobra (o corpo):
    // cada cópia do par é costurada na metade aberta do mesmo lado do corpo.
    if ((pairA !== undefined) !== (pairB !== undefined)) {
      const pairIsA = pairA !== undefined;
      const pairEdge = pairIsA ? seam.a : seam.b;
      const foldEdge = pairIsA ? seam.b : seam.a;
      const pairPos = (pairIsA ? a : b).plain!;
      const pairCopySeg = (pairIsA ? pairA : pairB)!;
      const fold = pairIsA ? b : a;
      const limbSide = memberSide.get(pairEdge.piece);
      const foldSide = drawnSide.get(foldEdge.piece);
      if (limbSide && foldSide && fold.mirror !== undefined && fold.plain !== undefined) {
        const flip = (d: Seam["direction"]): Seam["direction"] => (d === "same" ? "opposite" : "same");
        const sameHalf = foldSide === limbSide;
        // Cópia espelhada da dobra e cópia do par andam ao contrário: cada uma inverte o sentido.
        // Parte com a metade desenhada (nenhuma invertida) ou cópia com a espelhada (as duas): mantém.
        // Cruzado (só uma invertida): inverte.
        const edges = [
          { pair: { piece: pairEdge.piece, segment: pairPos }, fold: sameHalf ? fold.plain : fold.mirror, direction: sameHalf ? seam.direction : flip(seam.direction), id: seam.id },
          {
            pair: { piece: pairEdge.piece + PAIR_SUFFIX, segment: pairCopySeg },
            fold: sameHalf ? fold.mirror : fold.plain,
            direction: sameHalf ? seam.direction : flip(seam.direction),
            id: seam.id + PAIR_SUFFIX,
          },
        ];
        for (const e of edges) {
          const foldSeam = { piece: foldEdge.piece, segment: e.fold };
          seams.push({ ...seam, id: e.id, direction: e.direction, a: pairIsA ? e.pair : foldSeam, b: pairIsA ? foldSeam : e.pair });
        }
        continue;
      }
    }

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
  return { pieces, seams, origin: origins, source, finishes, foldLine };
}

export type Garment = {
  pieces: Piece[];
  seams: Seam[];
  origin: Record<string, SegmentOrigin[]>;
  /** Parte do molde de onde veio cada peça da Prova (a cópia do par tem id próprio). */
  source: Record<string, string>;
  /** Acabamentos nas coordenadas de cada peça da Prova (as peças devolvidas não têm `finishes`). */
  finishes: GarmentFinish[];
  /**
   * Linha da dobra de cada peça aberta (só as que tinham dobra): a peça é
   * simétrica por ela. A malha da Prova usa como eixo, para sair simétrica.
   */
  foldLine: Record<string, FoldLine>;
};

/** O segmento do molde de onde veio o segmento `segment` da peça da Prova `pieceId`. */
export function patternEdgeOf(garment: Pick<Garment, "origin" | "source">, pieceId: string, segment: number): SeamEdge | null {
  const o = garment.origin[pieceId]?.[segment];
  const piece = garment.source[pieceId];
  return o && piece ? { piece, segment: o.segment } : null;
}
