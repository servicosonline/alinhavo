import type { Collider } from "./collider";

/**
 * Camadas do look: roupas vestidas uma sobre a outra (camada 0 = a de dentro).
 * Colisão de uma via só: um vértice de uma camada não entra na superfície das
 * camadas de baixo, que valem como obstáculo em movimento; a de baixo não é
 * empurrada pela de cima (o mesmo princípio de "camada" dos programas de
 * prova 3D). Sem colisão de uma roupa com ela mesma.
 *
 * "Fora" de um triângulo é o lado longe do corpo. A orientação de cada
 * triângulo é medida uma vez, na posição inicial (a roupa enrolada no
 * corpo), e acompanha o triângulo pela ordem dos vértices.
 */

/** Distância mínima entre camadas, em mm, além da metade das espessuras: sem ela, no desenho, a de baixo apareceria através da de cima. */
export const LAYER_GAP = 3;
/** Até onde, em mm, um vértice procura a camada de baixo a cada quadro. Cobre o que ele anda num quadro. */
export const LAYER_RANGE = 25;
/** Profundidade máxima, em mm, que ainda conta como "atravessou e volta": mais fundo que isso não é contato. */
export const LAYER_MAX_DEPTH = 15;

const CELL = 40;

/**
 * Ponto do triângulo (a, b, c) mais perto de p (Ericson, "Real-Time Collision
 * Detection", 5.1.5). Escreve o ponto em `out` e devolve a distância ao quadrado.
 */
export function closestOnTriangle(
  px: number,
  py: number,
  pz: number,
  x: ArrayLike<number>,
  a: number,
  b: number,
  c: number,
  out: Float64Array,
): number {
  const ax = x[a * 3]!,
    ay = x[a * 3 + 1]!,
    az = x[a * 3 + 2]!;
  const abx = x[b * 3]! - ax,
    aby = x[b * 3 + 1]! - ay,
    abz = x[b * 3 + 2]! - az;
  const acx = x[c * 3]! - ax,
    acy = x[c * 3 + 1]! - ay,
    acz = x[c * 3 + 2]! - az;
  const apx = px - ax,
    apy = py - ay,
    apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz;
  const d2 = acx * apx + acy * apy + acz * apz;
  let qx: number, qy: number, qz: number;
  if (d1 <= 0 && d2 <= 0) {
    qx = ax;
    qy = ay;
    qz = az;
  } else {
    const bpx = px - x[b * 3]!,
      bpy = py - x[b * 3 + 1]!,
      bpz = pz - x[b * 3 + 2]!;
    const d3 = abx * bpx + aby * bpy + abz * bpz;
    const d4 = acx * bpx + acy * bpy + acz * bpz;
    const cpx = px - x[c * 3]!,
      cpy = py - x[c * 3 + 1]!,
      cpz = pz - x[c * 3 + 2]!;
    const d5 = abx * cpx + aby * cpy + abz * cpz;
    const d6 = acx * cpx + acy * cpy + acz * cpz;
    const vc = d1 * d4 - d3 * d2;
    const vb = d5 * d2 - d1 * d6;
    const va = d3 * d6 - d5 * d4;
    if (d3 >= 0 && d4 <= d3) {
      qx = ax + abx;
      qy = ay + aby;
      qz = az + abz;
    } else if (d6 >= 0 && d5 <= d6) {
      qx = ax + acx;
      qy = ay + acy;
      qz = az + acz;
    } else if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v = d1 / (d1 - d3);
      qx = ax + abx * v;
      qy = ay + aby * v;
      qz = az + abz * v;
    } else if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w = d2 / (d2 - d6);
      qx = ax + acx * w;
      qy = ay + acy * w;
      qz = az + acz * w;
    } else if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
      const bx = ax + abx,
        by = ay + aby,
        bz = az + abz;
      qx = bx + (acx - abx) * w;
      qy = by + (acy - aby) * w;
      qz = bz + (acz - abz) * w;
    } else {
      const denom = 1 / (va + vb + vc);
      const v = vb * denom;
      const w = vc * denom;
      qx = ax + abx * v + acx * w;
      qy = ay + aby * v + acy * w;
      qz = az + abz * v + acz * w;
    }
  }
  out[0] = qx;
  out[1] = qy;
  out[2] = qz;
  return (px - qx) ** 2 + (py - qy) ** 2 + (pz - qz) ** 2;
}

