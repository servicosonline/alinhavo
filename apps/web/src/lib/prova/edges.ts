import type { Garment, SeamEdge } from "@alinhavo/geometry";
import type { PieceMesh } from "@alinhavo/cloth";

/**
 * Bordas da roupa na Prova, para clicar e ajustar. Cada linha liga dois
 * vértices vizinhos da borda de uma peça e pertence a um segmento DO MOLDE
 * (a metade espelhada aponta para o mesmo segmento da metade desenhada).
 */
export type ProvaEdges = {
  /** Segmentos do molde, sem repetição. */
  list: SeamEdge[];
  /** Pares de índices de vértice (na numeração da simulação). */
  lines: Uint32Array;
  /** Para cada par, o índice em `list`. */
  owner: Int32Array;
};

export function buildProvaEdges(
  meshes: readonly PieceMesh[],
  offsets: ReadonlyMap<string, number>,
  origin: Garment["origin"],
): ProvaEdges {
  const list: SeamEdge[] = [];
  const index = new Map<string, number>();
  const lines: number[] = [];
  const owner: number[] = [];
  for (const mesh of meshes) {
    const off = offsets.get(mesh.pieceId);
    const from = origin[mesh.pieceId];
    if (off === undefined || !from) continue;
    const nb = mesh.boundaryCount;
    for (let b = 0; b < nb; b++) {
      // O vértice b está no seu segmento com t em [0, 1): a linha até o próximo é desse segmento.
      const o = from[mesh.boundarySegment[b]!];
      if (!o) continue;
      const key = `${mesh.pieceId}#${o.segment}`;
      let k = index.get(key);
      if (k === undefined) {
        k = list.length;
        index.set(key, k);
        list.push({ piece: mesh.pieceId, segment: o.segment });
      }
      lines.push(off + b, off + ((b + 1) % nb));
      owner.push(k);
    }
  }
  return { list, lines: Uint32Array.from(lines), owner: Int32Array.from(owner) };
}

/**
 * A linha mais perto do ponto (coordenadas x, y, z por vértice). Devolve o
 * índice do par em `lines`, ou -1 se nenhuma estiver a até `maxDist`.
 */
export function nearestLine(coords: ArrayLike<number>, lines: ArrayLike<number>, p: { x: number; y: number; z: number }, maxDist: number): number {
  let best = -1;
  let bestD = maxDist * maxDist;
  forEachLineDistance(coords, lines, p, (i, d) => {
    if (d <= bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/**
 * Na tela: entre as linhas a até `maxDist` px do clique (x, y), a mais
 * próxima da câmera (menor `depth` média nas pontas). Assim o clique não
 * pega uma borda escondida atrás do tecido. -1 se nenhuma.
 */
export function frontmostLine(
  screen: ArrayLike<number>,
  depth: ArrayLike<number>,
  lines: ArrayLike<number>,
  p: { x: number; y: number },
  maxDist: number,
): number {
  let best = -1;
  let bestDepth = Infinity;
  forEachLineDistance(screen, lines, { ...p, z: 0 }, (i, d) => {
    if (d > maxDist * maxDist) return;
    const z = (depth[lines[2 * i]!]! + depth[lines[2 * i + 1]!]!) / 2;
    if (z < bestDepth) {
      bestDepth = z;
      best = i;
    }
  });
  return best;
}

/** Distância ao quadrado do ponto a cada linha (coordenadas x, y, z por vértice). */
function forEachLineDistance(
  coords: ArrayLike<number>,
  lines: ArrayLike<number>,
  p: { x: number; y: number; z: number },
  fn: (line: number, dist2: number) => void,
) {
  for (let i = 0; i < lines.length; i += 2) {
    const a = lines[i]! * 3;
    const b = lines[i + 1]! * 3;
    const ax = coords[a]!;
    const ay = coords[a + 1]!;
    const az = coords[a + 2]!;
    const dx = coords[b]! - ax;
    const dy = coords[b + 1]! - ay;
    const dz = coords[b + 2]! - az;
    const len2 = dx * dx + dy * dy + dz * dz;
    let t = len2 > 0 ? ((p.x - ax) * dx + (p.y - ay) * dy + (p.z - az) * dz) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const ex = ax + dx * t - p.x;
    const ey = ay + dy * t - p.y;
    const ez = az + dz * t - p.z;
    fn(i / 2, ex * ex + ey * ey + ez * ez);
  }
}
