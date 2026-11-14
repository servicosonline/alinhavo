import type { Piece, Point, Segment } from "@alinhavo/geometry";

/**
 * Do contorno do papel (polígono denso em mm, papel à direita de quem anda,
 * Y para baixo) para uma parte de molde editável:
 *   1. reamostra a cada `SPACING` e suaviza a escada dos pixels;
 *   2. acha os piques (entalhes em V de 2 a 12 mm) e fecha o contorno por
 *      cima deles, guardando a posição;
 *   3. acha os cantos (virada forte e local);
 *   4. entre cantos e piques, reta se for reta, senão curvas Bézier
 *      ajustadas por mínimos quadrados (dividindo onde o erro passa da
 *      tolerância).
 * Os piques viram pontos nomeados "pique1", "pique2"… no contorno: o formato
 * do molde ainda não tem marca de pique própria.
 */

export const SPACING = 0.5; // mm
const LINE_TOL = 0.4; // mm: desvio máximo para virar reta
const CURVE_TOL = 0.5; // mm: erro máximo de cada curva
const CORNER_ANGLE = (32 * Math.PI) / 180;
const CORNER_REACH = 5; // mm de cada lado para medir a virada

export type ShapeResult = {
  piece: Piece;
  /** Piques achados (posição na boca do entalhe, em mm, nas coordenadas da parte). */
  piques: Point[];
  /** Cantos achados, mm. */
  corners: Point[];
};

const sub = (a: Point, b: Point) => ({ x: a.x - b.x, y: a.y - b.y });
const len = (a: Point) => Math.hypot(a.x, a.y);
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Reamostra um polígono fechado com espaçamento constante. */
export function resampleClosed(poly: readonly Point[], spacing: number): Point[] {
  const n = poly.length;
  const perimeter = poly.reduce((s, p, i) => s + dist(p, poly[(i + 1) % n]!), 0);
  const count = Math.max(8, Math.round(perimeter / spacing));
  const step = perimeter / count;
  const out: Point[] = [];
  let seg = 0;
  let segStart = 0;
  let segLen = dist(poly[0]!, poly[1 % n]!);
  for (let k = 0; k < count; k++) {
    const target = k * step;
    while (segStart + segLen < target && seg < n - 1) {
      segStart += segLen;
      seg++;
      segLen = dist(poly[seg]!, poly[(seg + 1) % n]!);
    }
    out.push(lerp(poly[seg]!, poly[(seg + 1) % n]!, segLen > 0 ? (target - segStart) / segLen : 0));
  }
  return out;
}

function smoothClosed(p: Point[], radius: number, passes: number): Point[] {
  let cur = p;
  const n = p.length;
  for (let pass = 0; pass < passes; pass++) {
    const next: Point[] = new Array(n);
    for (let i = 0; i < n; i++) {
      let sx = 0;
      let sy = 0;
      for (let k = -radius; k <= radius; k++) {
        const q = cur[(i + k + n) % n]!;
        sx += q.x;
        sy += q.y;
      }
      next[i] = { x: sx / (2 * radius + 1), y: sy / (2 * radius + 1) };
    }
    cur = next;
  }
  return cur;
}

/** Distância com sinal ao lado de dentro (direita de a→b, Y para baixo). */
const insideDistance = (a: Point, b: Point, p: Point) => {
  const d = sub(b, a);
  const l = len(d) || 1;
  return (-(d.y) * (p.x - a.x) + d.x * (p.y - a.y)) / l;
};

type Notch = { i: number; j: number; mouth: Point };

