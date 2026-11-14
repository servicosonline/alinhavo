import type { Collider } from "./collider";

/**
 * Mapas da Prova: pressão (quanto o tecido está esticado) e folga (quanto
 * sobra até o corpo), por vértice, para colorir a roupa.
 */

/**
 * Esticamento por vértice: média do esticamento dos triângulos em volta
 * (fração: 0,05 = 5%). Negativo é tecido folgado (mais curto que no molde).
 */
export function vertexStretch(triangles: Uint32Array, triangleStretch: Float64Array, vertexCount: number): Float64Array {
  const sum = new Float64Array(vertexCount);
  const count = new Uint32Array(vertexCount);
  for (let k = 0; k < triangleStretch.length; k++) {
    const s = triangleStretch[k]!;
    for (let c = 0; c < 3; c++) {
      const v = triangles[k * 3 + c]!;
      sum[v] = sum[v]! + s;
      count[v] = count[v]! + 1;
    }
  }
  for (let v = 0; v < vertexCount; v++) sum[v] = count[v]! > 0 ? sum[v]! / count[v]! : 0;
  return sum;
}

/**
 * Folga por vértice, em mm: distância até o obstáculo mais próximo menos a
 * espessura do tecido (encostado = 0). Passe só o corpo, sem o chão.
 */
export function vertexClearance(positions: Float64Array, colliders: readonly Collider[], thickness: number): Float64Array {
  const n = positions.length / 3;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let d = Infinity;
    for (const c of colliders) d = Math.min(d, c.query(positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!).distance);
    out[i] = Math.max(0, d - thickness);
  }
  return out;
}

export type MapSummary = {
  /** Maior esticamento de um triângulo (fração). Costuma ser um pico local junto às costuras. */
  maxStretch: number;
  /**
   * Esticamento abaixo do qual está 98% da área da roupa (fração). É o
   * número para mostrar: não é dominado por poucos triângulos de costura.
   */
  highStretch: number;
  /** Parte da área da roupa (0 a 1) com esticamento acima de `nearLimit` × limite do tecido. */
  areaNearLimit: number;
  /** Menor e maior folga entre os vértices, em mm. */
  minClearance: number;
  maxClearance: number;
};

/** Parte da área (a mais esticada) que fica acima de highStretch. */
const HIGH_AREA = 0.02;

/** Resumo dos mapas para a leitura em texto. `restArea` é a área de cada triângulo no molde. */
export function summarizeMaps(
  triangleStretch: Float64Array,
  restArea: Float64Array,
  clearance: Float64Array,
  fabricLimit: number,
  nearLimit = 0.8,
): MapSummary {
  let maxStretch = 0;
  let total = 0;
  let tight = 0;
  for (let k = 0; k < triangleStretch.length; k++) {
    const s = triangleStretch[k]!;
    const a = restArea[k] ?? 0;
    maxStretch = Math.max(maxStretch, s);
    total += a;
    if (s > fabricLimit * nearLimit) tight += a;
  }
  // Percentil por área: ordena do mais esticado e anda até cobrir 2% da área.
  const order = Array.from(triangleStretch.keys()).sort((a, b) => triangleStretch[b]! - triangleStretch[a]!);
  let covered = 0;
  let highStretch = 0;
  for (const k of order) {
    covered += restArea[k] ?? 0;
    highStretch = triangleStretch[k]!;
    if (covered >= total * HIGH_AREA) break;
  }
  let minClearance = Infinity;
  let maxClearance = 0;
  for (const c of clearance) {
    minClearance = Math.min(minClearance, c);
    maxClearance = Math.max(maxClearance, c);
  }
  return {
    maxStretch,
    highStretch: Math.max(0, highStretch),
    areaNearLimit: total > 0 ? tight / total : 0,
    minClearance: Number.isFinite(minClearance) ? minClearance : 0,
    maxClearance,
  };
}
