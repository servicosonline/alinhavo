import type { Seam } from "@alinhavo/geometry";
import { MAX_OVERESTIMATE, TRUSTED_CLEARANCE_MM, type Collider, type Vec3 } from "./collider";
import { stretchCompliance, type Fabric } from "./fabrics";
import { createLayerSolver, outwardSigns } from "./layers";
import type { PieceMesh } from "./mesh";

/**
 * Simulação do tecido por XPBD (Macklin, Müller e Chentanez, 2016), no
 * esquema de "passos pequenos": vários subpassos por quadro, uma iteração de
 * restrições em cada. Implementação de referência em TypeScript, sem
 * dependências e sem DOM, para rodar num Web Worker. Unidades: mm, g e s.
 */

/**
 * Onde a parte começa no espaço: o ponto (u, v) do molde, em mm, vai para
 * origin + u·xAxis + v·yAxis. O padrão deixa a parte de pé no plano z = 0,
 * com o alto do molde para cima (o Y do molde cresce para baixo).
 */
export type Placement = { origin: Vec3; xAxis: Vec3; yAxis: Vec3 };

export const DEFAULT_PLACEMENT: Placement = {
  origin: { x: 0, y: 0, z: 0 },
  xAxis: { x: 1, y: 0, z: 0 },
  yAxis: { x: 0, y: -1, z: 0 },
};

/**
 * Uma parte na simulação. `initial` (x, y, z por vértice, em mm) dá a posição
 * 3D inicial pronta, por exemplo enrolada no corpo (`placeGarment`); sem ela,
 * vale `placement` (a parte plana). O repouso do tecido é sempre o do molde.
 * `fabric`: o tecido desta parte (padrão: o das opções), para um look com
 * roupas de tecidos diferentes. `layer`: a camada no look (0, padrão, é a de
 * dentro); uma parte não entra nas partes de camada menor (ver `layers.ts`).
 */
export type SimPiece = { mesh: PieceMesh; placement?: Placement; initial?: Float64Array; fabric?: Fabric; layer?: number };

/** Trecho de um segmento que fica sem costurar. */
export type SeamOpening = { piece: string; segment: number; from: number; to: number };

export type SimulationOptions = {
  /** Tecido das partes que não dizem o seu. */
  fabric: Fabric;
  seams?: Seam[];
  /**
   * Trechos de segmento que ficam sem costurar (zíper aberto): os pontos da
   * costura dentro do trecho, de qualquer um dos dois lados, não são puxados.
   * Fração do segmento no sentido da peça, como em `garmentAtSize(...).openings`.
   */
  openings?: SeamOpening[];
  colliders?: Collider[];
  /** mm/s². Padrão: 9810 para baixo (−y). */
  gravity?: Vec3;
  /** Subpassos por chamada de step. Padrão: 20. */
  substeps?: number;
  /** Amortecimento da velocidade, por segundo. Padrão: 1. */
  damping?: number;
  /**
   * Passadas pelas restrições em cada subpasso. Padrão: 1. Roupas inteiras
   * (muitas restrições encadeadas) convergem melhor com 2 ou 3.
   */
  iterations?: number;
  /** Velocidade com que as costuras se fecham, em mm/s. Padrão: 300. */
  seamClosingSpeed?: number;
  /**
   * Fase de costura, em s (padrão 0 = sem): a gravidade só entra quando as
   * costuras fecham (vão abaixo de 1 mm) ou quando esse tempo acaba. Sem ela,
   * uma roupa presa nos ombros (top de alças) cai antes de a alça se fechar.
   */
  sewingTime?: number;
};

