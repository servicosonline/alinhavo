/**
 * Os testes de bancada da calibração (`docs/10-calibracao-tecidos.md`)
 * montados na simulação, para comparar com o que foi medido no tecido real.
 *
 * - Régua na borda da mesa e caimento no disco: a simulação da Prova como ela
 *   roda (mesma malha, mesmas iterações), porque ali a carga é a gravidade,
 *   como no corpo.
 * - Tira com peso: o equilíbrio estático das mesmas restrições, resolvido
 *   direto (Newton). Um peso de 500 g na ponta de uma tira de ~1 g não
 *   converge com 2 iterações por subpasso: a simulação esticaria por erro
 *   numérico, não pelo tecido. A complacência é o material; quanto a Prova
 *   converge sob o corpo é outra pergunta, que o disco e as roupas respondem.
 */
import type { Piece, Point } from "@alinhavo/geometry";
import type { Collider, Vec3 } from "../collider";
import { stretchCompliance, type Fabric } from "../fabrics";
import { meshPiece, type PieceMesh } from "../mesh";
import { collectBendPairs, createSimulation, type Placement, type Simulation } from "../simulation";
import { CALIBRATION_ITERATIONS, CALIBRATION_SPACING } from "./settings";
import type { Direction } from "./measurements";

const GRAVITY = 9810; // mm/s²
const EPS = 1e-6;

/** Largura da tira na simulação, em mm. A queda e o esticamento por largura não dependem dela. */
export const BENCH_STRIP_WIDTH = 90;
/** Pedaço da tira da régua que fica sobre a mesa, em mm (a ponta de trás fica presa: o livro). */
export const BENCH_ON_TABLE = 60;
/** Comprimento da tira do peso na simulação, em mm (as marcas ficam no meio, como na real). */
export const BENCH_HANG_LENGTH = 300;
/** Disco de 18 cm e círculo de 30 cm (Cusick caseiro). */
export const DISC_RADIUS = 90;
export const DRAPE_CIRCLE_RADIUS = 150;

const TOP = 500; // altura do tampo e do disco, longe do chão

export type BenchOptions = { spacing?: number; iterations?: number; maxSeconds?: number };

/** Fio da parte para cada direção do teste: o comprimento da tira (o Y do molde) no fio, na trama ou no viés. */
function grainFor(d: Direction): { from: Point; to: Point } {
  if (d === "fio") return { from: { x: 0, y: 0 }, to: { x: 0, y: 100 } };
  if (d === "trama") return { from: { x: 0, y: 0 }, to: { x: 100, y: 0 } };
  return { from: { x: 0, y: 0 }, to: { x: 100, y: 100 } };
}

function rect(w: number, h: number, d: Direction): Piece {
  return {
    id: "amostra",
    name: "amostra",
    start: "A",
    points: { A: { x: 0, y: 0 }, B: { x: w, y: 0 }, C: { x: w, y: h }, D: { x: 0, y: h } },
    outline: ["B", "C", "D", "A"].map((to) => ({ kind: "line" as const, to })),
    seamAllowance: 0,
    grainline: grainFor(d),
  };
}

function circle(r: number): Piece {
  const k = 0.5522847498 * r;
  const c = r;
  return {
    id: "amostra",
    name: "amostra",
    start: "A",
    points: { A: { x: 2 * c, y: c }, B: { x: c, y: 2 * c }, C: { x: 0, y: c }, D: { x: c, y: 0 } },
    outline: [
      { kind: "cubic", c1: { x: 2 * c, y: c + k }, c2: { x: c + k, y: 2 * c }, to: "B" },
      { kind: "cubic", c1: { x: c - k, y: 2 * c }, c2: { x: 0, y: c + k }, to: "C" },
      { kind: "cubic", c1: { x: 0, y: c - k }, c2: { x: c - k, y: 0 }, to: "D" },
      { kind: "cubic", c1: { x: c + k, y: 0 }, c2: { x: 2 * c, y: c - k }, to: "A" },
    ],
    seamAllowance: 0,
    grainline: grainFor("fio"),
  };
}

