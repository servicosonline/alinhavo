import Constrainautor from "@kninnug/constrainautor";
import Delaunator from "delaunator";
import { distance, flattenOutline, pieceAtSize, signedArea, type Piece, type Point } from "@alinhavo/geometry";

/**
 * Malha triangular de uma parte do molde, para a simulação do tecido (Prova).
 *
 * A malha cobre a LINHA DE COSTURA (a peça pronta): a margem fica dobrada
 * para dentro e não entra na simulação. Tudo em milímetros, nas coordenadas
 * do molde (Y para baixo).
 *
 * Os vértices 0..boundaryCount-1 são a borda, em ordem, começando no ponto
 * inicial da parte. Cada um guarda de qual segmento do contorno veio e a
 * posição relativa nele (t de 0 a 1): é por aí que as costuras vão juntar
 * as bordas de duas partes.
 */
export type PieceMesh = {
  pieceId: string;
  /** x, y de cada vértice, em mm. */
  positions: Float64Array;
  /** Três índices de vértice por triângulo, todos com área positiva (signedArea > 0). */
  triangles: Uint32Array;
  /** Quantos vértices iniciais são a borda. */
  boundaryCount: number;
  /** Segmento do contorno (índice em piece.outline) de cada vértice da borda. */
  boundarySegment: Int32Array;
  /** Posição do vértice da borda no seu segmento, de 0 (início) a 1 (exclusivo). */
  boundaryT: Float64Array;
  /** Área de repouso de cada triângulo, em mm². */
  restArea: Float64Array;
  /**
   * Coordenadas no fio de cada vértice, em mm: [urdume, trama]. O urdume
   * corre ao longo do fio; a trama, perpendicular a ele.
   */
  grainCoords: Float64Array;
  /** Direção do fio (vetor unitário) usada na malha. */
  grain: Point;
  /** Arestas únicas, em pares de índices (i < j). */
  edges: Uint32Array;
};

export type MeshOptions = {
  /** Tamanho da grade (gera a parte já graduada). Sem ele, usa a parte como está. */
  size?: string;
  /** Distância alvo entre vértices, em mm. Padrão: 10. */
  spacing?: number;
  /**
   * Eixo de simetria da parte (a linha da dobra de uma peça aberta, em
   * `Garment.foldLine`): os pontos internos saem de uma metade e do espelho
   * dela, e a malha fica simétrica. Sem ele, a grade parte do canto da caixa
   * e as duas metades saem diferentes: na Prova, a roupa assenta torta.
   */
  mirror?: { from: Point; to: Point };
};

const MIN_SPACING = 2;
const MAX_SPACING = 100;
/** Pontos internos mais perto da borda que isso (× espaçamento) são descartados. */
const BORDER_CLEARANCE = 0.55;

/** Gera a malha triangular de uma parte do molde. */
export function meshPiece(source: Piece, options: MeshOptions = {}): PieceMesh {
  const spacing = options.spacing ?? 10;
  if (!(spacing >= MIN_SPACING && spacing <= MAX_SPACING)) {
    throw new Error(`O espaçamento da malha precisa ficar entre ${MIN_SPACING} e ${MAX_SPACING} mm.`);
  }
  const piece = options.size ? pieceAtSize(source, options.size) : source;

  const border = resampleBorder(piece, spacing);
  if (border.points.length < 3 || Math.abs(signedArea(border.points)) < spacing * spacing) {
    throw new Error(`A parte "${piece.name}" é pequena demais para a malha.`);
  }

  const grain = grainDirection(piece);
  const nb = border.points.length;
  const axis = options.mirror ? mirrorAxis(options.mirror) : null;
  // Com eixo: uma fileira de pontos sobre a dobra, presa como arestas. Nenhum
  // triângulo atravessa o eixo (um trapézio simétrico tem os quatro cantos no
  // mesmo círculo e a diagonal sairia de um lado só).
  const chain = axis ? axisChain(axis, border.points, spacing) : { points: [], edges: [] };
  const fixed = nb + chain.points.length;
  const points = [...border.points, ...chain.points, ...latticeInside(border.points, grain, spacing, axis)];
  const edges = chain.edges.map(([a, b]) => [a < 0 ? -a - 1 : nb + a, b < 0 ? -b - 1 : nb + b] as [number, number]);
  smoothBand(points, fixed, triangulate(points, nb, edges), border.points, spacing);

  const coords = new Float64Array(points.length * 2);
  points.forEach((p, i) => {
    coords[i * 2] = p.x;
    coords[i * 2 + 1] = p.y;
  });
  const triangles = Uint32Array.from(triangulate(points, nb, edges));
  const restArea = new Float64Array(triangles.length / 3);
  for (let k = 0; k < restArea.length; k++) {
    // cross() dá o dobro da área do triângulo.
    restArea[k] = cross(points[triangles[k * 3]!]!, points[triangles[k * 3 + 1]!]!, points[triangles[k * 3 + 2]!]!) / 2;
  }

  const grainCoords = new Float64Array(points.length * 2);
  points.forEach((p, i) => {
    grainCoords[i * 2] = p.x * grain.x + p.y * grain.y;
    grainCoords[i * 2 + 1] = -p.x * grain.y + p.y * grain.x;
  });

  return {
    pieceId: piece.id,
    positions: coords,
    triangles,
    boundaryCount: nb,
    boundarySegment: Int32Array.from(border.segment),
    boundaryT: Float64Array.from(border.t),
    restArea,
    grainCoords,
    grain,
    edges: uniqueEdges(triangles),
  };
}