/** Entalhes em V: boca estreita, caminho longo, fundo para dentro do papel. */
function findNotches(p: Point[]): Notch[] {
  const n = p.length;
  const minSteps = Math.round(3 / SPACING);
  const maxSteps = Math.round(30 / SPACING);
  const found: (Notch & { chord: number; depth: number })[] = [];
  for (let i = 0; i < n; i++) {
    for (let s = minSteps; s <= maxSteps; s++) {
      const j = (i + s) % n;
      const chord = dist(p[i]!, p[j]!);
      if (chord > 8 || chord < 0.8) continue;
      if ((s * SPACING) / chord < 2) continue;
      let depth = -Infinity;
      let lowest = Infinity;
      for (let k = 1; k < s; k++) {
        const d = insideDistance(p[i]!, p[j]!, p[(i + k) % n]!);
        depth = Math.max(depth, d);
        lowest = Math.min(lowest, d);
      }
      if (depth < 2 || depth > 12 || lowest < -0.8) continue;
      found.push({ i, j, mouth: lerp(p[i]!, p[j]!, 0.5), chord, depth });
      break; // o menor caminho a partir de i
    }
  }
  // Candidatos do mesmo entalhe: a boca de verdade é a do entalhe inteiro
  // (o mais fundo; uma corda dentro do V é mais rasa) e, entre os
  // empatados, a mais estreita (cordas por fora pegam a borda reta).
  found.sort((a, b) => b.depth - a.depth);
  const taken: Notch[] = [];
  const covered = new Uint8Array(n);
  const span = (a: number, b: number) => (b - a + n) % n;
  const overlaps = (a: Notch, b: Notch) => {
    const inside = (k: number, c: Notch) => span(c.i, k) <= span(c.i, c.j);
    return inside(a.i, b) || inside(a.j, b) || inside(b.i, a) || inside(b.j, a);
  };
  for (const c of found) {
    if (covered[c.i] || covered[c.j]) continue;
    for (const o of found.filter((x) => overlaps(x, c))) for (let k = 0; k <= span(o.i, o.j); k++) covered[(o.i + k) % n] = 1;
    taken.push(refineNotch(p, c));
  }
  return taken;
}

/**
 * A boca de verdade de um entalhe achado: a linha da borda (ajustada nos
 * pontos de 1 a 6 mm de cada lado, fora do entalhe) e, a partir do ponto
 * mais fundo, os pontos onde o contorno volta a essa linha. O pique fica na
 * projeção do fundo sobre a linha.
 */
function refineNotch(p: Point[], c: Notch): Notch {
  const n = p.length;
  const s = (c.j - c.i + n) % n;
  let deepest = c.i;
  let best = -Infinity;
  for (let k = 1; k < s; k++) {
    const v = insideDistance(p[c.i]!, p[c.j]!, p[(c.i + k) % n]!);
    if (v > best) {
      best = v;
      deepest = (c.i + k) % n;
    }
  }
  const near = Math.round(1 / SPACING);
  const far = Math.round(6 / SPACING);
  const side: Point[] = [];
  for (let k = near; k <= far; k++) side.push(p[(c.i - k + n) % n]!, p[(c.j + k) % n]!);
  const base = fitLine(side);
  const off = (q: Point) => Math.abs((q.x - base.p.x) * base.d.y - (q.y - base.p.y) * base.d.x);
  const limit = Math.round(30 / SPACING);
  let a = deepest;
  for (let k = 0; k < limit && off(p[a]!) > 0.35; k++) a = (a - 1 + n) % n;
  let b = deepest;
  for (let k = 0; k < limit && off(p[b]!) > 0.35; k++) b = (b + 1) % n;
  const q = p[deepest]!;
  const t = (q.x - base.p.x) * base.d.x + (q.y - base.p.y) * base.d.y;
  return { i: a, j: b, mouth: { x: base.p.x + t * base.d.x, y: base.p.y + t * base.d.y } };
}

/** Ângulo da virada em i (0 = reto), olhando `reach` pontos para cada lado. */
function turn(p: Point[], i: number, reach: number): number {
  const n = p.length;
  const a = sub(p[i]!, p[(i - reach + n) % n]!);
  const b = sub(p[(i + reach) % n]!, p[i]!);
  const c = (a.x * b.x + a.y * b.y) / ((len(a) || 1) * (len(b) || 1));
  return Math.acos(Math.max(-1, Math.min(1, c)));
}

/** Reta pelos pontos (mínimos quadrados): ponto médio e direção. */
function fitLine(points: Point[]): { p: Point; d: Point } {
  const cx = points.reduce((s, q) => s + q.x, 0) / points.length;
  const cy = points.reduce((s, q) => s + q.y, 0) / points.length;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const q of points) {
    sxx += (q.x - cx) ** 2;
    sxy += (q.x - cx) * (q.y - cy);
    syy += (q.y - cy) ** 2;
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return { p: { x: cx, y: cy }, d: { x: Math.cos(angle), y: Math.sin(angle) } };
}

function lineIntersection(a: { p: Point; d: Point }, b: { p: Point; d: Point }): Point | null {
  const det = a.d.x * b.d.y - a.d.y * b.d.x;
  if (Math.abs(det) < 0.2) return null; // quase paralelas: o canto é suave
  const t = ((b.p.x - a.p.x) * b.d.y - (b.p.y - a.p.y) * b.d.x) / det;
  return { x: a.p.x + t * a.d.x, y: a.p.y + t * a.d.y };
}