export type Simulation = {
  /** x, y, z de cada vértice, em mm. Atualizado a cada step. */
  readonly positions: Float64Array;
  readonly vertexCount: number;
  /** Três índices (globais) por triângulo, na ordem de triangleStretch. */
  readonly triangles: Uint32Array;
  /** Índice do primeiro vértice de cada parte (pelo id da parte). */
  readonly pieceOffset: ReadonlyMap<string, number>;
  /** Tempo simulado, em s. */
  readonly time: number;
  /**
   * Avança `dt` segundos (padrão: um quadro de 1/60 s). `onSubstep` é chamado
   * antes de cada subpasso, com o tempo simulado: é onde o corpo em movimento
   * troca o colisor (`setColliders`).
   */
  step(dt?: number, onSubstep?: (time: number) => void): void;
  /**
   * Troca os obstáculos (o corpo em movimento). `movedMm`: quanto, no máximo,
   * a superfície deles andou desde a troca anterior. A folga guardada de cada
   * vértice cai esse tanto, para a pergunta ao corpo não ser pulada onde ele chegou perto.
   */
  setColliders(next: readonly Collider[], movedMm: number): void;
  /** Prende um vértice onde ele está (massa infinita). */
  pin(vertex: number): void;
  /** Esticamento de cada triângulo: maior (comprimento / repouso − 1) entre suas arestas. */
  triangleStretch(): Float64Array;
  /** Maior distância, em mm, entre dois pontos que uma costura deveria unir. */
  seamGap(): number;
  /** Se a gravidade já entrou (fase de costura terminada). */
  readonly sewn: boolean;
};

const MIN_DT = 1e-6;

/** Monta a simulação de um conjunto de partes (já em malha) costuradas entre si. */
/**
 * Folga (mm além da espessura `gap`) que a distância informada `distance`
 * garante, pelo contrato do Collider: só até TRUSTED_CLEARANCE_MM e com a
 * distância real pelo menos a informada ÷ MAX_OVERESTIMATE. Zero ou menos =
 * perguntar de novo no próximo subpasso.
 */
export function safeClearance(distance: number, gap: number): number {
  return Math.min(distance, gap + TRUSTED_CLEARANCE_MM) / MAX_OVERESTIMATE - gap;
}

