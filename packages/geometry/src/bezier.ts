import { distance, type Point } from "./polygon";

/** Curva de Bézier cúbica: começa em p0, termina em p3; c1 e c2 são as alças. */
export type Cubic = { p0: Point; c1: Point; c2: Point; p3: Point };

const MAX_DEPTH = 16;

export function cubicPoint({ p0, c1, c2, p3 }: Cubic, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p3.x,
    y: a * p0.y + b * c1.y + c * c2.y + d * p3.y,
  };
}

/** Distância de p à reta que passa por a e b (ou a a, se a e b coincidem). */
function distanceToLine(p: Point, a: Point, b: Point): number {
  const len = distance(a, b);
  if (len === 0) return distance(p, a);
  return Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len;
}

function split(c: Cubic): [Cubic, Cubic] {
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const p01 = mid(c.p0, c.c1);
  const p12 = mid(c.c1, c.c2);
  const p23 = mid(c.c2, c.p3);
  const p012 = mid(p01, p12);
  const p123 = mid(p12, p23);
  const m = mid(p012, p123);
  return [
    { p0: c.p0, c1: p01, c2: p012, p3: m },
    { p0: m, c1: p123, c2: p23, p3: c.p3 },
  ];
}

/**
 * Transforma a curva em pontos, subdividindo até a curva se afastar da reta
 * no máximo `tolerance` mm. Devolve os pontos depois de p0 (inclui p3).
 */
export function flattenCubic(curve: Cubic, tolerance = 0.1): Point[] {
  const out: Point[] = [];
  const walk = (c: Cubic, depth: number) => {
    const flat = Math.max(distanceToLine(c.c1, c.p0, c.p3), distanceToLine(c.c2, c.p0, c.p3));
    if (flat <= tolerance || depth >= MAX_DEPTH) {
      out.push(c.p3);
      return;
    }
    const [a, b] = split(c);
    walk(a, depth + 1);
    walk(b, depth + 1);
  };
  walk(curve, 0);
  return out;
}

/** Comprimento da curva em mm (erro bem abaixo de 0,1 mm com a tolerância padrão). */
export function cubicLength(curve: Cubic, tolerance = 0.005): number {
  let total = 0;
  let prev = curve.p0;
  for (const p of flattenCubic(curve, tolerance)) {
    total += distance(prev, p);
    prev = p;
  }
  return total;
}