type Border = { points: Point[]; segment: number[]; t: number[] };

/**
 * Reamostra a linha de costura segmento a segmento, com pontos a cada
 * ~spacing mm. O início de cada segmento (um ponto do molde) é sempre
 * vértice, então as quinas se mantêm.
 */
function resampleBorder(piece: Piece, spacing: number): Border {
  const { polygon, edgeSegment } = flattenOutline(piece);
  const n = polygon.length;
  const border: Border = { points: [], segment: [], t: [] };
  if (n < 3) return border;

  // Agrupa as arestas consecutivas de cada segmento numa polilinha.
  let k = 0;
  while (k < n) {
    const seg = edgeSegment[k]!;
    const line: Point[] = [polygon[k]!];
    while (k < n && edgeSegment[k] === seg) {
      line.push(polygon[(k + 1) % n]!);
      k++;
    }
    const lengths = [0];
    for (let i = 1; i < line.length; i++) lengths.push(lengths[i - 1]! + distance(line[i - 1]!, line[i]!));
    const total = lengths.at(-1)!;
    const count = Math.max(1, Math.round(total / spacing));
    let j = 0;
    for (let s = 0; s < count; s++) {
      const target = (total * s) / count;
      while (j < line.length - 2 && lengths[j + 1]! < target) j++;
      const span = lengths[j + 1]! - lengths[j]!;
      const u = span > 0 ? (target - lengths[j]!) / span : 0;
      const a = line[j]!;
      const b = line[j + 1]!;
      border.points.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
      border.segment.push(seg);
      border.t.push(s / count);
    }
  }
  return border;
}

/** Direção do fio da parte; sem fio marcado, vertical (ao longo do comprimento). */
function grainDirection(piece: Piece): Point {
  const g = piece.grainline;
  if (g) {
    const len = distance(g.from, g.to);
    if (len > 1e-9) return { x: (g.to.x - g.from.x) / len, y: (g.to.y - g.from.y) / len };
  }
  return { x: 0, y: 1 };
}

/**
 * Pontos internos numa grade de triângulos equiláteros alinhada ao fio:
 * fileiras ao longo do urdume, deslocadas meia casa a cada fileira.
 *
 * Com eixo, a grade passa pelo meio da dobra e só a metade do lado positivo
 * é usada: a outra é o espelho dela (vale para qualquer ângulo do fio). Os
 * pontos sobre o eixo vêm de `axisChain`; os que ficariam colados nele, não entram.
 */
function latticeInside(border: Point[], grain: Point, spacing: number, axis: MirrorAxis | null): Point[] {
  const across = { x: -grain.y, y: grain.x };
  const along = (p: Point) => p.x * grain.x + p.y * grain.y;
  const side = (p: Point) => p.x * across.x + p.y * across.y;
  const us = border.map(along);
  const vs = border.map(side);
  const [u0, u1] = [Math.min(...us), Math.max(...us)];
  const [v0, v1] = [Math.min(...vs), Math.max(...vs)];

  const rowGap = (spacing * Math.sqrt(3)) / 2;
  const clearance = spacing * BORDER_CLEARANCE;
  // Ponto da grade: sem eixo, o canto da caixa; com eixo, o meio da dobra.
  const anchor = axis ? { u: along(axis.mid), v: side(axis.mid) } : { u: u0, v: v0 };
  // Primeira fileira e primeira casa dentro da caixa (sem eixo: exatamente v0 e u0).
  const firstRow = Math.ceil((v0 - anchor.v) / rowGap - 1e-9);
  const fits = (p: Point) => insidePolygon(p, border) && distanceToBorder(p, border) >= clearance;
  const out: Point[] = [];
  for (let row = firstRow; anchor.v + row * rowGap <= v1; row++) {
    const v = anchor.v + row * rowGap;
    const offset = Math.abs(row) % 2 === 0 ? 0 : spacing / 2;
    const start = anchor.u + offset + Math.ceil((u0 - anchor.u - offset) / spacing - 1e-9) * spacing;
    for (let u = start; u <= u1; u += spacing) {
      const p = { x: u * grain.x + v * across.x, y: u * grain.y + v * across.y };
      if (!axis) {
        if (fits(p)) out.push(p);
        continue;
      }
      // Do lado negativo, perto do eixo ou sobre ele, nada: o espelho e a fileira do eixo cobrem.
      if (axis.distance(p) < spacing * AXIS_CLEARANCE) continue;
      const q = axis.reflect(p);
      if (fits(p) && fits(q)) out.push(p, q);
    }
  }
  return out;
}