export function createSimulation(pieces: SimPiece[], options: SimulationOptions): Simulation {
  const { fabric } = options;
  const gravity = options.gravity ?? { x: 0, y: -9810, z: 0 };
  const substeps = Math.max(1, Math.round(options.substeps ?? 20));
  const damping = Math.max(0, options.damping ?? 1);
  const closing = Math.max(0, options.seamClosingSpeed ?? 300);
  const iterations = Math.max(1, Math.round(options.iterations ?? 1));
  let colliders: readonly Collider[] = options.colliders ?? [];

  // --- Vértices e massa -----------------------------------------------------
  const pieceOffset = new Map<string, number>();
  let n = 0;
  for (const { mesh } of pieces) {
    if (pieceOffset.has(mesh.pieceId)) throw new Error(`A parte ${mesh.pieceId} entrou duas vezes na simulação.`);
    pieceOffset.set(mesh.pieceId, n);
    n += mesh.positions.length / 2;
  }
  const x = new Float64Array(n * 3);
  const prev = new Float64Array(n * 3);
  const v = new Float64Array(n * 3);
  const mass = new Float64Array(n);
  const invMass = new Float64Array(n);
  // Tecido por vértice e por restrição: cada parte pode ter o seu.
  const thickness = new Float64Array(n);
  const friction = new Float64Array(n);
  const vertexLayer = new Int32Array(n);
  const stretchMax: number[] = []; // (1 + maxStretch) por aresta
  const bendCompliance: number[] = []; // por par de flexão

  const triangles: number[] = [];
  const stretchEdges: number[] = []; // pares (i, j)
  const stretchRest: number[] = [];
  const stretchAlpha: number[] = [];
  const bendPairs: number[] = []; // pares (k, l): vértices opostos de dois triângulos vizinhos
  const bendRest: number[] = [];

  const restLength: number[] = []; // por lado de triângulo, no molde (2D)
  for (const { mesh, placement = DEFAULT_PLACEMENT, initial, fabric: own, layer = 0 } of pieces) {
    const off = pieceOffset.get(mesh.pieceId)!;
    const count = mesh.positions.length / 2;
    const pf = own ?? fabric;
    const densityPerMm2 = pf.density * 1e-6; // g/m² → g/mm²
    if (!Number.isInteger(layer) || layer < 0) throw new Error(`Camada inválida na parte ${mesh.pieceId}: ${layer}.`);
    thickness.fill(pf.thickness, off, off + count);
    friction.fill(pf.friction, off, off + count);
    vertexLayer.fill(layer, off, off + count);
    if (initial) {
      if (initial.length !== count * 3) throw new Error(`Posições iniciais da parte ${mesh.pieceId} não batem com a malha.`);
      x.set(initial, off * 3);
    } else {
      const { origin, xAxis, yAxis } = placement;
      for (let i = 0; i < count; i++) {
        const u = mesh.positions[i * 2]!;
        const w = mesh.positions[i * 2 + 1]!;
        const g = (off + i) * 3;
        x[g] = origin.x + u * xAxis.x + w * yAxis.x;
        x[g + 1] = origin.y + u * xAxis.y + w * yAxis.y;
        x[g + 2] = origin.z + u * xAxis.z + w * yAxis.z;
      }
    }
    for (let k = 0; k < mesh.triangles.length; k += 3) {
      for (let c = 0; c < 3; c++) {
        const a = mesh.triangles[k + c]!;
        const b = mesh.triangles[k + ((c + 1) % 3)]!;
        restLength.push(Math.hypot(mesh.positions[a * 2]! - mesh.positions[b * 2]!, mesh.positions[a * 2 + 1]! - mesh.positions[b * 2 + 1]!));
      }
    }
    for (let k = 0; k < mesh.triangles.length; k += 3) {
      const share = (mesh.restArea[k / 3]! * densityPerMm2) / 3;
      for (let c = 0; c < 3; c++) {
        const i = off + mesh.triangles[k + c]!;
        mass[i] = mass[i]! + share;
        triangles.push(i);
      }
    }
    for (let k = 0; k < mesh.edges.length; k += 2) {
      const a = mesh.edges[k]!;
      const b = mesh.edges[k + 1]!;
      stretchEdges.push(off + a, off + b);
      stretchRest.push(Math.hypot(mesh.positions[a * 2]! - mesh.positions[b * 2]!, mesh.positions[a * 2 + 1]! - mesh.positions[b * 2 + 1]!));
      stretchMax.push(1 + Math.max(0, pf.maxStretch));
      stretchAlpha.push(
        stretchCompliance(
          pf,
          mesh.grainCoords[b * 2]! - mesh.grainCoords[a * 2]!,
          mesh.grainCoords[b * 2 + 1]! - mesh.grainCoords[a * 2 + 1]!,
        ),
      );
    }
    const bendBefore = bendRest.length;
    collectBendPairs(mesh, off, bendPairs, bendRest);
    for (let k = bendBefore; k < bendRest.length; k++) bendCompliance.push(pf.bend);
  }
  for (let i = 0; i < n; i++) invMass[i] = mass[i]! > 0 ? 1 / mass[i]! : 0;
  prev.set(x);

  // --- Costuras -------------------------------------------------------------
  // Cada ponto de um lado é puxado até o ponto correspondente do outro (pela
  // posição relativa no segmento), interpolado entre dois vértices.
  const seamA: number[] = [];
  const seamB0: number[] = [];
  const seamB1: number[] = [];
  const seamW1: number[] = [];
  const seamStart: number[] = [];
  const meshById = new Map(pieces.map((p) => [p.mesh.pieceId, p.mesh]));
  for (const seam of options.seams ?? []) {
    const sideA = seamSide(meshById, pieceOffset, seam.a.piece, seam.a.segment);
    const sideB = seamSide(meshById, pieceOffset, seam.b.piece, seam.b.segment);
    if (!sideA || !sideB) continue;
    const openA = openingsOf(options.openings, seam.a.piece, seam.a.segment);
    const openB = openingsOf(options.openings, seam.b.piece, seam.b.segment);
    const link = (from: SeamSide, to: SeamSide, flip: boolean, openFrom: SeamOpening[], openTo: SeamOpening[]) => {
      for (let k = 0; k < from.vertices.length; k++) {
        const t = flip ? 1 - from.t[k]! : from.t[k]!;
        if (isOpen(openFrom, from.t[k]!) || isOpen(openTo, t)) continue;
        const { i0, i1, w1 } = pointAt(to, t);
        const a = from.vertices[k]!;
        seamA.push(a);
        seamB0.push(i0);
        seamB1.push(i1);
        seamW1.push(w1);
        seamStart.push(distanceToBlend(x, a, i0, i1, w1));
      }
    };
    const flip = seam.direction === "opposite";
    link(sideA, sideB, flip, openA, openB);
    link(sideB, sideA, flip, openB, openA);
  }

  // --- Camadas -------------------------------------------------------------
  // O lado de fora de cada triângulo é medido na posição inicial (ver layers.ts).
  const layers = createLayerSolver({
    x,
    triangles,
    vertexLayer,
    thickness,
    signs: vertexLayer.some((l) => l > 0) ? outwardSigns(x, triangles, colliders) : new Int8Array(triangles.length / 3),
  });

  let time = 0;
  const sewingTime = Math.max(0, options.sewingTime ?? 0);
  let sewn = sewingTime === 0;
  /** Costuras fechadas (vão ≤ 1 mm): só daí em diante o atrito segura (estático). */
  let closed = seamA.length === 0;

  // --- Restrições -----------------------------------------------------------
  function solveDistance(i: number, j: number, rest: number, alphaTilde: number) {
    const wi = invMass[i]!;
    const wj = invMass[j]!;
    const w = wi + wj;
    if (w === 0) return;
    const dx = x[i * 3]! - x[j * 3]!;
    const dy = x[i * 3 + 1]! - x[j * 3 + 1]!;
    const dz = x[i * 3 + 2]! - x[j * 3 + 2]!;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-12) return;
    const lambda = -(len - rest) / (w + alphaTilde);
    const s = lambda / len;
    x[i * 3] = x[i * 3]! + dx * s * wi;
    x[i * 3 + 1] = x[i * 3 + 1]! + dy * s * wi;
    x[i * 3 + 2] = x[i * 3 + 2]! + dz * s * wi;
    x[j * 3] = x[j * 3]! - dx * s * wj;
    x[j * 3 + 1] = x[j * 3 + 1]! - dy * s * wj;
    x[j * 3 + 2] = x[j * 3 + 2]! - dz * s * wj;
  }

  /** Aproxima o vértice a do ponto (1 − w1)·b0 + w1·b1 até a distância `rest`. */
  function solveSeam(a: number, b0: number, b1: number, w1: number, rest: number, alphaTilde: number) {
    const w0 = 1 - w1;
    const wa = invMass[a]!;
    const wb0 = invMass[b0]!;
    const wb1 = invMass[b1]!;
    const w = wa + w0 * w0 * wb0 + w1 * w1 * wb1;
    if (w === 0) return;
    const dx = x[a * 3]! - (w0 * x[b0 * 3]! + w1 * x[b1 * 3]!);
    const dy = x[a * 3 + 1]! - (w0 * x[b0 * 3 + 1]! + w1 * x[b1 * 3 + 1]!);
    const dz = x[a * 3 + 2]! - (w0 * x[b0 * 3 + 2]! + w1 * x[b1 * 3 + 2]!);
    const len = Math.hypot(dx, dy, dz);
    if (len <= rest || len < 1e-12) return; // costura só puxa, nunca empurra
    const lambda = -(len - rest) / (w + alphaTilde);
    const s = lambda / len;
    for (let c = 0; c < 3; c++) {
      const d = c === 0 ? dx : c === 1 ? dy : dz;
      x[a * 3 + c] = x[a * 3 + c]! + d * s * wa;
      x[b0 * 3 + c] = x[b0 * 3 + c]! - d * s * w0 * wb0;
      x[b1 * 3 + c] = x[b1 * 3 + c]! - d * s * w1 * wb1;
    }
  }

  /**
   * Folga conhecida de cada vértice até o obstáculo mais próximo (mm além da
   * espessura): a real é pelo menos esta, então enquanto o vértice não anda
   * isso não é preciso perguntar de novo. Vem da distância informada com o
   * teto e o desconto do contrato do Collider (`safeClearance`): longe da
   * pele a distância do manequim sai inflada, e confiar nela deixava um
   * vértice chegar ao ombro sem ser empurrado.
   */
  const clearance = new Float64Array(n).fill(-1);
  /**
   * Onde o vértice estava quando a folga foi medida: ela vale enquanto o
   * vértice não se afastar dali mais que ela (desigualdade triangular). Medir
   * o afastamento desde ali, e não o andado no subpasso, deixa uma segunda
   * passada de colisão no mesmo subpasso perguntar só a quem mexeu de novo.
   */
  const seenAt = Float64Array.from(x);
  /** Rodadas por subpasso: um empurrão para fora de uma parte pode cair dentro de outra (axila, gancho). */
  const COLLISION_PASSES = 3;

  const forgetClearance = (i: number) => {
    clearance[i] = -1;
  };

  function collide() {
    if (colliders.length === 0) return;
    for (let i = 0; i < n; i++) {
      if (invMass[i] === 0) continue;
      const gap = thickness[i]!;
      const moved = Math.hypot(x[i * 3]! - seenAt[i * 3]!, x[i * 3 + 1]! - seenAt[i * 3 + 1]!, x[i * 3 + 2]! - seenAt[i * 3 + 2]!);
      if (clearance[i]! - moved > 0) continue;
      let nearest = Infinity;
      for (let pass = 0; pass < COLLISION_PASSES; pass++) {
        nearest = Infinity;
        let pushed = false;
        for (const collider of colliders) {
          const { distance, normal } = collider.query(x[i * 3]!, x[i * 3 + 1]!, x[i * 3 + 2]!);
          nearest = Math.min(nearest, distance);
          if (distance >= gap) continue;
          pushed = true;
          nearest = Math.min(nearest, gap);
          const push = gap - distance;
          x[i * 3] = x[i * 3]! + normal.x * push;
          x[i * 3 + 1] = x[i * 3 + 1]! + normal.y * push;
          x[i * 3 + 2] = x[i * 3 + 2]! + normal.z * push;
          if (pass > 0) continue; // atrito uma vez por subpasso
          // Atrito de Coulomb, posicional: o deslize sobre a superfície neste
          // subpasso para inteiro se for menor que μ × o empurrão (atrito
          // estático); maior, perde μ × o empurrão. Sem o estático, a roupa só
          // freava e nunca parava: o cós da calça descia o quadril devagar,
          // abrindo a cada subpasso, sempre que o chão não segurava as pernas.
          // Até as costuras fecharem as partes precisam escorregar até se
          // encontrar: ali o atrito só freia (tira a fração μ do deslize), como antes.
          // Deslize em relação à superfície: num obstáculo que anda, desconta o quanto ela andou.
          const surface = collider.surfaceStep?.(x[i * 3]!, x[i * 3 + 1]!, x[i * 3 + 2]!);
          const mx = x[i * 3]! - prev[i * 3]! - (surface?.x ?? 0);
          const my = x[i * 3 + 1]! - prev[i * 3 + 1]! - (surface?.y ?? 0);
          const mz = x[i * 3 + 2]! - prev[i * 3 + 2]! - (surface?.z ?? 0);
          const along = mx * normal.x + my * normal.y + mz * normal.z;
          const tx = mx - along * normal.x;
          const ty = my - along * normal.y;
          const tz = mz - along * normal.z;
          const slip = Math.hypot(tx, ty, tz);
          const hold = friction[i]! * push;
          const k = !closed ? friction[i]! : slip <= hold ? 1 : hold / slip;
          x[i * 3] = x[i * 3]! - tx * k;
          x[i * 3 + 1] = x[i * 3 + 1]! - ty * k;
          x[i * 3 + 2] = x[i * 3 + 2]! - tz * k;
        }
        if (!pushed) break;
      }
      // Depois de mexer no vértice, a folga vale a partir da posição atual.
      clearance[i] = safeClearance(nearest, gap);
      seenAt[i * 3] = x[i * 3]!;
      seenAt[i * 3 + 1] = x[i * 3 + 1]!;
      seenAt[i * 3 + 2] = x[i * 3 + 2]!;
    }
  }

  /**
   * Limite de esticamento (strain limiting): nenhuma aresta passa de
   * (1 + maxStretch) × repouso. Só encurta, nunca empurra.
   */
  function limitStrain() {
    for (let k = 0; k < stretchRest.length; k++) {
      const i = stretchEdges[k * 2]!;
      const j = stretchEdges[k * 2 + 1]!;
      const limit = stretchRest[k]! * stretchMax[k]!;
      if (distanceBetween(x, i, j) > limit) solveDistance(i, j, limit, 0);
    }
  }

  function solveSeams(seamAlpha: number) {
    for (let k = 0; k < seamA.length; k++) {
      const rest = Math.max(0, seamStart[k]! - closing * time);
      solveSeam(seamA[k]!, seamB0[k]!, seamB1[k]!, seamW1[k]!, rest, seamAlpha);
    }
  }

  function substep(h: number) {
    const h2 = h * h;
    const gh = sewn ? h : 0; // sem gravidade durante a fase de costura
    for (let i = 0; i < n; i++) {
      if (invMass[i] === 0) continue;
      const g = i * 3;
      v[g] = v[g]! + gravity.x * gh;
      v[g + 1] = v[g + 1]! + gravity.y * gh;
      v[g + 2] = v[g + 2]! + gravity.z * gh;
      prev[g] = x[g]!;
      prev[g + 1] = x[g + 1]!;
      prev[g + 2] = x[g + 2]!;
      x[g] = x[g]! + v[g]! * h;
      x[g + 1] = x[g + 1]! + v[g + 1]! * h;
      x[g + 2] = x[g + 2]! + v[g + 2]! * h;
    }
    const seamAlpha = 1e-7 / h2;
    for (let it = 0; it < iterations; it++) {
      for (let k = 0; k < stretchRest.length; k++) {
        solveDistance(stretchEdges[k * 2]!, stretchEdges[k * 2 + 1]!, stretchRest[k]!, stretchAlpha[k]! / h2);
      }
      for (let k = 0; k < bendRest.length; k++) {
        solveDistance(bendPairs[k * 2]!, bendPairs[k * 2 + 1]!, bendRest[k]!, bendCompliance[k]! / h2);
      }
      // O limite de esticamento vem antes das costuras: elas têm a palavra
      // final, e a costura não abre (o esticamento a mais fica local, junto dela).
      limitStrain();
      solveSeams(seamAlpha);
    }
    collide();
    // A camada de cima por fim: o corpo já está resolvido para a de baixo.
    // Vértice empurrado pergunta de novo ao corpo no próximo subpasso.
    if (layers.hasLayers) layers.solve(invMass, prev, friction, forgetClearance);
    const keep = Math.max(0, 1 - damping * h);
    for (let i = 0; i < n; i++) {
      if (invMass[i] === 0) continue;
      for (let c = 0; c < 3; c++) {
        const g = i * 3 + c;
        v[g] = ((x[g]! - prev[g]!) / h) * keep;
      }
    }
    time += h;
  }

  function gapNow() {
    let worst = 0;
    for (let k = 0; k < seamA.length; k++) {
      worst = Math.max(worst, distanceToBlend(x, seamA[k]!, seamB0[k]!, seamB1[k]!, seamW1[k]!));
    }
    return worst;
  }

  return {
    positions: x,
    vertexCount: n,
    triangles: Uint32Array.from(triangles),
    pieceOffset,
    get time() {
      return time;
    },
    step(dt = 1 / 60, onSubstep) {
      if (!(dt > MIN_DT)) return;
      if (!sewn && (time >= sewingTime || gapNow() <= 1)) sewn = true;
      if (!closed && gapNow() <= 1) closed = true;
      const h = dt / substeps;
      if (layers.hasLayers) layers.refresh();
      for (let s = 0; s < substeps; s++) {
        onSubstep?.(time);
        substep(h);
      }
    },
    setColliders(next, movedMm) {
      colliders = [...next];
      const moved = Number.isFinite(movedMm) ? Math.max(0, movedMm) : Infinity;
      if (moved === 0) return;
      for (let i = 0; i < n; i++) clearance[i] = clearance[i]! - moved;
    },
    get sewn() {
      return sewn;
    },
    pin(vertex) {
      if (vertex < 0 || vertex >= n) throw new Error(`Vértice ${vertex} não existe.`);
      invMass[vertex] = 0;
      v[vertex * 3] = 0;
      v[vertex * 3 + 1] = 0;
      v[vertex * 3 + 2] = 0;
    },
    triangleStretch() {
      const out = new Float64Array(triangles.length / 3);
      for (let k = 0; k < triangles.length; k += 3) {
        let worst = -Infinity;
        for (let c = 0; c < 3; c++) {
          const len = distanceBetween(x, triangles[k + c]!, triangles[k + ((c + 1) % 3)]!);
          worst = Math.max(worst, len / restLength[k + c]! - 1);
        }
        out[k / 3] = worst;
      }
      return out;
    },
    seamGap: gapNow,
  };
}

