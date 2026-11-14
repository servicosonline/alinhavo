import type { CubicSegment, PatternDocument, Piece, Segment } from "./pattern";
import type { Point } from "./polygon";

/**
 * Operações de edição do molde. Todas são puras: recebem o documento e devolvem
 * um documento novo, sem alterar o original (o editor guarda o histórico para
 * desfazer). Quando a operação não faz sentido, devolvem o documento igual.
 */

const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const round = (v: number) => Math.round(v * 10) / 10; // décimo de mm

export function emptyDocument(sizes: string[] = ["P", "M", "G"], baseSize = "M"): PatternDocument {
  return { schema: 1, unit: "mm", sizes: [...sizes], baseSize, pieces: [] };
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

export function removePiece(doc: PatternDocument, pieceId: string): PatternDocument {
  const pieces = doc.pieces.filter((p) => p.id !== pieceId);
  return pieces.length === doc.pieces.length ? doc : { ...doc, pieces };
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
    return { ...p, outline };
  });
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
  return { doc: next, pointId: next === doc ? null : created };
}

/**
 * Apaga um ponto do contorno: os dois segmentos que o tocam viram uma reta só.
 * Recusa se a parte ficaria com menos de 3 pontos.
 */
export function removePoint(doc: PatternDocument, pieceId: string, pointId: string): PatternDocument {
  return updatePiece(doc, pieceId, (p) => {
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
    } else {
      outline = [...p.outline.slice(0, inIdx), merged, ...p.outline.slice(outIdx + 1)];
      byEdge = edgesAfterMerge(p.seamAllowanceByEdge, inIdx);
    }

    const points = { ...p.points };
    delete points[pointId];
    const piece: Piece = { ...p, points, start, outline };
    if (byEdge && Object.keys(byEdge).length) piece.seamAllowanceByEdge = byEdge;
    else delete piece.seamAllowanceByEdge;
    if (p.grading?.[pointId]) {
      const grading = { ...p.grading };
      delete grading[pointId];
      piece.grading = grading;
    }
    return piece;
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