/** Pontos do lado positivo mais perto do eixo que isso (× espaçamento) ficam de fora. */
const AXIS_CLEARANCE = 0.3;

type MirrorAxis = ReturnType<typeof mirrorAxis>;

function mirrorAxis({ from, to }: { from: Point; to: Point }) {
  const len = distance(from, to);
  if (!(len > 1e-9)) throw new Error("O eixo de simetria da malha precisa de dois pontos diferentes.");
  const d = { x: (to.x - from.x) / len, y: (to.y - from.y) / len };
  const along = (p: Point) => (p.x - from.x) * d.x + (p.y - from.y) * d.y;
  return {
    from,
    to,
    length: len,
    mid: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
    /** Distância com sinal (positiva à esquerda de from → to, em Y para baixo). */
    distance: (p: Point) => (p.x - from.x) * -d.y + (p.y - from.y) * d.x,
    reflect: (p: Point) => {
      const t = along(p);
      return { x: 2 * (from.x + t * d.x) - p.x, y: 2 * (from.y + t * d.y) - p.y };
    },
  };
}

/**
 * Pontos sobre o eixo, a ~spacing uns dos outros, e as arestas que os ligam
 * em fileira de uma ponta da dobra à outra. Nas arestas, índice negativo
 * `-(i + 1)` é o vértice i da borda (as pontas da dobra são vértices dela);
 * não negativo, o ponto da fileira.
 */
function axisChain(axis: MirrorAxis, border: Point[], spacing: number): { points: Point[]; edges: [number, number][] } {
  const clearance = spacing * BORDER_CLEARANCE;
  const onBorder = (p: Point) => border.findIndex((b) => distance(b, p) < 1e-6 * spacing);
  const count = Math.max(1, Math.round(axis.length / spacing));
  const points: Point[] = [];
  const chain: number[] = [];
  const first = onBorder(axis.from);
  if (first >= 0) chain.push(-first - 1);
  for (let k = 1; k < count; k++) {
    const t = k / count;
    const p = { x: axis.from.x + (axis.to.x - axis.from.x) * t, y: axis.from.y + (axis.to.y - axis.from.y) * t };
    if (!insidePolygon(p, border) || distanceToBorder(p, border) < clearance) continue;
    chain.push(points.length);
    points.push(p);
  }
  const last = onBorder(axis.to);
  if (last >= 0) chain.push(-last - 1);
  const edges: [number, number][] = [];
  for (let k = 1; k < chain.length; k++) edges.push([chain[k - 1]!, chain[k]!]);
  return { points, edges };
}

/**
 * Triangulação de Delaunay com a borda (vértices 0..nb-1, em ordem) e as
 * arestas `extra` forçadas. Devolve só os triângulos de dentro da peça, todos
 * com área positiva.
 */
/**
 * Deslocamento dos pontos da borda (mm) na segunda tentativa da triangulação.
 * O Constrainautor recusa ("Constraining edge intersects point") quando um
 * ponto fica exatamente alinhado com uma aresta forçada, o que acontece em
 * lados retos e compridos (a manga longa). Um milionésimo de mm desfaz o
 * alinhamento exato sem mudar a peça; só quem recusou passa por aqui, então
 * a malha das outras peças (e a simetria das peças na dobra) não muda.
 */
const COLLINEAR_NUDGE = 1e-6;