// ---------------------------------------------------------------------------

type SeamSide = { vertices: number[]; t: number[] };

/**
 * Vértices (índice global) de um segmento do contorno, do início ao fim,
 * incluindo o vértice final (que é o início do segmento seguinte), com a
 * posição relativa de cada um (0 a 1).
 */
function seamSide(
  meshes: Map<string, PieceMesh>,
  offsets: Map<string, number>,
  pieceId: string,
  segment: number,
): SeamSide | null {
  const mesh = meshes.get(pieceId);
  if (!mesh) throw new Error(`A costura usa a parte ${pieceId}, que não está na simulação.`);
  const off = offsets.get(pieceId)!;
  const nb = mesh.boundaryCount;
  const local: number[] = [];
  for (let i = 0; i < nb; i++) if (mesh.boundarySegment[i] === segment) local.push(i);
  if (local.length === 0) return null;
  const end = (local.at(-1)! + 1) % nb;
  return {
    vertices: [...local, end].map((i) => off + i),
    t: [...local.map((i) => mesh.boundaryT[i]!), 1],
  };
}

function openingsOf(all: SeamOpening[] | undefined, piece: string, segment: number): SeamOpening[] {
  return (all ?? []).filter((o) => o.piece === piece && o.segment === segment);
}

const OPEN_EPS = 1e-6;