/** Normal unitária do triângulo pela ordem dos vértices (regra da mão direita); zero se degenerado. */
function triangleNormal(x: ArrayLike<number>, a: number, b: number, c: number, out: Float64Array) {
  const abx = x[b * 3]! - x[a * 3]!,
    aby = x[b * 3 + 1]! - x[a * 3 + 1]!,
    abz = x[b * 3 + 2]! - x[a * 3 + 2]!;
  const acx = x[c * 3]! - x[a * 3]!,
    acy = x[c * 3 + 1]! - x[a * 3 + 1]!,
    acz = x[c * 3 + 2]! - x[a * 3 + 2]!;
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  const len = Math.hypot(nx, ny, nz);
  if (len < 1e-12) {
    out[0] = out[1] = out[2] = 0;
    return;
  }
  out[0] = nx / len;
  out[1] = ny / len;
  out[2] = nz / len;
}

/**
 * Lado de fora de cada triângulo (+1: a normal pela ordem dos vértices aponta
 * para longe do corpo; −1: para dentro), medido nas posições `x` pelo
 * obstáculo mais perto do centro do triângulo. Sem obstáculo, +1.
 */
export function outwardSigns(x: ArrayLike<number>, triangles: ArrayLike<number>, colliders: readonly Collider[]): Int8Array {
  const signs = new Int8Array(triangles.length / 3).fill(1);
  if (colliders.length === 0) return signs;
  const n = new Float64Array(3);
  for (let t = 0; t < signs.length; t++) {
    const a = triangles[t * 3]!,
      b = triangles[t * 3 + 1]!,
      c = triangles[t * 3 + 2]!;
    const cx = (x[a * 3]! + x[b * 3]! + x[c * 3]!) / 3;
    const cy = (x[a * 3 + 1]! + x[b * 3 + 1]! + x[c * 3 + 1]!) / 3;
    const cz = (x[a * 3 + 2]! + x[b * 3 + 2]! + x[c * 3 + 2]!) / 3;
    let best = Infinity;
    let nx = 0,
      ny = 1,
      nz = 0;
    for (const collider of colliders) {
      const q = collider.query(cx, cy, cz);
      if (q.distance < best) {
        best = q.distance;
        nx = q.normal.x;
        ny = q.normal.y;
        nz = q.normal.z;
      }
    }
    triangleNormal(x, a, b, c, n);
    signs[t] = n[0]! * nx + n[1]! * ny + n[2]! * nz >= 0 ? 1 : -1;
  }
  return signs;
}

export type LayerSolverInput = {
  /** Posições de todos os vértices (x, y, z), atualizadas pela simulação. */
  x: Float64Array;
  /** Três índices por triângulo. */
  triangles: ArrayLike<number>;
  /** Camada de cada vértice. */
  vertexLayer: Int32Array;
  /** Espessura de cada vértice, em mm. */
  thickness: Float64Array;
  /** Lado de fora de cada triângulo (`outwardSigns`). */
  signs: Int8Array;
};

/**
 * Contato entre camadas. `refresh` (uma vez por quadro) acha, para cada vértice
 * de cima, os triângulos das camadas de baixo a até LAYER_RANGE mm; `solve`
 * (a cada subpasso) empurra o vértice para fora do mais perto deles e devolve,
 * por vértice, quanto o empurrou (a simulação desconta isso da folga ao corpo).
 */