const UP: Vec3 = { x: 0, y: 1, z: 0 };
function unit(x: number, y: number, z: number): Vec3 {
  const l = Math.hypot(x, y, z);
  return l > 1e-12 ? { x: x / l, y: y / l, z: z / l } : UP;
}

/** Caixa alinhada aos eixos (o tampo da mesa). Distância exata, então cumpre o contrato do Collider. */
export function boxCollider(min: Vec3, max: Vec3): Collider {
  const c = { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 };
  const h = { x: (max.x - min.x) / 2, y: (max.y - min.y) / 2, z: (max.z - min.z) / 2 };
  return {
    query(x, y, z) {
      const px = x - c.x;
      const py = y - c.y;
      const pz = z - c.z;
      const qx = Math.abs(px) - h.x;
      const qy = Math.abs(py) - h.y;
      const qz = Math.abs(pz) - h.z;
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const oz = Math.max(qz, 0);
      const outside = Math.hypot(ox, oy, oz);
      if (outside > 0) return { distance: outside, normal: unit(ox * Math.sign(px), oy * Math.sign(py), oz * Math.sign(pz)) };
      const m = Math.max(qx, qy, qz);
      const normal = m === qy ? { x: 0, y: Math.sign(py) || 1, z: 0 } : m === qx ? { x: Math.sign(px) || 1, y: 0, z: 0 } : { x: 0, y: 0, z: Math.sign(pz) || 1 };
      return { distance: m, normal };
    },
  };
}

/** Disco (cilindro de eixo vertical) com o topo em `top`. Distância exata. */
export function discCollider(center: { x: number; z: number }, top: number, radius: number, height = 15): Collider {
  const cy = top - height / 2;
  return {
    query(x, y, z) {
      const rx = x - center.x;
      const rz = z - center.z;
      const r = Math.hypot(rx, rz);
      const dr = r - radius;
      const dy = Math.abs(y - cy) - height / 2;
      const sy = Math.sign(y - cy) || 1;
      const radial = r > 1e-9 ? { x: rx / r, z: rz / r } : { x: 1, z: 0 };
      if (dr > 0 || dy > 0) {
        const a = Math.max(dr, 0);
        const b = Math.max(dy, 0);
        return { distance: Math.hypot(a, b), normal: unit(radial.x * a, sy * b, radial.z * a) };
      }
      return dr > dy
        ? { distance: dr, normal: { x: radial.x, y: 0, z: radial.z } }
        : { distance: dy, normal: { x: 0, y: sy, z: 0 } };
    },
  };
}

/** Roda até assentar: o maior deslocamento em meio segundo abaixo de `tol` mm. */
function settle(sim: Simulation, maxSeconds: number, tol = 0.05): { seconds: number; settled: boolean } {
  let last = Float64Array.from(sim.positions);
  for (let t = 0.5; t <= maxSeconds + EPS; t += 0.5) {
    for (let f = 0; f < 30; f++) sim.step();
    let moved = 0;
    for (let i = 0; i < last.length; i += 3) {
      moved = Math.max(moved, Math.hypot(sim.positions[i]! - last[i]!, sim.positions[i + 1]! - last[i + 1]!, sim.positions[i + 2]! - last[i + 2]!));
    }
    last = Float64Array.from(sim.positions);
    if (moved < tol) return { seconds: t, settled: true };
  }
  return { seconds: maxSeconds, settled: false };
}

export type CantileverResult = { dropMm: number; settled: boolean; seconds: number };

/**
 * Régua na borda da mesa: tira de BENCH_STRIP_WIDTH deitada no tampo, com
 * `overhangMm` para fora, a ponta de trás presa. Devolve quanto a ponta caiu
 * abaixo do tampo (média da borda da ponta).
 */