/**
 * O ponto na fração t está num trecho aberto. As pontas do trecho continuam
 * costuradas, menos a que cai na ponta do segmento (zíper que vai até a borda
 * deixa a borda solta).
 */
function isOpen(openings: SeamOpening[], t: number): boolean {
  return openings.some(
    (o) => (o.from <= OPEN_EPS ? t >= -OPEN_EPS : t > o.from + OPEN_EPS) && (o.to >= 1 - OPEN_EPS ? t <= 1 + OPEN_EPS : t < o.to - OPEN_EPS),
  );
}

/** Ponto do lado na posição t: dois vértices vizinhos e o peso do segundo. */
function pointAt(side: SeamSide, t: number): { i0: number; i1: number; w1: number } {
  const ts = side.t;
  let k = 0;
  while (k < ts.length - 2 && ts[k + 1]! < t) k++;
  const span = ts[k + 1]! - ts[k]!;
  const w1 = span > 0 ? Math.min(1, Math.max(0, (t - ts[k]!) / span)) : 0;
  return { i0: side.vertices[k]!, i1: side.vertices[k + 1]!, w1 };
}

function distanceBetween(x: Float64Array, i: number, j: number): number {
  return Math.hypot(x[i * 3]! - x[j * 3]!, x[i * 3 + 1]! - x[j * 3 + 1]!, x[i * 3 + 2]! - x[j * 3 + 2]!);
}

