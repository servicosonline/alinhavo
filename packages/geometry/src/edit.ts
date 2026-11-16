import { flattenOutline, type CubicSegment, type PatternDocument, type Piece, type PiecePlacement, type Segment } from "./pattern";
import { distance, signedArea, type Point } from "./polygon";
import { dropFinishesAt, remapFinishes } from "./finishes";
import { dropPieceSeams, remapSeams } from "./seams";

/**
 * Operações de edição do molde. Todas são puras: recebem o documento e devolvem
 * um documento novo, sem alterar o original (o editor guarda o histórico para
 * desfazer). Quando a operação não faz sentido, devolvem o documento igual.
 */

const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const round = (v: number) => Math.round(v * 10) / 10; // décimo de mm

export function emptyDocument(sizes: string[] = ["P", "M", "G"], baseSize = "M"): PatternDocument {
  return { schema: 6, unit: "mm", sizes: [...sizes], baseSize, pieces: [], seams: [] };
}

function updatePiece(doc: PatternDocument, pieceId: string, fn: (p: Piece) => Piece | null): PatternDocument {
  let changed = false;
  const pieces = doc.pieces.map((p) => {
    if (p.id !== pieceId) return p;
    const next = fn(p);
    if (!next || next === p) return p;
    changed = true;
    return next;
  });
  return changed ? { ...doc, pieces } : doc;
}