export function cantileverDrop(fabric: Fabric, overhangMm: number, options: BenchOptions = {}): CantileverResult {
  const spacing = options.spacing ?? CALIBRATION_SPACING;
  const length = BENCH_ON_TABLE + overhangMm;
  const mesh = meshPiece(rect(BENCH_STRIP_WIDTH, length, "fio"), { spacing });
  const surface = TOP + fabric.thickness;
  // O Y do molde (comprimento) vai para +z; a borda da mesa fica em z = 0.
  const placement: Placement = {
    origin: { x: -BENCH_STRIP_WIDTH / 2, y: surface, z: -BENCH_ON_TABLE },
    xAxis: { x: 1, y: 0, z: 0 },
    yAxis: { x: 0, y: 0, z: 1 },
  };
  const table = boxCollider({ x: -1000, y: 0, z: -1000 }, { x: 1000, y: TOP, z: 0 });
  const sim = createSimulation([{ mesh, placement }], {
    fabric,
    colliders: [table],
    iterations: options.iterations ?? CALIBRATION_ITERATIONS,
  });
  const tip: number[] = [];
  for (let i = 0; i < mesh.positions.length / 2; i++) {
    const v = mesh.positions[i * 2 + 1]!;
    if (v <= EPS) sim.pin(i);
    if (v >= length - EPS) tip.push(i);
  }
  const { settled, seconds } = settle(sim, options.maxSeconds ?? 20);
  const drop = tip.reduce((s, i) => s + (surface - sim.positions[i * 3 + 1]!), 0) / tip.length;
  return { dropMm: drop, settled, seconds };
}

export type HangResult = {
  /** Esticamento entre as marcas (fração). */
  strain: number;
  /** Alguma aresta entre as marcas chegou no limite de esticamento (`maxStretch`): o limite manda, não a complacência. */
  limited: boolean;
  converged: boolean;
};

/**
 * Tira com peso: tira de BENCH_STRIP_WIDTH × BENCH_HANG_LENGTH, a borda de
 * cima presa, `loadG` gramas pendurados numa tira real de `realWidthMm`
 * (a carga por largura é a mesma). Equilíbrio estático, no plano, das mesmas
 * restrições da simulação (esticamento por aresta pela direção do fio, pares
 * de flexão e o limite de esticamento), por Newton.
 */
export function hangStrain(fabric: Fabric, direction: Direction, loadG: number, realWidthMm: number, options: BenchOptions = {}): HangResult {
  const spacing = options.spacing ?? CALIBRATION_SPACING;
  const mesh = meshPiece(rect(BENCH_STRIP_WIDTH, BENCH_HANG_LENGTH, direction), { spacing });
  const totalForce = loadG * GRAVITY * (BENCH_STRIP_WIDTH / realWidthMm);
  return solveHang(mesh, fabric, totalForce);
}

type Spring = { i: number; j: number; rest: number; k: number; limit: number };

function springsOf(mesh: PieceMesh, fabric: Fabric): Spring[] {
  const out: Spring[] = [];
  const p = mesh.positions;
  const g = mesh.grainCoords;
  for (let e = 0; e < mesh.edges.length; e += 2) {
    const i = mesh.edges[e]!;
    const j = mesh.edges[e + 1]!;
    const rest = Math.hypot(p[i * 2]! - p[j * 2]!, p[i * 2 + 1]! - p[j * 2 + 1]!);
    const alpha = stretchCompliance(fabric, g[j * 2]! - g[i * 2]!, g[j * 2 + 1]! - g[i * 2 + 1]!);
    out.push({ i, j, rest, k: 1 / alpha, limit: rest * (1 + Math.max(0, fabric.maxStretch)) });
  }
  const pairs: number[] = [];
  const rests: number[] = [];
  collectBendPairs(mesh, 0, pairs, rests);
  for (let b = 0; b < rests.length; b++) {
    out.push({ i: pairs[b * 2]!, j: pairs[b * 2 + 1]!, rest: rests[b]!, k: 1 / fabric.bend, limit: Infinity });
  }
  return out;
}

