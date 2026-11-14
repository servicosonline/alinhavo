import { flattenOutline, type Piece } from "./pattern";
import { signedArea, type Point } from "./polygon";

/** Até quantas vezes a maior margem o canto em ponta pode avançar antes de virar chanfro. */
const MITER_LIMIT = 4;
const EPS = 1e-9;

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;

/**
 * Desloca cada aresta do polígono para fora pela sua própria distância e liga
 * as arestas deslocadas pelo encontro das retas (canto em ponta, como no papel).
 *
 * `distances[i]` é a margem da aresta i (de polygon[i] a polygon[i+1]).
 * Funciona nos dois sentidos de giro. Cantos muito agudos viram chanfro.
 *
 * Limite conhecido: em curvas côncavas muito fechadas com margem grande, o
 * contorno deslocado pode se cruzar. Isso não acontece em moldes de roupa
 * comuns (margens de 5 a 40 mm); se surgir, a correção é limpar o laço com
 * uma união booleana.
 */
export function offsetPolygon(polygon: Point[], distances: number[]): Point[] {
  return offsetPolygonDetailed(polygon, distances).points;
}

/**
 * Igual a `offsetPolygon`, mas diz de qual vértice do polígono original veio
 * cada ponto (`source[k]`). Serve para marcar quinas na exportação.
 */
export function offsetPolygonDetailed(polygon: Point[], distances: number[]): { points: Point[]; source: number[] } {
  const n = polygon.length;
  if (n < 3) return { points: [...polygon], source: polygon.map((_, i) => i) };
  if (distances.length !== n) throw new Error("É preciso uma margem para cada aresta.");

  const outward = signedArea(polygon) >= 0 ? 1 : -1;
  const edges = polygon.map((a, i) => {
    const b = polygon[(i + 1) % n]!;
    const dir = sub(b, a);
    const len = Math.hypot(dir.x, dir.y);
    const unit = len > EPS ? scale(dir, 1 / len) : { x: 0, y: 0 };
    const normal = { x: unit.y * outward, y: -unit.x * outward };
    return { a, unit, normal, d: distances[i]! };
  });

  const out: Point[] = [];
  const source: number[] = [];
  const push = (i: number, ...pts: Point[]) => {
    for (const p of pts) {
      out.push(p);
      source.push(i);
    }
  };
  for (let i = 0; i < n; i++) {
    const prev = edges[(i - 1 + n) % n]!;
    const next = edges[i]!;
    const v = polygon[i]!;
    const p1 = add(v, scale(prev.normal, prev.d)); // fim da aresta anterior, deslocada
    const p2 = add(v, scale(next.normal, next.d)); // início da próxima, deslocada

    const denom = cross(prev.unit, next.unit);
    if (Math.abs(denom) < EPS) {
      // Arestas alinhadas: um ponto só se a margem é a mesma, senão um degrau.
      push(i, p1);
      if (Math.abs(prev.d - next.d) > EPS) push(i, p2);
      continue;
    }

    // Encontro das duas retas deslocadas: p1 + prev.unit·t = p2 + next.unit·s
    const t = cross(sub(p2, p1), next.unit) / denom;
    const corner = add(p1, scale(prev.unit, t));
    const reach = Math.hypot(corner.x - v.x, corner.y - v.y);
    if (reach > MITER_LIMIT * Math.max(prev.d, next.d, EPS)) {
      push(i, p1, p2); // canto agudo demais: chanfro
    } else {
      push(i, corner);
    }
  }
  return { points: out, source };
}

/**
 * Contorno de corte da parte (com margem de costura), em mm.
 * Cada trecho usa a margem do seu segmento (`seamAllowanceByEdge`) ou a padrão.
 */
export function seamAllowanceOutline(piece: Piece, tolerance = 0.1): Point[] {
  const { polygon, edgeSegment } = flattenOutline(piece, tolerance);
  const distances = edgeSegment.map((seg) => piece.seamAllowanceByEdge?.[seg] ?? piece.seamAllowance);
  return offsetPolygon(polygon, distances);
}