function nextId(existing: Iterable<string>, prefix: string): string {
  const used = new Set(existing);
  let n = 1;
  while (used.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

/** Ponto de onde sai o segmento i. */
export function segmentStart(piece: Piece, index: number): string {
  return index === 0 ? piece.start : piece.outline[index - 1]!.to;
}

// ---------------------------------------------------------------------------
// Partes
// ---------------------------------------------------------------------------

export type NewPiece = { name: string; width: number; height: number; origin?: Point; seamAllowance?: number };

/** Acrescenta uma parte retangular (o ponto de partida de quase todo molde). Devolve o id criado. */
export function addRectPiece(doc: PatternDocument, spec: NewPiece): { doc: PatternDocument; pieceId: string } {
  const { x, y } = spec.origin ?? { x: 0, y: 0 };
  const w = Math.max(1, spec.width);
  const h = Math.max(1, spec.height);
  const id = nextId(
    doc.pieces.map((p) => p.id),
    "parte",
  );
  const piece: Piece = {
    id,
    name: spec.name.trim() || "Parte",
    points: { P1: { x, y }, P2: { x: x + w, y }, P3: { x: x + w, y: y + h }, P4: { x, y: y + h } },
    start: "P1",
    outline: [
      { kind: "line", to: "P2" },
      { kind: "line", to: "P3" },
      { kind: "line", to: "P4" },
      { kind: "line", to: "P1" },
    ],
    seamAllowance: spec.seamAllowance ?? 10,
  };
  return { doc: { ...doc, pieces: [...doc.pieces, piece] }, pieceId: id };
}

/** Apaga a parte e as costuras que a tocam. */
export function removePiece(doc: PatternDocument, pieceId: string): PatternDocument {
  const pieces = doc.pieces.filter((p) => p.id !== pieceId);
  return pieces.length === doc.pieces.length ? doc : dropPieceSeams({ ...doc, pieces }, pieceId);
}

export function renamePiece(doc: PatternDocument, pieceId: string, name: string): PatternDocument {
  const clean = name.trim();
  if (!clean) return doc;
  return updatePiece(doc, pieceId, (p) => (p.name === clean ? p : { ...p, name: clean }));
}

export function setSeamAllowance(doc: PatternDocument, pieceId: string, mm: number): PatternDocument {
  if (!Number.isFinite(mm) || mm < 0 || mm > 100) return doc;
  return updatePiece(doc, pieceId, (p) => ({ ...p, seamAllowance: round(mm) }));
}

/** Margem própria de um segmento. `null` volta para a margem padrão da parte. */
export function setEdgeSeamAllowance(doc: PatternDocument, pieceId: string, index: number, mm: number | null): PatternDocument {
  return updatePiece(doc, pieceId, (p) => {
    if (index < 0 || index >= p.outline.length) return null;
    const byEdge = { ...(p.seamAllowanceByEdge ?? {}) };
    if (mm === null) delete byEdge[index];
    else if (Number.isFinite(mm) && mm >= 0 && mm <= 100) byEdge[index] = round(mm);
    else return null;
    const next: Piece = { ...p, seamAllowanceByEdge: byEdge };
    if (Object.keys(byEdge).length === 0) delete next.seamAllowanceByEdge;
    return next;
  });
}

// ---------------------------------------------------------------------------
// Pontos e segmentos
// ---------------------------------------------------------------------------

/** Move um ponto. As alças das curvas que tocam o ponto andam junto (como no papel). */
export function movePoint(doc: PatternDocument, pieceId: string, pointId: string, to: Point): PatternDocument {
  return updatePiece(doc, pieceId, (p) => {
    const from = p.points[pointId];
    if (!from || !Number.isFinite(to.x) || !Number.isFinite(to.y)) return null;
    const target = { x: round(to.x), y: round(to.y) };
    const d = { x: target.x - from.x, y: target.y - from.y };
    if (d.x === 0 && d.y === 0) return null;
    const outline = p.outline.map((seg, i): Segment => {
      if (seg.kind !== "cubic") return seg;
      const startsHere = segmentStart(p, i) === pointId;
      const endsHere = seg.to === pointId;
      if (!startsHere && !endsHere) return seg;
      return {
        ...seg,
        c1: startsHere ? { x: seg.c1.x + d.x, y: seg.c1.y + d.y } : seg.c1,
        c2: endsHere ? { x: seg.c2.x + d.x, y: seg.c2.y + d.y } : seg.c2,
      };
    });
    return { ...p, points: { ...p.points, [pointId]: target }, outline };
  });
}

export function moveHandle(
  doc: PatternDocument,
  pieceId: string,
  index: number,
  handle: "c1" | "c2",
  to: Point,
): PatternDocument {
  return updatePiece(doc, pieceId, (p) => {
    const seg = p.outline[index];
    if (!seg || seg.kind !== "cubic" || !Number.isFinite(to.x) || !Number.isFinite(to.y)) return null;
    const outline = [...p.outline];
    outline[index] = { ...seg, [handle]: { x: round(to.x), y: round(to.y) } };
    return { ...p, outline };
  });
}

/** Reta vira curva (alças a 1/3 e 2/3) e curva vira reta. */
export function toggleCurve(doc: PatternDocument, pieceId: string, index: number): PatternDocument {
  return updatePiece(doc, pieceId, (p) => {
    const seg = p.outline[index];
    if (!seg) return null;
    const outline = [...p.outline];
    if (seg.kind === "cubic") {
      outline[index] = { kind: "line", to: seg.to };
    } else {
      const a = p.points[segmentStart(p, index)]!;
      const b = p.points[seg.to]!;
      const r = (q: Point) => ({ x: round(q.x), y: round(q.y) });
      outline[index] = { kind: "cubic", c1: r(lerp(a, b, 1 / 3)), c2: r(lerp(a, b, 2 / 3)), to: seg.to };
    }
    const next: Piece = { ...p, outline };
    if (p.fold === index) delete next.fold; // dobra só em reta
    return next;
  });
}

// ---------------------------------------------------------------------------
// Dobra e posição na Prova
// ---------------------------------------------------------------------------

/**
 * Marca (ou desmarca, com null) o segmento da dobra. Recusa segmento que não
 * existe, curvo ou costurado (a dobra não é borda do tecido).
 */
export function setFold(doc: PatternDocument, pieceId: string, index: number | null): PatternDocument {
  if (index !== null && doc.seams.some((s) => [s.a, s.b].some((e) => e.piece === pieceId && e.segment === index))) return doc;
  return updatePiece(doc, pieceId, (p) => {
    if (index === null) {
      if (p.fold === undefined) return null;
      const next = { ...p };
      delete next.fold;
      return next;
    }
    if (p.outline[index]?.kind !== "line" || p.fold === index || p.cutPair) return null;
    return { ...p, fold: index };
  });
}

/**
 * Liga ou desliga "cortar par" (a segunda peça é o espelho). Recusa parte
 * com dobra. Desligar desfaz as costuras do segmento com o próprio par.
 */
export function setCutPair(doc: PatternDocument, pieceId: string, on: boolean): PatternDocument {
  const piece = doc.pieces.find((p) => p.id === pieceId);
  if (!piece || !!piece.cutPair === on || (on && piece.fold !== undefined)) return doc;
  const next = updatePiece(doc, pieceId, (p) => {
    if (on) return { ...p, cutPair: true };
    const q = { ...p };
    delete q.cutPair;
    return q;
  });
  if (on) return next;
  const seams = next.seams.filter((s) => !(s.a.piece === pieceId && s.b.piece === pieceId && s.a.segment === s.b.segment));
  return seams.length === next.seams.length ? next : { ...next, seams };
}

/** Posição da parte na Prova; null tira. */
export function setPlacement(doc: PatternDocument, pieceId: string, placement: PiecePlacement | null): PatternDocument {
  return updatePiece(doc, pieceId, (p) => {
    if (placement === null) {
      if (!p.placement) return null;
      const next = { ...p };
      delete next.placement;
      return next;
    }
    if (!Number.isFinite(placement.offset) || Math.abs(placement.offset) > 1000) return null;
    return { ...p, placement: { ...placement, offset: round(placement.offset) } };
  });
}

/** Índice da dobra depois de uma renumeração (null some com ela). */
function remapFold(p: Piece, map: (i: number) => number | null): Piece {
  if (p.fold === undefined) return p;
  const to = map(p.fold);
  if (to === p.fold) return p;
  const next = { ...p };
  if (to === null) delete next.fold;
  else next.fold = to;
  return next;
}

/** Margens por segmento depois de dividir o segmento `index` em dois: as duas metades herdam a margem. */
function edgesAfterSplit(byEdge: Record<number, number> | undefined, index: number) {
  if (!byEdge) return undefined;
  const out: Record<number, number> = {};
  for (const [k, v] of Object.entries(byEdge)) {
    const i = Number(k);
    if (i < index) out[i] = v;
    else if (i === index) {
      out[i] = v;
      out[i + 1] = v;
    } else out[i + 1] = v;
  }
  return out;
}

/**
 * Margens depois de juntar os segmentos `index` e `index + 1` numa reta.
 * Se os dois tinham a mesma margem própria, a reta fica com ela (inserir e
 * apagar um ponto não muda nada); se eram diferentes, volta à margem padrão.
 */
function edgesAfterMerge(byEdge: Record<number, number> | undefined, index: number) {
  if (!byEdge) return undefined;
  const out: Record<number, number> = {};
  for (const [k, v] of Object.entries(byEdge)) {
    const i = Number(k);
    if (i < index) out[i] = v;
    else if (i > index + 1) out[i - 1] = v;
  }
  const a = byEdge[index];
  if (a !== undefined && a === byEdge[index + 1]) out[index] = a;
  return out;
}

/**
 * Insere um ponto no segmento i, na posição t (0 a 1), dividindo-o em dois.
 * Curvas são divididas sem mudar o desenho. As duas metades herdam a margem
 * do segmento original, e a gradação do ponto novo é a interpolação das pontas.
 * Uma costura nesse segmento é desfeita (cada metade tem outro comprimento);
 * as demais costuras da parte acompanham a nova numeração.
 */
export function splitSegment(
  doc: PatternDocument,
  pieceId: string,
  index: number,
  t = 0.5,
): { doc: PatternDocument; pointId: string | null } {
  let created: string | null = null;
  const next = updatePiece(doc, pieceId, (p) => {
    const seg = p.outline[index];
    if (!seg || !(t > 0 && t < 1)) return null;
    const fromId = segmentStart(p, index);
    const a = p.points[fromId]!;
    const b = p.points[seg.to]!;
    const id = nextId(Object.keys(p.points), "P");
    created = id;
    const r = (q: Point) => ({ x: round(q.x), y: round(q.y) });

    let first: Segment;
    let second: Segment;
    let mid: Point;
    if (seg.kind === "line") {
      mid = r(lerp(a, b, t));
      first = { kind: "line", to: id };
      second = { kind: "line", to: seg.to };
    } else {
      // de Casteljau
      const p01 = lerp(a, seg.c1, t);
      const p12 = lerp(seg.c1, seg.c2, t);
      const p23 = lerp(seg.c2, b, t);
      const p012 = lerp(p01, p12, t);
      const p123 = lerp(p12, p23, t);
      mid = r(lerp(p012, p123, t));
      first = { kind: "cubic", c1: r(p01), c2: r(p012), to: id } satisfies CubicSegment;
      second = { kind: "cubic", c1: r(p123), c2: r(p23), to: seg.to } satisfies CubicSegment;
    }

    const outline = [...p.outline.slice(0, index), first, second, ...p.outline.slice(index + 1)];

    const seamAllowanceByEdge = edgesAfterSplit(p.seamAllowanceByEdge, index);

    let grading = p.grading;
    if (grading) {
      const ga = grading[fromId] ?? {};
      const gb = grading[seg.to] ?? {};
      const sizes = new Set([...Object.keys(ga), ...Object.keys(gb)]);
      if (sizes.size > 0) {
        const g: Record<string, Point> = {};
        for (const s of sizes) g[s] = r(lerp(ga[s] ?? { x: 0, y: 0 }, gb[s] ?? { x: 0, y: 0 }, t));
        grading = { ...grading, [id]: g };
      }
    }

    const piece: Piece = { ...p, points: { ...p.points, [id]: mid }, outline };
    if (seamAllowanceByEdge && Object.keys(seamAllowanceByEdge).length) piece.seamAllowanceByEdge = seamAllowanceByEdge;
    else delete piece.seamAllowanceByEdge;
    if (grading) piece.grading = grading;
    return piece;
  });
  if (next === doc) return { doc, pointId: null };
  const map = (i: number) => (i < index ? i : i === index ? null : i + 1);
  // Dobra, acabamentos e costuras acompanham a nova numeração (o segmento dividido os desfaz).
  const withFold = updatePiece(next, pieceId, (p) => remapFinishes(remapFold(p, map), map));
  return { doc: remapSeams(withFold, pieceId, map), pointId: created };
}

/**
 * Apaga um ponto do contorno: os dois segmentos que o tocam viram uma reta só.
 * Recusa se a parte ficaria com menos de 3 pontos. Costuras nesses dois
 * segmentos são desfeitas; as demais acompanham a nova numeração.
 */
export function removePoint(doc: PatternDocument, pieceId: string, pointId: string): PatternDocument {
  // `as`: atribuída dentro do callback, então o TS não pode estreitar para null aqui.
  let segmentMap = null as ((i: number) => number | null) | null;
  const next = updatePiece(doc, pieceId, (p) => {
    const n = p.outline.length;
    if (!(pointId in p.points) || n <= 3) return null;
    const inIdx = p.outline.findIndex((s) => s.to === pointId); // segmento que chega no ponto
    if (inIdx < 0) return null;
    const outIdx = (inIdx + 1) % n; // segmento que sai do ponto
    const merged: Segment = { kind: "line", to: p.outline[outIdx]!.to };

    let outline: Segment[];
    let start = p.start;
    let byEdge: Record<number, number> | undefined;
    if (outIdx === 0) {
      // o ponto apagado é o inicial: o último segmento passa a terminar no novo início
      start = p.outline[0]!.to;
      outline = [...p.outline.slice(1, n - 1), { kind: "line", to: start }];
      byEdge = {};
      const own = p.seamAllowanceByEdge ?? {};
      for (const [k, v] of Object.entries(own)) {
        const i = Number(k);
        if (i === 0 || i === n - 1) continue;
        byEdge[i - 1] = v;
      }
      // o último e o primeiro segmento viraram a reta de fechamento (índice n - 2)
      const first = own[0];
      if (first !== undefined && own[n - 1] === first) byEdge[n - 2] = first;
      segmentMap = (i) => (i === 0 || i === n - 1 ? null : i - 1);
    } else {
      outline = [...p.outline.slice(0, inIdx), merged, ...p.outline.slice(outIdx + 1)];
      byEdge = edgesAfterMerge(p.seamAllowanceByEdge, inIdx);
      segmentMap = (i) => (i < inIdx ? i : i === inIdx || i === outIdx ? null : i - 1);
    }

    const points = { ...p.points };
    delete points[pointId];
    // Etiqueta ou estampa presa ao ponto apagado sai junto.
    const piece: Piece = { ...dropFinishesAt(p, pointId), points, start, outline };
    if (byEdge && Object.keys(byEdge).length) piece.seamAllowanceByEdge = byEdge;
    else delete piece.seamAllowanceByEdge;
    if (p.grading?.[pointId]) {
      const grading = { ...p.grading };
      delete grading[pointId];
      piece.grading = grading;
    }
    return piece;
  });
  if (next === doc || !segmentMap) return next;
  const map = segmentMap;
  return remapSeams(
    updatePiece(next, pieceId, (p) => remapFinishes(remapFold(p, map), map)),
    pieceId,
    map,
  );
}

/**
 * Desloca o segmento `index` para fora (mm positivo) ou para dentro (negativo)
 * da peça, perpendicular à corda dele: é o "+4 cm na barra" da Prova.
 *
 * - Vizinho reto: a ponta escorrega ao longo dele (a lateral de uma saia
 *   evasê cresce no mesmo ângulo; a ponta na dobra continua na dobra).
 * - Vizinho curvo, ou reto quase paralelo ao segmento: a ponta translada, e
 *   a alça da curva vizinha anda junto (como em `movePoint`).
 * - Gradação, margens e costuras não mudam: o ajuste vale para a grade toda.
 *
 * Recusa a dobra, deslocamento zero ou acima de 1 m, e o que viraria a peça
 * do avesso (encurtar mais do que o vizinho mede).
 */
export function moveSegment(doc: PatternDocument, pieceId: string, index: number, mm: number): PatternDocument {
  if (!Number.isFinite(mm) || mm === 0 || Math.abs(mm) > 1000) return doc;
  return updatePiece(doc, pieceId, (p) => {
    const n = p.outline.length;
    const seg = p.outline[index];
    if (!seg || n < 3 || p.fold === index) return null;
    const startId = segmentStart(p, index);
    const endId = seg.to;
    const a = p.points[startId]!;
    const b = p.points[endId]!;
    const len = distance(a, b);
    const orient = Math.sign(signedArea(flattenOutline(p).polygon));
    if (len < 1e-6 || startId === endId || orient === 0) return null;
    // Normal para fora: com área positiva (anti-horário nas coordenadas do molde), fica à direita do sentido.
    const normal = { x: ((b.y - a.y) / len) * orient, y: (-(b.x - a.x) / len) * orient };

    /** Nova posição da ponta `at`, ligada pelo vizinho a `other`. Null = recusa. */
    const shift = (at: Point, neighbor: Segment, otherId: string, isFold: boolean): Point | null => {
      if (neighbor.kind === "line") {
        const o = p.points[otherId]!;
        const l = distance(o, at);
        if (l > 1e-6) {
          const dir = { x: (at.x - o.x) / l, y: (at.y - o.y) / l };
          const k = dir.x * normal.x + dir.y * normal.y;
          if (Math.abs(k) >= 0.2) {
            const s = mm / k;
            if (l + s < 1) return null; // passaria do outro ponto do vizinho
            return { x: round(at.x + dir.x * s), y: round(at.y + dir.y * s) };
          }
        }
      }
      if (isFold) return null; // transladar tiraria a ponta da dobra
      return { x: round(at.x + normal.x * mm), y: round(at.y + normal.y * mm) };
    };

    const prevIdx = (index - 1 + n) % n;
    const nextIdx = (index + 1) % n;
    const prev = p.outline[prevIdx]!; // termina em startId
    const next = p.outline[nextIdx]!; // sai de endId
    const a2 = shift(a, prev, segmentStart(p, prevIdx), p.fold === prevIdx);
    const b2 = shift(b, next, next.to, p.fold === nextIdx);
    if (!a2 || !b2 || distance(a2, b2) < 1) return null;
    const da = { x: a2.x - a.x, y: a2.y - a.y };
    const db = { x: b2.x - b.x, y: b2.y - b.y };
    const mv = (q: Point, d: Point): Point => ({ x: round(q.x + d.x), y: round(q.y + d.y) });

    const outline = p.outline.map((s, i): Segment => {
      if (s.kind !== "cubic") return s;
      if (i === index) return { ...s, c1: mv(s.c1, da), c2: mv(s.c2, db) };
      if (i === prevIdx) return { ...s, c2: mv(s.c2, da) };
      if (i === nextIdx) return { ...s, c1: mv(s.c1, db) };
      return s;
    });
    const moved: Piece = { ...p, points: { ...p.points, [startId]: a2, [endId]: b2 }, outline };
    // Não deixa a peça virar do avesso nem sumir.
    const area = signedArea(flattenOutline(moved).polygon);
    if (Math.sign(area) !== orient || Math.abs(area) < 1) return null;
    return moved;
  });
}

/** Move a parte inteira (pontos, alças e fio) pelo deslocamento `d`. */
export function translatePiece(doc: PatternDocument, pieceId: string, d: Point): PatternDocument {
  if (!Number.isFinite(d.x) || !Number.isFinite(d.y) || (d.x === 0 && d.y === 0)) return doc;
  const dx = round(d.x);
  const dy = round(d.y);
  const mv = (p: Point): Point => ({ x: round(p.x + dx), y: round(p.y + dy) });
  return updatePiece(doc, pieceId, (p) => {
    const points: Record<string, Point> = {};
    for (const [id, q] of Object.entries(p.points)) points[id] = mv(q);
    const outline = p.outline.map((s): Segment => (s.kind === "cubic" ? { ...s, c1: mv(s.c1), c2: mv(s.c2) } : s));
    const next: Piece = { ...p, points, outline };
    if (p.grainline) next.grainline = { from: mv(p.grainline.from), to: mv(p.grainline.to) };
    return next;
  });
}