function solveHang(mesh: PieceMesh, fabric: Fabric, totalForce: number): HangResult {
  const n = mesh.positions.length / 2;
  const rest = mesh.positions;
  const springs = springsOf(mesh, fabric);
  const free: number[] = []; // dof livre → índice no vetor
  const dofIndex = new Int32Array(n * 2).fill(-1);
  const bottom: number[] = [];
  for (let i = 0; i < n; i++) {
    const v = rest[i * 2 + 1]!;
    if (v >= BENCH_HANG_LENGTH - EPS) bottom.push(i);
    if (v <= EPS) continue; // presa
    dofIndex[i * 2] = free.length;
    free.push(i * 2);
    dofIndex[i * 2 + 1] = free.length;
    free.push(i * 2 + 1);
  }
  // Carga: o peso na borda de baixo (dividido pelos vértices dela) e o peso da própria tira, no sentido do Y do molde (para baixo).
  const fext = new Float64Array(n * 2);
  for (const i of bottom) fext[i * 2 + 1] = fext[i * 2 + 1]! + totalForce / bottom.length;
  const density = fabric.density * 1e-6;
  for (let t = 0; t < mesh.triangles.length; t += 3) {
    const share = (mesh.restArea[t / 3]! * density * GRAVITY) / 3;
    for (let c = 0; c < 3; c++) fext[mesh.triangles[t + c]! * 2 + 1] = fext[mesh.triangles[t + c]! * 2 + 1]! + share;
  }

  const x = Float64Array.from(rest);
  const kMax = springs.reduce((m, s) => Math.max(m, s.k), 0);
  const limited = new Set<number>();
  let converged = false;
  for (let round = 0; round < 8; round++) {
    converged = newton(x, springs, limited, kMax, fext, free, dofIndex);
    let grew = false;
    springs.forEach((s, idx) => {
      if (limited.has(idx) || s.limit === Infinity) return;
      if (Math.hypot(x[s.i * 2]! - x[s.j * 2]!, x[s.i * 2 + 1]! - x[s.j * 2 + 1]!) > s.limit * (1 + 1e-6)) {
        limited.add(idx);
        grew = true;
      }
    });
    if (!grew) break;
  }

  // Esticamento entre as marcas: inclinação do Y deformado pelo Y do molde, no meio da tira (longe das bordas presas e do peso).
  const gaugeFrom = (BENCH_HANG_LENGTH - 200) / 2;
  const gaugeTo = gaugeFrom + 200;
  const pick = (uLo: number, uHi: number) => {
    const ids: number[] = [];
    for (let i = 0; i < n; i++) {
      const u = rest[i * 2]!;
      const v = rest[i * 2 + 1]!;
      if (v >= gaugeFrom - EPS && v <= gaugeTo + EPS && u >= uLo - EPS && u <= uHi + EPS) ids.push(i);
    }
    return ids;
  };
  let ids = pick(BENCH_STRIP_WIDTH / 4, (3 * BENCH_STRIP_WIDTH) / 4);
  if (ids.length < 3) ids = pick(0, BENCH_STRIP_WIDTH);
  let sv = 0;
  let sy = 0;
  for (const i of ids) {
    sv += rest[i * 2 + 1]!;
    sy += x[i * 2 + 1]!;
  }
  const mv = sv / ids.length;
  const my = sy / ids.length;
  let num = 0;
  let den = 0;
  for (const i of ids) {
    num += (rest[i * 2 + 1]! - mv) * (x[i * 2 + 1]! - my);
    den += (rest[i * 2 + 1]! - mv) ** 2;
  }
  const strain = num / den - 1;
  const gaugeLimited = [...limited].some((idx) => {
    const s = springs[idx]!;
    const vi = rest[s.i * 2 + 1]!;
    const vj = rest[s.j * 2 + 1]!;
    return Math.max(vi, vj) >= gaugeFrom && Math.min(vi, vj) <= gaugeTo;
  });
  return { strain, limited: gaugeLimited, converged };
}