export function createLayerSolver({ x, triangles, vertexLayer, thickness, signs }: LayerSolverInput) {
  const triCount = triangles.length / 3;
  const triLayer = new Int32Array(triCount);
  const triThick = new Float64Array(triCount);
  let maxLayer = 0;
  for (let t = 0; t < triCount; t++) {
    const a = triangles[t * 3]!,
      b = triangles[t * 3 + 1]!,
      c = triangles[t * 3 + 2]!;
    triLayer[t] = Math.min(vertexLayer[a]!, vertexLayer[b]!, vertexLayer[c]!);
    triThick[t] = (thickness[a]! + thickness[b]! + thickness[c]!) / 3;
  }
  for (const l of vertexLayer) maxLayer = Math.max(maxLayer, l);
  /** Vértices de alguma camada acima da 0. */
  const outer: number[] = [];
  for (let i = 0; i < vertexLayer.length; i++) if (vertexLayer[i]! > 0) outer.push(i);
  /** Triângulos candidatos de cada vértice de cima (início e fim em `candidates`). */
  const candStart = new Int32Array(outer.length + 1);
  let candidates = new Int32Array(1024);
  const q = new Float64Array(3);
  const nrm = new Float64Array(3);

  const key = (ix: number, iy: number, iz: number) => ((ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791)) | 0;

  function refresh() {
    if (outer.length === 0) return;
    // Grade espacial dos triângulos que alguém de cima pode tocar (camadas abaixo da maior).
    const grid = new Map<number, number[]>();
    for (let t = 0; t < triCount; t++) {
      if (triLayer[t]! >= maxLayer) continue;
      const a = triangles[t * 3]!,
        b = triangles[t * 3 + 1]!,
        c = triangles[t * 3 + 2]!;
      const lo = [0, 1, 2].map((k) => Math.floor((Math.min(x[a * 3 + k]!, x[b * 3 + k]!, x[c * 3 + k]!) - LAYER_RANGE) / CELL));
      const hi = [0, 1, 2].map((k) => Math.floor((Math.max(x[a * 3 + k]!, x[b * 3 + k]!, x[c * 3 + k]!) + LAYER_RANGE) / CELL));
      for (let ix = lo[0]!; ix <= hi[0]!; ix++)
        for (let iy = lo[1]!; iy <= hi[1]!; iy++)
          for (let iz = lo[2]!; iz <= hi[2]!; iz++) {
            const k = key(ix, iy, iz);
            const list = grid.get(k);
            if (list) list.push(t);
            else grid.set(k, [t]);
          }
    }
    let count = 0;
    const range2 = LAYER_RANGE * LAYER_RANGE;
    for (let o = 0; o < outer.length; o++) {
      candStart[o] = count;
      const i = outer[o]!;
      const px = x[i * 3]!,
        py = x[i * 3 + 1]!,
        pz = x[i * 3 + 2]!;
      const list = grid.get(key(Math.floor(px / CELL), Math.floor(py / CELL), Math.floor(pz / CELL)));
      if (!list) continue;
      const layer = vertexLayer[i]!;
      for (const t of list) {
        if (triLayer[t]! >= layer) continue;
        const d2 = closestOnTriangle(px, py, pz, x, triangles[t * 3]!, triangles[t * 3 + 1]!, triangles[t * 3 + 2]!, q);
        if (d2 > range2) continue;
        if (count === candidates.length) {
          const bigger = new Int32Array(candidates.length * 2);
          bigger.set(candidates);
          candidates = bigger;
        }
        candidates[count++] = t;
      }
    }
    candStart[outer.length] = count;
  }

  /**
   * Empurra para fora os vértices de cima que entraram (ou chegaram perto
   * demais) na camada de baixo. `invMass` 0 não se mexe. Devolve o maior
   * empurrão, em mm (0 sem contato).
   */
  function solve(invMass: Float64Array, prev: Float64Array, friction: Float64Array, onPush: (i: number, push: number) => void): number {
    let worst = 0;
    for (let o = 0; o < outer.length; o++) {
      const i = outer[o]!;
      if (invMass[i] === 0) continue;
      const px = x[i * 3]!,
        py = x[i * 3 + 1]!,
        pz = x[i * 3 + 2]!;
      let bestD2 = Infinity;
      let bestT = -1;
      let bx = 0,
        by = 0,
        bz = 0;
      for (let k = candStart[o]!; k < candStart[o + 1]!; k++) {
        const t = candidates[k]!;
        const d2 = closestOnTriangle(px, py, pz, x, triangles[t * 3]!, triangles[t * 3 + 1]!, triangles[t * 3 + 2]!, q);
        if (d2 < bestD2) {
          bestD2 = d2;
          bestT = t;
          bx = q[0]!;
          by = q[1]!;
          bz = q[2]!;
        }
      }
      if (bestT < 0) continue;
      triangleNormal(x, triangles[bestT * 3]!, triangles[bestT * 3 + 1]!, triangles[bestT * 3 + 2]!, nrm);
      const s = signs[bestT]!;
      const nx = nrm[0]! * s,
        ny = nrm[1]! * s,
        nz = nrm[2]! * s;
      if (nx === 0 && ny === 0 && nz === 0) continue;
      const side = (px - bx) * nx + (py - by) * ny + (pz - bz) * nz;
      const gap = LAYER_GAP + (thickness[i]! + triThick[bestT]!) / 2;
      if (side >= gap || side < -LAYER_MAX_DEPTH) continue;
      const push = gap - side;
      x[i * 3] = px + nx * push;
      x[i * 3 + 1] = py + ny * push;
      x[i * 3 + 2] = pz + nz * push;
      // Atrito com a camada de baixo, como com o corpo: tira parte do deslizamento.
      const mx = x[i * 3]! - prev[i * 3]!;
      const my = x[i * 3 + 1]! - prev[i * 3 + 1]!;
      const mz = x[i * 3 + 2]! - prev[i * 3 + 2]!;
      const along = mx * nx + my * ny + mz * nz;
      const f = friction[i]!;
      x[i * 3] = x[i * 3]! - (mx - along * nx) * f;
      x[i * 3 + 1] = x[i * 3 + 1]! - (my - along * ny) * f;
      x[i * 3 + 2] = x[i * 3 + 2]! - (mz - along * nz) * f;
      onPush(i, push);
      worst = Math.max(worst, push);
    }
    return worst;
  }

  return { refresh, solve, hasLayers: outer.length > 0 };
}