function distanceToBlend(x: Float64Array, a: number, b0: number, b1: number, w1: number): number {
  const w0 = 1 - w1;
  return Math.hypot(
    x[a * 3]! - (w0 * x[b0 * 3]! + w1 * x[b1 * 3]!),
    x[a * 3 + 1]! - (w0 * x[b0 * 3 + 1]! + w1 * x[b1 * 3 + 1]!),
    x[a * 3 + 2]! - (w0 * x[b0 * 3 + 2]! + w1 * x[b1 * 3 + 2]!),
  );
}

/**
 * Flexão: para cada aresta interna (compartilhada por dois triângulos), liga
 * os dois vértices opostos com uma restrição de distância mais fraca.
 */
function collectBendPairs(mesh: PieceMesh, off: number, pairs: number[], rest: number[]) {
  const opposite = new Map<number, number>();
  const t = mesh.triangles;
  for (let k = 0; k < t.length; k += 3) {
    for (let c = 0; c < 3; c++) {
      const a = t[k + c]!;
      const b = t[k + ((c + 1) % 3)]!;
      const o = t[k + ((c + 2) % 3)]!;
      const key = a < b ? a * 0x100000 + b : b * 0x100000 + a;
      const other = opposite.get(key);
      if (other === undefined) {
        opposite.set(key, o);
        continue;
      }
      pairs.push(off + o, off + other);
      rest.push(
        Math.hypot(mesh.positions[o * 2]! - mesh.positions[other * 2]!, mesh.positions[o * 2 + 1]! - mesh.positions[other * 2 + 1]!),
      );
    }
  }
}
