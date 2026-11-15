import type { Point } from "@alinhavo/geometry";

/**
 * Homografia (perspectiva de um plano): p' = H·p em coordenadas
 * homogêneas. Matriz 3×3 linha a linha, com H[8] = 1.
 */
export type Homography = [number, number, number, number, number, number, number, number, number];

export function applyHomography(h: Homography, p: Point): Point {
  const w = h[6] * p.x + h[7] * p.y + h[8];
  return { x: (h[0] * p.x + h[1] * p.y + h[2]) / w, y: (h[3] * p.x + h[4] * p.y + h[5]) / w };
}

export function invertHomography(h: Homography): Homography {
  const [a, b, c, d, e, f, g, i, j] = h;
  const A = e * j - f * i;
  const B = -(d * j - f * g);
  const C = d * i - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-15) throw new Error("Homografia sem inversa.");
  const m: Homography = [
    A / det,
    -(b * j - c * i) / det,
    (b * f - c * e) / det,
    B / det,
    (a * j - c * g) / det,
    -(a * f - c * d) / det,
    C / det,
    -(a * i - b * g) / det,
    (a * e - b * d) / det,
  ];
  const s = m[8];
  return m.map((v) => v / s) as Homography;
}

/** Translação e escala que levam os pontos para média 0 e distância média √2 (Hartley). */
function normalizer(points: readonly Point[]): Homography {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  const d = points.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / points.length || 1;
  const k = Math.SQRT2 / d;
  return [k, 0, -k * cx, 0, k, -k * cy, 0, 0, 1];
}

function multiply(a: Homography, b: Homography): Homography {
  const r: number[] = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += a[i * 3 + k]! * b[k * 3 + j]!;
      r.push(s);
    }
  return r.map((v) => v / r[8]!) as Homography;
}

/** Resolve A·x = b (n×n) por eliminação de Gauss com pivô parcial. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r]![col]!) > Math.abs(M[pivot]![col]!)) pivot = r;
    if (Math.abs(M[pivot]![col]!) < 1e-12) throw new Error("Pontos degenerados para a homografia.");
    [M[col], M[pivot]] = [M[pivot]!, M[col]!];
    for (let r = col + 1; r < n; r++) {
      const f = M[r]![col]! / M[col]![col]!;
      for (let c = col; c <= n; c++) M[r]![c]! -= f * M[col]![c]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r]![n]!;
    for (let c = r + 1; c < n; c++) s -= M[r]![c]! * x[c]!;
    x[r] = s / M[r]![r]!;
  }
  return x;
}

/**
 * Homografia que leva `from` em `to` (mínimos quadrados com 4 pares ou
 * mais), com normalização de Hartley para ficar estável com coordenadas em
 * pixels e mm.
 */
export function fitHomography(from: readonly Point[], to: readonly Point[]): Homography {
  if (from.length !== to.length || from.length < 4) throw new Error("A homografia precisa de pelo menos 4 pares de pontos.");
  const Tf = normalizer(from);
  const Tt = normalizer(to);
  const f = from.map((p) => applyHomography(Tf, p));
  const t = to.map((p) => applyHomography(Tt, p));
  // Equações normais de A·h = b com h33 = 1.
  const AtA = Array.from({ length: 8 }, () => new Array<number>(8).fill(0));
  const Atb = new Array<number>(8).fill(0);
  const add = (row: number[], rhs: number) => {
    for (let i = 0; i < 8; i++) {
      Atb[i]! += row[i]! * rhs;
      for (let j = 0; j < 8; j++) AtA[i]![j]! += row[i]! * row[j]!;
    }
  };
  for (let i = 0; i < f.length; i++) {
    const { x, y } = f[i]!;
    const { x: u, y: v } = t[i]!;
    add([x, y, 1, 0, 0, 0, -u * x, -u * y], u);
    add([0, 0, 0, x, y, 1, -v * x, -v * y], v);
  }
  const h = solve(AtA, Atb);
  const Hn = [...h, 1] as Homography;
  // Desfaz a normalização: H = Tt⁻¹ · Hn · Tf
  return multiply(multiply(invertHomography(Tt), Hn), Tf);
}