/** Newton com busca em linha na energia das molas (2D). Molas no limite viram quase rígidas no comprimento do limite. */
function newton(
  x: Float64Array,
  springs: Spring[],
  limited: Set<number>,
  kMax: number,
  fext: Float64Array,
  free: number[],
  dofIndex: Int32Array,
): boolean {
  const m = free.length;
  const stiff = (idx: number, s: Spring) => (limited.has(idx) ? { k: kMax * 1e3, rest: s.limit } : { k: s.k, rest: s.rest });
  const energy = (pos: Float64Array) => {
    let e = 0;
    springs.forEach((s, idx) => {
      const { k, rest } = stiff(idx, s);
      const l = Math.hypot(pos[s.i * 2]! - pos[s.j * 2]!, pos[s.i * 2 + 1]! - pos[s.j * 2 + 1]!);
      e += 0.5 * k * (l - rest) ** 2;
    });
    for (const d of free) e -= fext[d]! * pos[d]!;
    return e;
  };
  for (let it = 0; it < 80; it++) {
    const H = new Float64Array(m * m);
    const r = new Float64Array(m); // força resultante (= −gradiente)
    for (let a = 0; a < m; a++) r[a] = fext[free[a]!]!;
    springs.forEach((s, idx) => {
      const { k, rest } = stiff(idx, s);
      const dx = x[s.i * 2]! - x[s.j * 2]!;
      const dy = x[s.i * 2 + 1]! - x[s.j * 2 + 1]!;
      const l = Math.hypot(dx, dy);
      if (l < 1e-12) return;
      const nx = dx / l;
      const ny = dy / l;
      const f = k * (l - rest);
      const t = Math.max(0, 1 - rest / l); // parte geométrica, só quando esticada (mantém a matriz positiva)
      const hxx = k * (nx * nx + t * (1 - nx * nx));
      const hyy = k * (ny * ny + t * (1 - ny * ny));
      const hxy = k * (nx * ny * (1 - t));
      const di = [dofIndex[s.i * 2]!, dofIndex[s.i * 2 + 1]!];
      const dj = [dofIndex[s.j * 2]!, dofIndex[s.j * 2 + 1]!];
      const block = [
        [hxx, hxy],
        [hxy, hyy],
      ];
      const fi = [-f * nx, -f * ny];
      for (let p = 0; p < 2; p++) {
        if (di[p]! >= 0) r[di[p]!] = r[di[p]!]! + fi[p]!;
        if (dj[p]! >= 0) r[dj[p]!] = r[dj[p]!]! - fi[p]!;
        for (let q = 0; q < 2; q++) {
          const h = block[p]![q]!;
          if (di[p]! >= 0 && di[q]! >= 0) add(H, di[p]! * m + di[q]!, h);
          if (dj[p]! >= 0 && dj[q]! >= 0) add(H, dj[p]! * m + dj[q]!, h);
          if (di[p]! >= 0 && dj[q]! >= 0) add(H, di[p]! * m + dj[q]!, -h);
          if (dj[p]! >= 0 && di[q]! >= 0) add(H, dj[p]! * m + di[q]!, -h);
        }
      }
    });
    for (let a = 0; a < m; a++) add(H, a * m + a, kMax * 1e-12);
    const step = solveDense(H, r, m);
    if (!step) return false;
    const e0 = energy(x);
    let scale = 1;
    const trial = new Float64Array(x);
    for (let tries = 0; tries < 30; tries++) {
      trial.set(x);
      for (let a = 0; a < m; a++) trial[free[a]!] = x[free[a]!]! + scale * step[a]!;
      if (energy(trial) <= e0 + 1e-9 * Math.abs(e0)) break;
      scale /= 2;
    }
    let biggest = 0;
    for (let a = 0; a < m; a++) {
      biggest = Math.max(biggest, Math.abs(trial[free[a]!]! - x[free[a]!]!));
      x[free[a]!] = trial[free[a]!]!;
    }
    if (biggest < 1e-7) return true;
  }
  return false;
}

