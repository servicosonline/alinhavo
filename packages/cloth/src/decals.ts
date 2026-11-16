import type { GarmentFinish, Point } from "@alinhavo/geometry";
import { closestOnTriangle } from "./layers";
import type { PieceMesh } from "./mesh";

/**
 * Acabamentos sobre a roupa da Prova ("decalques"): cada ponto do desenho do
 * acabamento (mm, nas coordenadas da peça) é preso a um triângulo da malha
 * por coordenadas baricêntricas. A posição 3D sai da simulação a cada quadro:
 * soma dos três vértices pelos pesos. Ponto fora da malha (rente à borda) vai
 * para o ponto mais perto dela.
 */

/** Distância máxima entre pontos de uma linha ou faixa, em mm: abaixo da malha (30 mm), para seguir a curva do tecido. */
export const DECAL_STEP = 12;
/** Divisões da grade de uma etiqueta ou estampa em cada direção. */
export const DECAL_GRID = 10;

export type DecalKind = "pesponto" | "ziper" | "ziper-dentes" | "etiqueta" | "estampa" | "bordado" | "pedraria";

export type Decal = {
  kind: DecalKind;
  /** Peça da Prova e acabamento de onde veio. */
  pieceId: string;
  finishId: string;
  /** "line": os pontos ligados em ordem; "mesh": triângulos em `indices`; "points": cada ponto solto (as pedras). */
  mode: "line" | "mesh" | "points";
  /** Três vértices da simulação (índice global) por ponto do decalque. */
  vertices: Uint32Array;
  /** Três pesos por ponto (somam 1). */
  weights: Float32Array;
  indices?: Uint32Array;
  /** u, v por ponto (etiqueta e estampa; v = 1 no alto da imagem). */
  uv?: Float32Array;
  image?: string;
  text?: string;
  /** Etiqueta ou estampa: largura ÷ altura do retângulo (para o texto ou a imagem não deformar). */
  aspect?: number;
  /** Pedraria: cor (#rrggbb) e diâmetro da pedra em mm. */
  color?: string;
  size?: number;
};

/** Pontos de uma linha a no máximo `step` mm uns dos outros (as pontas originais ficam). */
export function resampleLine(line: readonly Point[], step = DECAL_STEP): Point[] {
  if (line.length === 0) return [];
  const out: Point[] = [line[0]!];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]!;
    const b = line[i]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
    for (let k = 1; k <= n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  return out;
}

/** A malha com z = 0, para usar a mesma busca de ponto mais perto do triângulo das camadas. */
function flat(mesh: PieceMesh): Float64Array {
  const n = mesh.positions.length / 2;
  const out = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = mesh.positions[i * 2]!;
    out[i * 3 + 1] = mesh.positions[i * 2 + 1]!;
  }
  return out;
}

/**
 * Prende cada ponto à malha da peça: três vértices (já com `offset`, o início
 * da peça na simulação) e os pesos de cada um.
 */
export function embedPoints(mesh: PieceMesh, points: readonly Point[], offset: number): { vertices: Uint32Array; weights: Float32Array } {
  const x = flat(mesh);
  const t = mesh.triangles;
  const q = new Float64Array(3);
  const vertices = new Uint32Array(points.length * 3);
  const weights = new Float32Array(points.length * 3);
  points.forEach((p, k) => {
    let best = Infinity;
    let bt = 0;
    let bx = p.x;
    let by = p.y;
    for (let i = 0; i < t.length; i += 3) {
      const d2 = closestOnTriangle(p.x, p.y, 0, x, t[i]!, t[i + 1]!, t[i + 2]!, q);
      if (d2 < best) {
        best = d2;
        bt = i;
        bx = q[0]!;
        by = q[1]!;
        if (d2 === 0) break; // dentro do triângulo
      }
    }
    const [a, b, c] = [t[bt]!, t[bt + 1]!, t[bt + 2]!];
    const ax = x[a * 3]!,
      ay = x[a * 3 + 1]!;
    const v0x = x[b * 3]! - ax,
      v0y = x[b * 3 + 1]! - ay;
    const v1x = x[c * 3]! - ax,
      v1y = x[c * 3 + 1]! - ay;
    const v2x = bx - ax,
      v2y = by - ay;
    const den = v0x * v1y - v1x * v0y;
    const wb = den !== 0 ? (v2x * v1y - v1x * v2y) / den : 0;
    const wc = den !== 0 ? (v0x * v2y - v2x * v0y) / den : 0;
    vertices.set([offset + a, offset + b, offset + c], k * 3);
    weights.set([1 - wb - wc, wb, wc], k * 3);
  });
  return { vertices, weights };
}

/** Faixa entre duas linhas com o mesmo número de pontos: dois triângulos por trecho. */
function stripIndices(n: number): Uint32Array {
  const out: number[] = [];
  for (let i = 0; i < n - 1; i++) out.push(i, i + 1, n + i, i + 1, n + i + 1, n + i);
  return Uint32Array.from(out);
}