function findCorners(p: Point[], blocked: Uint8Array): number[] {
  const n = p.length;
  const reach = Math.round(CORNER_REACH / SPACING);
  const angles = p.map((_, i) => turn(p, i, reach));
  const corners: number[] = [];
  for (let i = 0; i < n; i++) {
    if (blocked[i] || angles[i]! < CORNER_ANGLE) continue;
    let isMax = true;
    for (let k = -reach; k <= reach && isMax; k++) {
      if (k === 0) continue;
      const v = angles[(i + k + n) % n]!;
      if (v > angles[i]! || (v === angles[i]! && k < 0)) isMax = false;
    }
    if (isMax) corners.push(i);
  }
  return corners;
}

type Fitted = { segs: { kind: "line" } | { kind: "cubic"; c1: Point; c2: Point }; to: Point }[];

/** Bézier cúbica com pontas fixas pelos pontos (mínimos quadrados, t pelo comprimento da corda). */
function fitCubic(q: Point[]): { c1: Point; c2: Point; error: number; worst: number } {
  const p0 = q[0]!;
  const p3 = q[q.length - 1]!;
  const ts = [0];
  for (let i = 1; i < q.length; i++) ts.push(ts[i - 1]! + dist(q[i - 1]!, q[i]!));
  const total = ts[ts.length - 1]! || 1;
  let a11 = 0;
  let a12 = 0;
  let a22 = 0;
  let bx1 = 0;
  let by1 = 0;
  let bx2 = 0;
  let by2 = 0;
  const basis = ts.map((t0) => {
    const t = t0 / total;
    const u = 1 - t;
    return [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const;
  });
  q.forEach((pt, i) => {
    const [b0, b1, b2, b3] = basis[i]!;
    const rx = pt.x - b0 * p0.x - b3 * p3.x;
    const ry = pt.y - b0 * p0.y - b3 * p3.y;
    a11 += b1 * b1;
    a12 += b1 * b2;
    a22 += b2 * b2;
    bx1 += b1 * rx;
    by1 += b1 * ry;
    bx2 += b2 * rx;
    by2 += b2 * ry;
  });
  const det = a11 * a22 - a12 * a12;
  let c1: Point;
  let c2: Point;
  if (Math.abs(det) < 1e-12) {
    c1 = lerp(p0, p3, 1 / 3);
    c2 = lerp(p0, p3, 2 / 3);
  } else {
    c1 = { x: (bx1 * a22 - bx2 * a12) / det, y: (by1 * a22 - by2 * a12) / det };
    c2 = { x: (a11 * bx2 - a12 * bx1) / det, y: (a11 * by2 - a12 * by1) / det };
  }
  let error = 0;
  let worst = Math.floor(q.length / 2);
  q.forEach((pt, i) => {
    const [b0, b1, b2, b3] = basis[i]!;
    const e = Math.hypot(b0 * p0.x + b1 * c1.x + b2 * c2.x + b3 * p3.x - pt.x, b0 * p0.y + b1 * c1.y + b2 * c2.y + b3 * p3.y - pt.y);
    if (e > error) {
      error = e;
      worst = i;
    }
  });
  return { c1, c2, error, worst };
}

function maxChordDeviation(q: Point[]): number {
  const a = q[0]!;
  const b = q[q.length - 1]!;
  return q.reduce((m, pt) => Math.max(m, Math.abs(insideDistance(a, b, pt))), 0);
}

/** Trecho entre dois pontos fixos: reta, uma curva, ou curvas divididas onde o erro é maior. */
function fitSpan(q: Point[], depth = 0): Fitted {
  const end = q[q.length - 1]!;
  if (q.length <= 3 || maxChordDeviation(q) <= LINE_TOL) return [{ segs: { kind: "line" }, to: end }];
  const fit = fitCubic(q);
  if (fit.error <= CURVE_TOL || depth >= 6 || q.length < 12) return [{ segs: { kind: "cubic", c1: fit.c1, c2: fit.c2 }, to: end }];
  const k = Math.max(4, Math.min(q.length - 5, fit.worst));
  return [...fitSpan(q.slice(0, k + 1), depth + 1), ...fitSpan(q.slice(k), depth + 1)];
}

/**
 * A parte de molde a partir do contorno em mm. `name` é o nome da parte;
 * a margem fica 0 (o contorno do papel vira a linha de costura) e o fio,
 * sem marcar: a modelista confere no editor.
 */
export function outlineToPiece(boundary: readonly Point[], name = "Peça escaneada"): ShapeResult {
  if (boundary.length < 4) throw new Error("Contorno pequeno demais.");
  let p = smoothClosed(resampleClosed(boundary, SPACING), 2, 2);
  const n = p.length;

  // Piques: fecha a boca do entalhe com uma reta.
  const notches = findNotches(p);
  const blocked = new Uint8Array(n);
  const reach = Math.round(CORNER_REACH / SPACING);
  for (const notch of notches) {
    const s = (notch.j - notch.i + n) % n;
    for (let k = 1; k < s; k++) p[(notch.i + k) % n] = lerp(p[notch.i]!, p[notch.j]!, k / s);
    // A boca não é canto.
    for (let k = -reach; k <= s + reach; k++) blocked[(notch.i + k + n) % n] = 1;
  }

  // Cantos, com a posição refinada pelo cruzamento das retas de cada lado.
  const cornerIdx = findCorners(p, blocked);
  const cornerPos = new Map<number, Point>();
  for (const i of cornerIdx) {
    const before = Array.from({ length: 2 * reach }, (_, k) => p[(i - Math.round(reach / 2) - k + 2 * n) % n]!);
    const after = Array.from({ length: 2 * reach }, (_, k) => p[(i + Math.round(reach / 2) + k) % n]!);
    const hit = maxChordDeviation(before) < 0.3 && maxChordDeviation(after) < 0.3 ? lineIntersection(fitLine(before), fitLine(after)) : null;
    cornerPos.set(i, hit && dist(hit, p[i]!) < 3 ? hit : p[i]!);
  }

  // Pontos fixos do contorno: cantos e piques (na boca), em ordem.
  type Anchor = { i: number; kind: "corner" | "pique"; at: Point };
  const anchors: Anchor[] = [
    ...cornerIdx.map((i) => ({ i, kind: "corner" as const, at: cornerPos.get(i)! })),
    ...notches.map((nt) => {
      const s = (nt.j - nt.i + n) % n;
      const i = (nt.i + Math.round(s / 2)) % n;
      return { i, kind: "pique" as const, at: nt.mouth };
    }),
  ].sort((a, b) => a.i - b.i);
  if (anchors.length === 0) for (let k = 0; k < 4; k++) anchors.push({ i: Math.round((k * n) / 4) % n, kind: "corner", at: p[Math.round((k * n) / 4) % n]! });
  if (anchors.length === 1) {
    const i = (anchors[0]!.i + Math.round(n / 2)) % n;
    anchors.push({ i, kind: "corner", at: p[i]! });
    anchors.sort((a, b) => a.i - b.i);
  }
  for (const a of anchors) p[a.i] = a.at;

  // Origem no canto da caixa da parte.
  const minX = Math.min(...p.map((q) => q.x));
  const minY = Math.min(...p.map((q) => q.y));
  const shift = (q: Point) => ({ x: Math.round((q.x - minX) * 100) / 100, y: Math.round((q.y - minY) * 100) / 100 });

  const names: string[] = [];
  let piqueCount = 0;
  let pointCount = 0;
  const points: Record<string, Point> = {};
  const outline: Segment[] = [];
  const nameFor = (kind: "corner" | "pique" | "smooth") => (kind === "pique" ? `pique${++piqueCount}` : `p${++pointCount}`);

  for (const a of anchors) {
    const id = nameFor(a.kind);
    names.push(id);
    points[id] = shift(a.at);
  }
  anchors.forEach((a, k) => {
    const b = anchors[(k + 1) % anchors.length]!;
    const s = (b.i - a.i + n) % n || n;
    const span = Array.from({ length: s + 1 }, (_, m) => p[(a.i + m) % n]!);
    const fitted = fitSpan(span);
    fitted.forEach((f, m) => {
      const last = m === fitted.length - 1;
      let to = names[(k + 1) % anchors.length]!;
      if (!last) {
        to = nameFor("smooth");
        points[to] = shift(f.to);
      }
      if (f.segs.kind === "line") outline.push({ kind: "line", to });
      else outline.push({ kind: "cubic", c1: shift(f.segs.c1), c2: shift(f.segs.c2), to });
    });
  });

  const piece: Piece = { id: "scan", name, points, start: names[0]!, outline, seamAllowance: 0 };
  return {
    piece,
    piques: anchors.filter((a) => a.kind === "pique").map((a) => shift(a.at)),
    corners: anchors.filter((a) => a.kind === "corner").map((a) => shift(a.at)),
  };
}