/** Eliminação de Gauss com pivô parcial (a matriz é pequena: ~100 graus de liberdade). */
function solveDense(A: Float64Array, b: Float64Array, m: number): Float64Array | null {
  const M = Float64Array.from(A);
  const y = Float64Array.from(b);
  for (let c = 0; c < m; c++) {
    let piv = c;
    for (let r = c + 1; r < m; r++) if (Math.abs(M[r * m + c]!) > Math.abs(M[piv * m + c]!)) piv = r;
    if (Math.abs(M[piv * m + c]!) < 1e-300) return null;
    if (piv !== c) {
      for (let k = 0; k < m; k++) {
        const t = M[c * m + k]!;
        M[c * m + k] = M[piv * m + k]!;
        M[piv * m + k] = t;
      }
      const t = y[c]!;
      y[c] = y[piv]!;
      y[piv] = t;
    }
    for (let r = c + 1; r < m; r++) {
      const f = M[r * m + c]! / M[c * m + c]!;
      if (f === 0) continue;
      for (let k = c; k < m; k++) M[r * m + k] = M[r * m + k]! - f * M[c * m + k]!;
      y[r] = y[r]! - f * y[c]!;
    }
  }
  const out = new Float64Array(m);
  for (let r = m - 1; r >= 0; r--) {
    let s = y[r]!;
    for (let k = r + 1; k < m; k++) s -= M[r * m + k]! * out[k]!;
    out[r] = s / M[r * m + r]!;
  }
  return out;
}

export type DrapeResult = {
  /** Coeficiente de caimento: (sombra − disco) ÷ (círculo − disco). 1 = armado, 0 = cai reto. */
  cc: number;
  /** Ondas da borda (máximos do raio, aproximado: a malha da Prova tem poucos pontos na borda). */
  waves: number;
  shadowAreaMm2: number;
  settled: boolean;
  seconds: number;
};

/** Caimento no disco: círculo de 30 cm centrado num disco de 18 cm, solto e deixado assentar. */
export function discDrape(fabric: Fabric, options: BenchOptions = {}): DrapeResult {
  const spacing = options.spacing ?? CALIBRATION_SPACING;
  const R = DRAPE_CIRCLE_RADIUS;
  const mesh = meshPiece(circle(R), { spacing });
  const placement: Placement = {
    origin: { x: -R, y: TOP + fabric.thickness + 0.5, z: -R },
    xAxis: { x: 1, y: 0, z: 0 },
    yAxis: { x: 0, y: 0, z: 1 },
  };
  const sim = createSimulation([{ mesh, placement }], {
    fabric,
    colliders: [discCollider({ x: 0, z: 0 }, TOP, DISC_RADIUS)],
    iterations: options.iterations ?? CALIBRATION_ITERATIONS,
  });
  const { settled, seconds } = settle(sim, options.maxSeconds ?? 20);
  const nb = mesh.boundaryCount;
  let area = 0;
  for (let i = 0; i < nb; i++) {
    const j = (i + 1) % nb;
    area += sim.positions[i * 3]! * sim.positions[j * 3 + 2]! - sim.positions[j * 3]! * sim.positions[i * 3 + 2]!;
  }
  const shadow = Math.abs(area) / 2;
  const disc = Math.PI * DISC_RADIUS ** 2;
  const cc = (shadow - disc) / (Math.PI * R * R - disc);
  // Ondas: máximos locais do raio pela volta, acima do raio médio.
  const ring = Array.from({ length: nb }, (_, i) => {
    const px = sim.positions[i * 3]!;
    const pz = sim.positions[i * 3 + 2]!;
    return { a: Math.atan2(pz, px), r: Math.hypot(px, pz) };
  }).sort((p, q) => p.a - q.a);
  const smooth = ring.map((_, i) => (ring[(i - 1 + nb) % nb]!.r + ring[i]!.r + ring[(i + 1) % nb]!.r) / 3);
  const mean = smooth.reduce((s, r) => s + r, 0) / nb;
  let waves = 0;
  for (let i = 0; i < nb; i++) {
    const r = smooth[i]!;
    if (r > mean && r > smooth[(i - 1 + nb) % nb]! && r >= smooth[(i + 1) % nb]!) waves++;
  }
  return { cc, waves, shadowAreaMm2: shadow, settled, seconds };
}

function add(a: Float64Array, i: number, v: number) {
  a[i] = a[i]! + v;
}