/** As duas bordas da faixa do zíper (a do contorno e a de dentro), reamostradas com o mesmo número de pontos. */
function zipperEdges(band: readonly Point[]): [Point[], Point[]] {
  const half = band.length / 2;
  const outer = band.slice(0, half);
  const inner = band.slice(half).reverse();
  const len = outer.reduce((s, p, i) => (i === 0 ? 0 : s + Math.hypot(p.x - outer[i - 1]!.x, p.y - outer[i - 1]!.y)), 0);
  const n = Math.max(2, Math.ceil(len / DECAL_STEP) + 1);
  const at = (line: Point[], s: number): Point => {
    // Pela fração do índice (as duas bordas têm os mesmos vértices de origem).
    const f = s * (line.length - 1);
    const i = Math.min(line.length - 2, Math.floor(f));
    const t = f - i;
    return { x: line[i]!.x + (line[i + 1]!.x - line[i]!.x) * t, y: line[i]!.y + (line[i + 1]!.y - line[i]!.y) * t };
  };
  const pick = (line: Point[]) => Array.from({ length: n }, (_, k) => at(line, k / (n - 1)));
  return [pick(outer), pick(inner)];
}

/**
 * Os decalques da roupa: os acabamentos (`garmentAtSize(...).finishes`)
 * presos às malhas das peças. Peça que não está na simulação (sem posição na
 * Prova) fica de fora.
 */
export function garmentDecals(finishes: readonly GarmentFinish[], meshes: readonly PieceMesh[], pieceOffset: ReadonlyMap<string, number>): Decal[] {
  const byId = new Map(meshes.map((m) => [m.pieceId, m]));
  const out: Decal[] = [];
  for (const f of finishes) {
    const mesh = byId.get(f.piece);
    const offset = pieceOffset.get(f.piece);
    if (!mesh || offset === undefined) continue;
    const base = { pieceId: f.piece, finishId: f.finishId };
    const s = f.shape;
    if (s.kind === "pesponto") {
      for (const line of s.lines) {
        out.push({ ...base, kind: "pesponto", mode: "line", ...embedPoints(mesh, resampleLine(line), offset) });
      }
    } else if (s.kind === "ziper") {
      if (s.band.length < 4) continue;
      const [outer, inner] = zipperEdges(s.band);
      out.push({ ...base, kind: "ziper", mode: "mesh", ...embedPoints(mesh, [...outer, ...inner], offset), indices: stripIndices(outer.length) });
      out.push({ ...base, kind: "ziper-dentes", mode: "line", ...embedPoints(mesh, resampleLine(s.axis), offset) });
    } else if (s.kind === "pedraria") {
      if (s.stones.length === 0) continue;
      out.push({ ...base, kind: "pedraria", mode: "points", ...embedPoints(mesh, s.stones, offset), color: s.color, size: s.radius * 2 });
    } else {
      const [c0, c1, , c3] = s.corners;
      const pts: Point[] = [];
      const uv: number[] = [];
      for (let j = 0; j <= DECAL_GRID; j++) {
        for (let i = 0; i <= DECAL_GRID; i++) {
          const u = i / DECAL_GRID;
          const v = j / DECAL_GRID;
          // c0 → c1 é a largura; c0 → c3, a altura (o alto da imagem fica em c0–c1).
          pts.push({ x: c0.x + (c1.x - c0.x) * u + (c3.x - c0.x) * v, y: c0.y + (c1.y - c0.y) * u + (c3.y - c0.y) * v });
          uv.push(u, 1 - v);
        }
      }
      const indices: number[] = [];
      const row = DECAL_GRID + 1;
      for (let j = 0; j < DECAL_GRID; j++) {
        for (let i = 0; i < DECAL_GRID; i++) {
          const a = j * row + i;
          indices.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
        }
      }
      out.push({
        ...base,
        kind: s.kind,
        mode: "mesh",
        ...embedPoints(mesh, pts, offset),
        indices: Uint32Array.from(indices),
        uv: Float32Array.from(uv),
        aspect: s.width / Math.max(1e-6, s.height),
        ...(f.image ? { image: f.image } : {}),
        ...(f.text !== undefined ? { text: f.text } : {}),
      });
    }
  }
  return out;
}

/** Posições 3D dos pontos de um decalque (x, y, z por ponto) a partir das posições da simulação. */
export function decalPositions(
  decal: Pick<Decal, "vertices" | "weights">,
  positions: ArrayLike<number>,
  out: Float32Array = new Float32Array(decal.weights.length),
): Float32Array {
  for (let k = 0; k < decal.weights.length; k += 3) {
    let x = 0,
      y = 0,
      z = 0;
    for (let c = 0; c < 3; c++) {
      const v = decal.vertices[k + c]! * 3;
      const w = decal.weights[k + c]!;
      x += positions[v]! * w;
      y += positions[v + 1]! * w;
      z += positions[v + 2]! * w;
    }
    out[k] = x;
    out[k + 1] = y;
    out[k + 2] = z;
  }
  return out;
}
