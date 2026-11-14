import { polygonArea, type Point } from "@alinhavo/geometry";
import {
  EndType,
  FillRule,
  JoinType,
  area,
  difference,
  inflatePaths,
  minkowskiDiff,
  ramerDouglasPeucker,
  triangulate,
  TriangulateResult,
  union,
  type Path64,
  type Paths64,
  type Point64,
} from "clipper2-ts";

/**
 * Motor de encaixe: posiciona as peças num risco de largura fixa, gastando o
 * menor comprimento de tecido. Puro e determinístico (mesma entrada, mesmo
 * risco), para rodar em Web Worker.
 *
 * Coordenadas do risco, em mm: X ao longo do comprimento do tecido (o fio
 * reto), começando em 0; Y na largura, de 0 a `widthMm`. Toda peça é girada
 * para o fio dela ficar paralelo a X.
 *
 * Método: polígono de não-sobreposição (NFP, pela soma de Minkowski do
 * Clipper2) e posição mais à esquerda (a que menos alonga o risco), depois
 * mais embaixo. As peças entram da maior para a menor. Peças são
 * simplificadas e inchadas (`toleranceMm` + metade da `gapMm`) antes do
 * cálculo: a forma usada sempre CONTÉM a peça real, então nunca há
 * sobreposição, só uma folga de no máximo `toleranceMm` a mais.
 */

/** Uma peça a encaixar (uma forma, em várias cópias iguais). */
export type NestPiece = {
  id: string;
  /** Contorno de corte (com margem), em mm, nas coordenadas do molde. */
  outline: readonly Point[];
  /** Direção do fio reto nas coordenadas do molde (não precisa ser unitária). */
  grain: Point;
  /** A peça vai espelhada (pelo fio): a segunda de um cortar par. */
  mirrored?: boolean;
  /** Quantas cópias cortar. */
  quantity: number;
};

export type NestOptions = {
  /** Largura útil do tecido, mm. */
  widthMm: number;
  /** Distância mínima entre peças, mm (a borda do tecido recebe a metade). Padrão 0. */
  gapMm?: number;
  /** Tecido com sentido (pelo, estampa direcional): todas as peças no mesmo sentido, sem girar 180°. */
  oneWay?: boolean;
  /**
   * Erro máximo da simplificação do contorno, mm (sempre para fora). Padrão
   * 1: no conjunto calça + top, 0,5 mm leva ~4× mais tempo pelo mesmo
   * aproveitamento (o custo do NFP cresce com os pontos das curvas côncavas).
   */
  toleranceMm?: number;
  /** Chamado depois de cada cópia (posta ou não): quantas foram e o total. */
  onProgress?: (done: number, total: number) => void;
};

/** Transformação afim do molde para o risco: x' = a·x + c·y + tx, y' = b·x + d·y + ty. */
export type Affine = { a: number; b: number; c: number; d: number; tx: number; ty: number };

export type NestPlacement = {
  pieceId: string;
  /** Cópia da peça, de 0 a quantity − 1. */
  copy: number;
  /** Giro extra além do alinhamento ao fio. */
  rotation: 0 | 180;
  mirrored: boolean;
  transform: Affine;
};

export type NestResult = {
  placements: NestPlacement[];
  /** Cópias que não couberam (peça mais larga que o tecido). */
  unplaced: { pieceId: string; copy: number }[];
  widthMm: number;
  /** Comprimento do risco: do começo do tecido até o fim da última peça, mm. */
  lengthMm: number;
  /** Área das peças encaixadas (contorno real), mm². */
  piecesAreaMm2: number;
  /** Área das peças ÷ área do risco (largura × comprimento), de 0 a 1. */
  efficiency: number;
};

/** Escala interna do Clipper (inteiros): 1 unidade = 0,1 mm. */
const SCALE = 10;

