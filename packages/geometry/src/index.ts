/**
 * Geometria dos moldes. Funções puras, sem React nem navegador.
 * Convenção: todas as medidas em milímetros.
 */

export type Point = { x: number; y: number };

/** Polígono fechado: o último ponto liga de volta ao primeiro. */
export type Polygon = readonly Point[];

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Área em mm² (sempre positiva, qualquer sentido de giro). */
export function polygonArea(poly: Polygon): number {
  return Math.abs(signedArea(poly));
}

/** Área com sinal: positiva no sentido anti-horário. */
export function signedArea(poly: Polygon): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

/** Perímetro em mm de um polígono fechado. */
export function polygonPerimeter(poly: Polygon): number {
  if (poly.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < poly.length; i++) {
    total += distance(poly[i]!, poly[(i + 1) % poly.length]!);
  }
  return total;
}