function triangulate(points: Point[], nb: number, extra: [number, number][] = []): number[] {
  const borderEdges: [number, number][] = [];
  for (let i = 0; i < nb; i++) borderEdges.push([i, (i + 1) % nb]);
  const build = (nudge: number) => {
    const coords = new Float64Array(points.length * 2);
    points.forEach((p, i) => {
      // Na borda, três pontos seguidos vão para lados diferentes: nunca ficam em linha.
      const k = i < nb ? i % 3 : -1;
      coords[i * 2] = p.x + (k === 0 ? -nudge : k === 2 ? nudge : 0);
      coords[i * 2 + 1] = p.y + (k === 1 ? nudge : 0);
    });
    const del = new Delaunator(coords);
    new Constrainautor(del, [...borderEdges, ...extra]);
    return del;
  };
  let del: Delaunator<ArrayLike<number>>;
  try {
    del = build(0);
  } catch (e) {
    if (!(e instanceof Error) || !/intersects point/.test(e.message)) throw e;
    del = build(COLLINEAR_NUDGE);
  }

  const border = points.slice(0, nb);
  const tris: number[] = [];
  const t = del.triangles;
  for (let k = 0; k < t.length; k += 3) {
    let a = t[k]!;
    const b = t[k + 1]!;
    let c = t[k + 2]!;
    const pa = points[a]!;
    const pb = points[b]!;
    const pc = points[c]!;
    // A triangulação cobre o fecho convexo: fica só o que está dentro da peça.
    const centroid = { x: (pa.x + pb.x + pc.x) / 3, y: (pa.y + pb.y + pc.y) / 3 };
    if (!insidePolygon(centroid, border)) continue;
    const area = cross(pa, pb, pc);
    if (Math.abs(area) < 1e-9) continue;
    if (area < 0) [a, c] = [c, a];
    tris.push(a, b, c);
  }
  return tris;
}

const SMOOTH_PASSES = 4;
/** Distância mínima à borda (× espaçamento) que a suavização respeita. */
const SMOOTH_CLEARANCE = 0.35;
/** Só os pontos internos até essa distância da borda (× espaçamento) são suavizados. */
const BAND_WIDTH = 1.6;

/**
 * Leva cada ponto interno da faixa junto à borda para a média dos vizinhos
 * (suavização laplaciana), alterando `points` no lugar. É ali que os pontos
 * descartados por estarem colados na borda deixam vãos. Os pontos antes de
 * `firstFree` (a borda e a fileira do eixo) não se mexem. O miolo não se
 * mexe: continua na grade alinhada ao fio.
 */
function smoothBand(points: Point[], firstFree: number, tris: number[], border: Point[], spacing: number): void {
  const neighbors: Set<number>[] = points.map(() => new Set());
  for (let k = 0; k < tris.length; k += 3) {
    const [a, b, c] = [tris[k]!, tris[k + 1]!, tris[k + 2]!];
    neighbors[a]!.add(b).add(c);
    neighbors[b]!.add(a).add(c);
    neighbors[c]!.add(a).add(b);
  }
  const minClearance = spacing * SMOOTH_CLEARANCE;
  const band: number[] = [];
  for (let i = firstFree; i < points.length; i++) {
    if (distanceToBorder(points[i]!, border) < spacing * BAND_WIDTH) band.push(i);
  }
  // Cada passada lê só a anterior (Jacobi): o resultado não depende da ordem
  // dos pontos, e uma malha simétrica continua simétrica.
  for (let pass = 0; pass < SMOOTH_PASSES; pass++) {
    const moved: [number, Point][] = [];
    for (const i of band) {
      const ns = neighbors[i]!;
      if (ns.size === 0) continue;
      let x = 0;
      let y = 0;
      for (const j of ns) {
        x += points[j]!.x;
        y += points[j]!.y;
      }
      const next = { x: x / ns.size, y: y / ns.size };
      if (insidePolygon(next, border) && distanceToBorder(next, border) >= minClearance) moved.push([i, next]);
    }
    for (const [i, p] of moved) points[i] = p;
  }
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/** Ponto dentro do polígono (regra par-ímpar). */
export function insidePolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function distanceToBorder(p: Point, poly: readonly Point[]): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const u = len2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
    best = Math.min(best, Math.hypot(p.x - (a.x + dx * u), p.y - (a.y + dy * u)));
  }
  return best;
}

function uniqueEdges(triangles: Uint32Array): Uint32Array {
  const seen = new Set<number>();
  const out: number[] = [];
  const add = (i: number, j: number) => {
    const [a, b] = i < j ? [i, j] : [j, i];
    const key = a * 0x100000 + b;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(a, b);
  };
  for (let k = 0; k < triangles.length; k += 3) {
    const a = triangles[k]!;
    const b = triangles[k + 1]!;
    const c = triangles[k + 2]!;
    add(a, b);
    add(b, c);
    add(c, a);
  }
  return Uint32Array.from(out);
}