type Variant = {
  key: string;
  rotation: 0 | 180;
  /** Do molde para o risco, sem a translação. */
  linear: Affine;
  /** Forma inchada, na escala interna, já transformada. */
  shape: Path64;
  /** A forma em partes convexas (para o NFP). */
  parts: Path64[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Instance = { piece: NestPiece; copy: number; area: number; variants: Variant[] };

export function applyAffine(t: Affine, p: Point): Point {
  return { x: t.a * p.x + t.c * p.y + t.tx, y: t.b * p.x + t.d * p.y + t.ty };
}

/** Contorno de uma peça como ficou no risco, em mm. */
export function placedOutline(piece: Pick<NestPiece, "outline">, placement: Pick<NestPlacement, "transform">): Point[] {
  return piece.outline.map((p) => applyAffine(placement.transform, p));
}

/** Giro (e espelho pelo fio) que leva o fio da peça para +X. */
function linearFor(grain: Point, rotation: 0 | 180, mirrored: boolean): Affine {
  const len = Math.hypot(grain.x, grain.y);
  if (!(len > 0)) throw new Error("Fio da peça sem direção.");
  // Rotação que leva o fio para +X (mais 180° se pedido).
  let cos = grain.x / len;
  let sin = -grain.y / len;
  if (rotation === 180) {
    cos = -cos;
    sin = -sin;
  }
  // R = [cos −sin; sin cos]; espelho pelo fio (agora em X) = inverte Y depois.
  const m = mirrored ? -1 : 1;
  return { a: cos, b: m * sin, c: -sin, d: m * cos, tx: 0, ty: 0 };
}

function toPath(points: readonly Point[], t: Affine): Path64 {
  return points.map((p) => {
    const q = applyAffine(t, p);
    return { x: Math.round(q.x * SCALE), y: Math.round(q.y * SCALE) };
  });
}

function outerPath(paths: Paths64): Path64 | null {
  let best: Path64 | null = null;
  let bestArea = 0;
  for (const p of paths) {
    const a = Math.abs(area(p));
    if (a > bestArea) {
      bestArea = a;
      best = p;
    }
  }
  if (!best) return null;
  return area(best) < 0 ? [...best].reverse() : best;
}

function makeVariant(piece: NestPiece, rotation: 0 | 180, inflate: number, tolerance: number): Variant {
  const linear = linearFor(piece.grain, rotation, piece.mirrored === true);
  let path = toPath(piece.outline, linear);
  if (area(path) < 0) path = [...path].reverse();
  // Simplificação: todo ponto do contorno real fica a até `tolerance` do
  // simplificado. Inchar pela tolerância (mais a folga) devolve uma forma
  // que contém a peça real.
  const simple = ramerDouglasPeucker(path, tolerance);
  const shape = outerPath(inflatePaths([simple], inflate, JoinType.Miter, EndType.Polygon, 2));
  if (!shape) throw new Error(`Peça "${piece.id}" sem área.`);
  const xs = shape.map((p) => p.x);
  const ys = shape.map((p) => p.y);
  return {
    key: `${piece.id}|${rotation}`,
    rotation,
    linear,
    shape,
    parts: convexParts(shape),
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

const cross = (o: Point64, a: Point64, b: Point64) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

function isConvex(poly: Path64): boolean {
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    if (cross(poly[i]!, poly[(i + 1) % n]!, poly[(i + 2) % n]!) < 0) return false;
  }
  return true;
}

/**
 * Partes convexas do polígono (anti-horário): triangulação do Clipper e
 * junção de triângulos vizinhos enquanto o resultado continuar convexo
 * (Hertel–Mehlhorn). Sem triangulação possível, devolve o polígono inteiro.
 */
export function convexParts(shape: Path64): Path64[] {
  const { result, solution } = triangulate([shape], false);
  if (result !== TriangulateResult.success || solution.length === 0) return [shape];
  const polys: (Path64 | null)[] = solution.map((t) => (area(t) < 0 ? [...t].reverse() : t));
  const key = (a: Point64, b: Point64) => `${a.x},${a.y}>${b.x},${b.y}`;
  // Aresta orientada → polígono dono.
  const owner = new Map<string, number>();
  polys.forEach((p, i) => p!.forEach((a, k) => owner.set(key(a, p![(k + 1) % p!.length]!), i)));

  for (let i = 0; i < polys.length; i++) {
    let changed = true;
    while (changed && polys[i]) {
      changed = false;
      const p = polys[i]!;
      for (let k = 0; k < p.length; k++) {
        const a = p[k]!;
        const b = p[(k + 1) % p.length]!;
        const j = owner.get(key(b, a));
        if (j === undefined || j === i || !polys[j]) continue;
        const q = polys[j]!;
        const qa = q.findIndex((v, m) => v.x === b.x && v.y === b.y && q[(m + 1) % q.length]!.x === a.x && q[(m + 1) % q.length]!.y === a.y);
        if (qa < 0) continue;
        // p de b até a (voltando por p), depois q de depois de a até antes de b.
        const merged: Path64 = [];
        for (let s = 0; s < p.length; s++) merged.push(p[(k + 1 + s) % p.length]!);
        for (let s = 2; s < q.length; s++) merged.push(q[(qa + s) % q.length]!);
        if (!isConvex(merged)) continue;
        polys[i] = merged;
        polys[j] = null;
        merged.forEach((v, m) => owner.set(key(v, merged[(m + 1) % merged.length]!), i));
        changed = true;
        break;
      }
    }
  }
  return polys.filter((p): p is Path64 => p !== null);
}

/** Fecho convexo (cadeia monótona), anti-horário. */
function convexHull(points: Point64[]): Path64 {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const lower: Point64[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Point64[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/**
 * Posições (do ponto de origem da forma móvel) em que ela invade a forma
 * fixa: fixa ⊕ (−móvel), pela união das somas das partes convexas (cada
 * uma é o fecho das somas dos vértices). O contorno de fora é guardado; os
 * buracos são descartados (posições dentro de reentrâncias ficam
 * proibidas: perde-se um pouco, nunca sobrepõe).
 */
function noFitPolygon(fixed: Variant, moving: Variant): Path64 {
  const sums: Paths64 = [];
  for (const a of fixed.parts) {
    for (const b of moving.parts) {
      const pts: Point64[] = [];
      for (const p of a) for (const q of b) pts.push({ x: p.x - q.x, y: p.y - q.y });
      sums.push(convexHull(pts));
    }
  }
  const nfp = outerPath(union(sums, FillRule.NonZero)) ?? outerPath(minkowskiDiff(moving.shape, fixed.shape, true));
  if (!nfp) throw new Error("NFP vazio.");
  return nfp;
}

export function nest(pieces: readonly NestPiece[], options: NestOptions): NestResult {
  const widthMm = options.widthMm;
  if (!(widthMm > 0)) throw new Error("Largura do tecido inválida.");
  const gap = Math.max(0, options.gapMm ?? 0);
  const tolerance = Math.max(0.01, options.toleranceMm ?? 1) * SCALE;
  const inflate = tolerance + (gap / 2) * SCALE;
  const rotations: (0 | 180)[] = options.oneWay ? [0] : [0, 180];
  const W = Math.round(widthMm * SCALE);

  const instances: Instance[] = [];
  for (const piece of pieces) {
    if (!Number.isInteger(piece.quantity) || piece.quantity < 0) throw new Error(`Quantidade inválida em "${piece.id}".`);
    if (piece.quantity === 0) continue;
    const pieceArea = polygonArea(piece.outline as Point[]);
    const variants = rotations.map((r) => makeVariant(piece, r, inflate, tolerance));
    for (let copy = 0; copy < piece.quantity; copy++) instances.push({ piece, copy, area: pieceArea, variants });
  }
  // Maiores primeiro; empate pela ordem de entrada (estável).
  instances.sort((x, y) => y.area - x.area);

  // Comprimento máximo do risco: todas as peças enfileiradas.
  const maxLength = instances.reduce((s, i) => s + Math.max(...i.variants.map((v) => v.maxX - v.minX)), 0) + 10 * SCALE;

  const nfpCache = new Map<string, Path64>();
  const placed: { variant: Variant; x: number; y: number }[] = [];
  const placements: NestPlacement[] = [];
  const unplaced: NestResult["unplaced"] = [];
  let piecesArea = 0;
  let lengthMm = 0;

  for (const [index, inst] of instances.entries()) {
    if (index > 0) options.onProgress?.(index, instances.length);
    let best: { variant: Variant; x: number; y: number } | null = null;
    for (const v of inst.variants) {
      // Posições em que a forma fica dentro do tecido (o "inner fit").
      const x0 = -v.minX;
      const x1 = maxLength - v.maxX;
      const y0 = -v.minY;
      const y1 = W - v.maxY;
      if (y1 < y0) continue;
      const fit: Path64 = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 },
      ];
      const blocked: Paths64 = placed.map((p) => {
        const key = `${p.variant.key}>${v.key}`;
        let nfp = nfpCache.get(key);
        if (!nfp) {
          nfp = noFitPolygon(p.variant, v);
          nfpCache.set(key, nfp);
        }
        return nfp.map((q) => ({ x: q.x + p.x, y: q.y + p.y }));
      });
      const free = blocked.length ? difference([fit], union(blocked, FillRule.NonZero), FillRule.NonZero) : [fit];
      for (const path of free) {
        for (const q of path) {
          // Dentro da faixa (o recorte pode devolver ponto na borda exata).
          if (q.y < y0 || q.y > y1 || q.x < x0) continue;
          const right = q.x + v.maxX;
          if (!best || right < best.x + best.variant.maxX || (right === best.x + best.variant.maxX && q.y < best.y)) {
            best = { variant: v, x: q.x, y: q.y };
          }
        }
      }
    }
    if (!best) {
      unplaced.push({ pieceId: inst.piece.id, copy: inst.copy });
      continue;
    }
    placed.push(best);
    const transform: Affine = { ...best.variant.linear, tx: best.x / SCALE, ty: best.y / SCALE };
    placements.push({ pieceId: inst.piece.id, copy: inst.copy, rotation: best.variant.rotation, mirrored: inst.piece.mirrored === true, transform });
    piecesArea += inst.area;
    for (const p of inst.piece.outline) lengthMm = Math.max(lengthMm, applyAffine(transform, p).x);
  }

  options.onProgress?.(instances.length, instances.length);
  return {
    placements,
    unplaced,
    widthMm,
    lengthMm,
    piecesAreaMm2: piecesArea,
    efficiency: lengthMm > 0 ? piecesArea / (lengthMm * widthMm) : 0,
  };
}
