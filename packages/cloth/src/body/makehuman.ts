import { BELLY_RANGE } from "./mannequin";
import { readMeasurements, type MeasurementKey, type MeasurementReading } from "./measurements";

/**
 * Corpo realista (Fase 7, M2): leitura do arquivo compacto gerado por
 * `scripts/makehuman-convert.mjs` (dados do MakeHuman, CC0; nenhum código
 * dele) e o ajuste dos targets às medidas da tabela por mínimos quadrados.
 *
 * Unidades: mm. Coordenadas do MakeHuman, que já são as da Prova (Y para
 * cima, frente em +Z, esquerda do corpo em +X); o chão vai para y = 0 no ajuste.
 */

export type Sparse = { idx: Uint16Array; d: Float32Array };

export type JointId =
  | "quadrilE"
  | "joelhoE"
  | "tornozeloE"
  | "quadrilD"
  | "joelhoD"
  | "tornozeloD"
  | "ombroE"
  | "cotoveloE"
  | "punhoE"
  | "ombroD"
  | "cotoveloD"
  | "punhoD"
  | "pescoco"
  | "cabeca";

/** Grupos de pele, na ordem do arquivo (índice = número do grupo nos pesos). */
export const SKIN_GROUPS = [
  "tronco",
  "bracoE",
  "antebracoE",
  "maoE",
  "bracoD",
  "antebracoD",
  "maoD",
  "coxaE",
  "canelaE",
  "peE",
  "coxaD",
  "canelaD",
  "peD",
] as const;
export type SkinGroup = (typeof SKIN_GROUPS)[number];

export type MakeHumanAsset = {
  /** Vértices guardados: os de desenho e, depois deles, os auxiliares das articulações. */
  vertexCount: number;
  drawnCount: number;
  triangles: Uint32Array;
  /** Base feminina (x, y, z em mm por vértice, todos os vértices). */
  base: Float32Array;
  /** Até 4 grupos e pesos por vértice de desenho. */
  skinGroups: Uint8Array;
  skinWeights: Float32Array;
  joints: Record<JointId, Uint16Array>;
  targets: Record<string, { incr: Sparse; decr?: Sparse }>;
  source: { repositorio: string; commit: string; licenca: string; arquivos: string[] };
};

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeBase64(s: string): Uint8Array {
  const lookup = new Uint8Array(128);
  for (let i = 0; i < B64.length; i++) lookup[B64.charCodeAt(i)] = i;
  let len = s.length;
  while (len > 0 && s[len - 1] === "=") len--;
  const out = new Uint8Array(Math.floor((len * 3) / 4));
  let o = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[s.charCodeAt(i)]!;
    const b = lookup[s.charCodeAt(i + 1)]!;
    const c = i + 2 < len ? lookup[s.charCodeAt(i + 2)]! : 0;
    const d = i + 3 < len ? lookup[s.charCodeAt(i + 3)]! : 0;
    const n = (a << 18) | (b << 12) | (c << 6) | d;
    if (o < out.length) out[o++] = (n >> 16) & 255;
    if (o < out.length) out[o++] = (n >> 8) & 255;
    if (o < out.length) out[o++] = n & 255;
  }
  return out;
}

type Header = {
  formato: number;
  origem: MakeHumanAsset["source"];
  vertices: number;
  desenho: number;
  triangulos: number;
  grupos: string[];
  articulacoes: Record<JointId, number[]>;
  targets: { id: string; tipo: "incr" | "decr"; n: number }[];
};

/** Lê o arquivo do corpo realista (o texto em base64 de `makehuman-data.ts`). */
export function decodeMakeHuman(data: string): MakeHumanAsset {
  const bytes = decodeBase64(data);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerLength = view.getUint32(0, true);
  let text = "";
  for (let i = 0; i < headerLength; i++) text += String.fromCharCode(bytes[4 + i]!);
  const header = JSON.parse(text) as Header;
  if (header.formato !== 1) throw new Error("Formato do corpo realista desconhecido.");
  if (header.grupos.join() !== SKIN_GROUPS.join()) throw new Error("Grupos do corpo realista diferentes dos esperados.");
  let at = 4 + headerLength + (headerLength % 2);
  const take = (n: number): Uint8Array => {
    const part = bytes.slice(at, at + n);
    at += n + (n % 2);
    return part;
  };
  const u16 = (n: number) => new Uint16Array(take(n * 2).buffer);
  const i16 = (n: number) => new Int16Array(take(n * 2).buffer);
  const triangles = Uint32Array.from(u16(header.triangulos * 3));
  const baseQ = i16(header.vertices * 3);
  const base = new Float32Array(baseQ.length);
  for (let i = 0; i < base.length; i++) base[i] = baseQ[i]! / 10;
  const skin = take(header.desenho * 8);
  const skinGroups = new Uint8Array(header.desenho * 4);
  const skinWeights = new Float32Array(header.desenho * 4);
  for (let i = 0; i < header.desenho * 4; i++) {
    skinGroups[i] = skin[i * 2]!;
    skinWeights[i] = skin[i * 2 + 1]! / 255;
  }
  const targets: MakeHumanAsset["targets"] = {};
  for (const t of header.targets) {
    const idx = u16(t.n);
    const dq = i16(t.n * 3);
    const d = new Float32Array(dq.length);
    for (let i = 0; i < d.length; i++) d[i] = dq[i]! / 10;
    const entry = (targets[t.id] ??= { incr: { idx: new Uint16Array(0), d: new Float32Array(0) } });
    if (t.tipo === "incr") entry.incr = { idx, d };
    else entry.decr = { idx, d };
  }
  const joints = Object.fromEntries(Object.entries(header.articulacoes).map(([k, v]) => [k, Uint16Array.from(v)])) as Record<JointId, Uint16Array>;
  return {
    vertexCount: header.vertices,
    drawnCount: header.desenho,
    triangles,
    base,
    skinGroups,
    skinWeights,
    joints,
    targets,
    source: header.origem,
  };
}

// ---------------------------------------------------------------------------
// Forma
// ---------------------------------------------------------------------------

export type BodySex = "feminino" | "masculino";
export const BODY_SEXES: readonly BodySex[] = ["feminino", "masculino"];

/** Targets ajustados às medidas (cada um de −PARAM_LIMIT a +PARAM_LIMIT; positivo usa o "incr"). */
const PARAMS = [
  "busto",
  "cintura",
  "quadril",
  "alturaDoQuadril",
  "coxaAltura",
  "canelaAltura",
  "bracoComprimento",
  "antebracoComprimento",
  "punho",
  "ombro",
  "pescoco",
  "coxa",
  "joelho",
  "tornozelo",
  "braco",
  "costas",
  "peso",
] as const;
type Param = (typeof PARAMS)[number];

/** Até onde cada target vai (o MakeHuman vai de −1 a 1; um pouco além ainda dá um corpo plausível). */
export const PARAM_LIMIT = 1.5;

const targetId = (p: Param, sex: BodySex) => (p === "peso" ? (sex === "feminino" ? "pesoF" : "pesoM") : p);

function addSparse(pos: Float32Array, t: Sparse, w: number) {
  const { idx, d } = t;
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k]! * 3;
    pos[i] = pos[i]! + d[k * 3]! * w;
    pos[i + 1] = pos[i + 1]! + d[k * 3 + 1]! * w;
    pos[i + 2] = pos[i + 2]! + d[k * 3 + 2]! * w;
  }
}

/** Soma (factor 1) ou tira (−1) o target `id` no peso w: positivo usa o "incr", negativo o "decr". */
function addParam(asset: MakeHumanAsset, pos: Float32Array, id: string, w: number, factor = 1) {
  if (w === 0) return;
  const t = asset.targets[id];
  if (!t) throw new Error(`Target ${id} ausente no corpo realista.`);
  if (w > 0) addSparse(pos, t.incr, w * factor);
  else if (t.decr) addSparse(pos, t.decr, -w * factor);
  else addSparse(pos, t.incr, w * factor);
}

/** Posições (sem escala) da base com os targets nesses pesos. */
export function shapePositions(asset: MakeHumanAsset, sex: BodySex, weights: Partial<Record<Param, number>>): Float32Array {
  const pos = Float32Array.from(asset.base);
  if (sex === "masculino") addParam(asset, pos, "masculino", 1);
  for (const p of PARAMS) addParam(asset, pos, targetId(p, sex), weights[p] ?? 0);
  return pos;
}

// ---------------------------------------------------------------------------
// Medidas na malha
// ---------------------------------------------------------------------------

type Vec = { x: number; y: number; z: number };

/** Dados fixos de uma malha (grupos, máscaras de triângulos), calculados uma vez por arquivo. */
type Topology = {
  dominant: Uint8Array;
  masks: Record<"semBraco" | "semBracoE" | "semBracoD" | "pernaE" | "pernaD" | "canelaE" | "canelaD" | "bracoE" | "bracoD" | "antebracoE" | "antebracoD", Uint8Array>;
  /** Vértices de desenho na linha do meio (x ≈ 0). */
  midline: Uint32Array;
};

const topologies = new WeakMap<MakeHumanAsset, Topology>();

function topology(asset: MakeHumanAsset): Topology {
  const cached = topologies.get(asset);
  if (cached) return cached;
  const n = asset.drawnCount;
  const dominant = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (asset.skinWeights[i * 4 + k]! > asset.skinWeights[i * 4 + best]!) best = k;
    dominant[i] = asset.skinGroups[i * 4 + best]!;
  }
  const g = (name: SkinGroup) => SKIN_GROUPS.indexOf(name);
  const arm = new Set([g("bracoE"), g("antebracoE"), g("maoE"), g("bracoD"), g("antebracoD"), g("maoD")]);
  const base = asset.base;
  const tri = asset.triangles;
  const count = tri.length / 3;
  const mask = (keep: (v: number) => boolean) => {
    const m = new Uint8Array(count);
    for (let t = 0; t < count; t++) m[t] = keep(tri[t * 3]!) && keep(tri[t * 3 + 1]!) && keep(tri[t * 3 + 2]!) ? 1 : 0;
    return m;
  };
  const inGroups = (...names: SkinGroup[]) => {
    const set = new Set(names.map(g));
    return (v: number) => set.has(dominant[v]!);
  };
  const side = (s: 1 | -1) => (v: number) => base[v * 3]! * s > 0;
  const masks: Topology["masks"] = {
    semBraco: mask((v) => !arm.has(dominant[v]!)),
    semBracoE: mask((v) => !arm.has(dominant[v]!) && side(1)(v)),
    semBracoD: mask((v) => !arm.has(dominant[v]!) && side(-1)(v)),
    pernaE: mask(inGroups("coxaE", "canelaE")),
    pernaD: mask(inGroups("coxaD", "canelaD")),
    canelaE: mask(inGroups("canelaE")),
    canelaD: mask(inGroups("canelaD")),
    bracoE: mask(inGroups("bracoE")),
    bracoD: mask(inGroups("bracoD")),
    antebracoE: mask(inGroups("antebracoE", "maoE")),
    antebracoD: mask(inGroups("antebracoD", "maoD")),
  };
  const mid: number[] = [];
  for (let i = 0; i < n; i++) if (Math.abs(base[i * 3]!) < 3) mid.push(i);
  const topo = { dominant, masks, midline: Uint32Array.from(mid) };
  topologies.set(asset, topo);
  return topo;
}

/**
 * Corte da malha por um plano (ponto `o`, normal `n` unitária): os pontos onde
 * as arestas dos triângulos marcados cruzam o plano, nas coordenadas (u, v) do plano.
 * `radius`: só os pontos até essa distância de `o`.
 */
export function sliceMesh(pos: Float32Array, triangles: Uint32Array, mask: Uint8Array | null, o: Vec, n: Vec, radius = Infinity): number[] {
  // Plano horizontal: (u, v) = (x, z). Outro plano: uma base qualquer dele.
  let u: Vec;
  let v: Vec;
  if (Math.abs(n.y) > 0.999) {
    u = { x: 1, y: 0, z: 0 };
    v = { x: 0, y: 0, z: 1 };
  } else {
    const h = { x: 0, y: 1, z: 0 };
    u = { x: h.y * n.z - h.z * n.y, y: h.z * n.x - h.x * n.z, z: h.x * n.y - h.y * n.x };
    const lu = Math.hypot(u.x, u.y, u.z);
    u = { x: u.x / lu, y: u.y / lu, z: u.z / lu };
    v = { x: n.y * u.z - n.z * u.y, y: n.z * u.x - n.x * u.z, z: n.x * u.y - n.y * u.x };
  }
  const out: number[] = [];
  const r2 = radius * radius;
  const dist = (i: number) => (pos[i * 3]! - o.x) * n.x + (pos[i * 3 + 1]! - o.y) * n.y + (pos[i * 3 + 2]! - o.z) * n.z;
  const count = triangles.length / 3;
  for (let t = 0; t < count; t++) {
    if (mask && !mask[t]) continue;
    const a = triangles[t * 3]!;
    const b = triangles[t * 3 + 1]!;
    const c = triangles[t * 3 + 2]!;
    const da = dist(a);
    const db = dist(b);
    const dc = dist(c);
    if ((da > 0 && db > 0 && dc > 0) || (da < 0 && db < 0 && dc < 0)) continue;
    const edge = (i: number, j: number, di: number, dj: number) => {
      if ((di > 0) === (dj > 0) || di === dj) return;
      const s = di / (di - dj);
      const px = pos[i * 3]! + (pos[j * 3]! - pos[i * 3]!) * s - o.x;
      const py = pos[i * 3 + 1]! + (pos[j * 3 + 1]! - pos[i * 3 + 1]!) * s - o.y;
      const pz = pos[i * 3 + 2]! + (pos[j * 3 + 2]! - pos[i * 3 + 2]!) * s - o.z;
      if (px * px + py * py + pz * pz > r2) return;
      out.push(px * u.x + py * u.y + pz * u.z, px * v.x + py * v.y + pz * v.z);
    };
    edge(a, b, da, db);
    edge(b, c, db, dc);
    edge(c, a, dc, da);
  }
  return out;
}

/** Fecho convexo (cadeia monótona) de pontos (u, v) intercalados, em ordem anti-horária. */
export function convexHull(flat: readonly number[]): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) pts.push([flat[i]!, flat[i + 1]!]);
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

export function hullPerimeter(hull: readonly [number, number][]): number {
  let total = 0;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]!;
    const b = hull[(i + 1) % hull.length]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

const UP: Vec = { x: 0, y: 1, z: 0 };

/** Pontos de referência de uma medição completa (vértices que acompanham a forma). */
type Anchors = { bust: number; waist: number; hip: number; neck: number; tipE: number; tipD: number; ankleDy: number };

export type ShapeLevels = {
  floor: number;
  top: number;
  crotch: number;
  hip: number;
  waist: number;
  bust: number;
  neck: number;
  /** Base do pescoço (a articulação). */
  neckBase: number;
  back: number;
  tips: { left: Vec; right: Vec };
};

export type ShapeMeasure = { values: Record<MeasurementKey, number>; levels: ShapeLevels; anchors: Anchors; joints: Record<JointId, Vec> };

export function jointPositions(asset: MakeHumanAsset, pos: Float32Array): Record<JointId, Vec> {
  const out = {} as Record<JointId, Vec>;
  for (const [k, list] of Object.entries(asset.joints) as [JointId, Uint16Array][]) {
    let x = 0;
    let y = 0;
    let z = 0;
    for (const i of list) {
      x += pos[i * 3]!;
      y += pos[i * 3 + 1]!;
      z += pos[i * 3 + 2]!;
    }
    out[k] = { x: x / list.length, y: y / list.length, z: z / list.length };
  }
  return out;
}

const vy = (pos: Float32Array, i: number) => pos[i * 3 + 1]!;

/**
 * As 15 medidas da tabela medidas na malha (sem escala), como uma fita
 * mediria: voltas pelo fecho convexo do corte, comprimentos pelas articulações.
 * Com `anchors`, as alturas vêm dos mesmos vértices de uma medição anterior
 * (para derivar sem pular de lugar); sem, elas são procuradas.
 */
/** Onde a fita mede o braço: frações do ombro ao cotovelo, na região do bíceps. */
export const BICEPS_AT = [0.45, 0.5, 0.55, 0.6] as const;

export function measureShape(asset: MakeHumanAsset, pos: Float32Array, anchors?: Anchors): ShapeMeasure {
  const topo = topology(asset);
  const tri = asset.triangles;
  const n = asset.drawnCount;
  const J = jointPositions(asset, pos);
  let floor = Infinity;
  let top = -Infinity;
  for (let i = 0; i < n; i++) {
    floor = Math.min(floor, vy(pos, i));
    top = Math.max(top, vy(pos, i));
  }
  const H = top - floor;
  const perimAt = (mask: Uint8Array, y: number) => hullPerimeter(convexHull(sliceMesh(pos, tri, mask, { x: 0, y, z: 0 }, UP)));
  const all = topo.masks.semBraco;

  // Gancho: o ponto mais baixo da linha do meio acima de 30% da altura.
  let crotch = Infinity;
  for (const i of topo.midline) if (vy(pos, i) > floor + 0.3 * H) crotch = Math.min(crotch, vy(pos, i));

  let a: Anchors;
  if (anchors) a = anchors;
  else {
    // Busto: o ponto mais à frente do tronco entre 66% e 80% da altura.
    let bust = 0;
    let bestZ = -Infinity;
    for (let i = 0; i < n; i++) {
      const y = vy(pos, i);
      if (y < floor + 0.66 * H || y > floor + 0.8 * H || topo.dominant[i] !== 0) continue;
      if (pos[i * 3 + 2]! > bestZ) {
        bestZ = pos[i * 3 + 2]!;
        bust = i;
      }
    }
    const bustY = vy(pos, bust);
    const search = (lo: number, hi: number, step: number, mask: Uint8Array, pick: (p: number, best: number) => boolean) => {
      let bestY = lo;
      let best = NaN;
      for (let y = lo; y <= hi; y += step) {
        const p = perimAt(mask, y);
        if (p > 0 && (Number.isNaN(best) || pick(p, best))) {
          best = p;
          bestY = y;
        }
      }
      return bestY;
    };
    const waistY = search(floor + 0.55 * H, bustY - 0.05 * H, 4, all, (p, b) => p < b);
    const hipY = search(crotch + 0.01 * H, waistY - 0.04 * H, 4, all, (p, b) => p > b);
    const neckY = search(J.pescoco.y, J.pescoco.y + 0.05 * H, 3, all, (p, b) => p < b);
    const nearestMid = (y: number, front: boolean) => {
      let best = -1;
      let bd = Infinity;
      for (const i of topo.midline) {
        if ((pos[i * 3 + 2]! > 0) !== front) continue;
        const d = Math.abs(vy(pos, i) - y);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best;
    };
    // Ponta do ombro: o alto do ombro numa faixa um pouco para fora da articulação.
    const tip = (j: Vec) => {
      let best = 0;
      let by = -Infinity;
      const x0 = j.x + Math.sign(j.x) * 15;
      for (let i = 0; i < n; i++) {
        if (Math.abs(pos[i * 3]! - x0) > 10 || Math.abs(pos[i * 3 + 2]! - j.z) > 40) continue;
        if (vy(pos, i) > by) {
          by = vy(pos, i);
          best = i;
        }
      }
      return best;
    };
    // Tornozelo: a volta mais fina entre 2 e 6 cm acima da articulação.
    let ankleDy = 20;
    let thin = Infinity;
    for (let dy = 20; dy <= 60; dy += 5) {
      const p = perimAt(topo.masks.semBracoE, J.tornozeloE.y + dy);
      if (p > 0 && p < thin) {
        thin = p;
        ankleDy = dy;
      }
    }
    a = { bust, waist: nearestMid(waistY, true), hip: nearestMid(hipY, false), neck: nearestMid(neckY, true), tipE: tip(J.ombroE), tipD: tip(J.ombroD), ankleDy };
  }
  const bustY = vy(pos, a.bust);
  const waistY = vy(pos, a.waist);
  const hipY = vy(pos, a.hip);
  const neckY = vy(pos, a.neck);
  const tipL = { x: pos[a.tipE * 3]!, y: vy(pos, a.tipE), z: pos[a.tipE * 3 + 2]! };
  const tipR = { x: pos[a.tipD * 3]!, y: vy(pos, a.tipD), z: pos[a.tipD * 3 + 2]! };
  const shoulderY = (tipL.y + tipR.y) / 2;
  const backY = bustY + 0.5 * (shoulderY - bustY);

  const sides = [
    { s: 1, sh: J.ombroE, el: J.cotoveloE, wr: J.punhoE, kn: J.joelhoE, an: J.tornozeloE, tip: tipL, arm: topo.masks.bracoE, fore: topo.masks.antebracoE, leg: topo.masks.pernaE, shin: topo.masks.canelaE, thigh: topo.masks.semBracoE },
    { s: -1, sh: J.ombroD, el: J.cotoveloD, wr: J.punhoD, kn: J.joelhoD, an: J.tornozeloD, tip: tipR, arm: topo.masks.bracoD, fore: topo.masks.antebracoD, leg: topo.masks.pernaD, shin: topo.masks.canelaD, thigh: topo.masks.semBracoD },
  ] as const;
  const avg = (f: (side: (typeof sides)[number]) => number) => (f(sides[0]) + f(sides[1])) / 2;
  const dist = (p: Vec, q: Vec) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  const dir = (p: Vec, q: Vec) => {
    const d = dist(p, q) || 1;
    return { x: (q.x - p.x) / d, y: (q.y - p.y) / d, z: (q.z - p.z) / d };
  };
  const lerp = (p: Vec, q: Vec, t: number) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, z: p.z + (q.z - p.z) * t });
  const planePerim = (mask: Uint8Array, o: Vec, nrm: Vec, radius: number) => hullPerimeter(convexHull(sliceMesh(pos, tri, mask, o, nrm, radius)));

  const neckSlice = convexHull(sliceMesh(pos, tri, all, { x: 0, y: neckY, z: 0 }, UP));
  let neckHalf = 0;
  for (const [u] of neckSlice) neckHalf = Math.max(neckHalf, Math.abs(u));
  // Costas: largura da metade de trás do corte entre o busto e o ombro.
  const backPts = sliceMesh(pos, tri, all, { x: 0, y: backY, z: 0 }, UP);
  let zMin = Infinity;
  let zMax = -Infinity;
  for (let i = 1; i < backPts.length; i += 2) {
    zMin = Math.min(zMin, backPts[i]!);
    zMax = Math.max(zMax, backPts[i]!);
  }
  const zc = (zMin + zMax) / 2;
  let xMin = Infinity;
  let xMax = -Infinity;
  for (let i = 0; i + 1 < backPts.length; i += 2) {
    if (backPts[i + 1]! < zc) {
      xMin = Math.min(xMin, backPts[i]!);
      xMax = Math.max(xMax, backPts[i]!);
    }
  }

  const values: Record<MeasurementKey, number> = {
    altura: H,
    busto: perimAt(all, bustY),
    cintura: perimAt(all, waistY),
    quadril: perimAt(all, hipY),
    alturaDoQuadril: waistY - hipY,
    entrepernas: crotch - floor,
    comprimentoDoBraco: avg((s) => dist(s.tip, s.el) + dist(s.el, s.wr)),
    punho: avg((s) => planePerim(s.fore, lerp(s.el, s.wr, 0.95), dir(s.el, s.wr), 70)),
    ombro: avg((s) => Math.hypot(Math.abs(s.tip.x) - neckHalf, s.tip.y - J.pescoco.y)),
    larguraDasCostas: Number.isFinite(xMax - xMin) ? xMax - xMin : 0,
    pescoco: perimAt(all, neckY),
    coxa: avg((s) => perimAt(s.thigh, crotch - 0.02 * H)),
    joelho: avg((s) => perimAt(s.leg, s.kn.y)),
    tornozelo: avg((s) => perimAt(s.thigh, s.an.y + a.ankleDy)),
    // Braço: a volta mais larga do bíceps (45% a 60% do ombro ao cotovelo). Mais perto do ombro o corte pega o
    // deltoide e a axila, e o ajuste afinava o braço inteiro para baixar essa volta.
    braco: avg((s) => Math.max(...BICEPS_AT.map((t) => planePerim(s.arm, lerp(s.sh, s.el, t), dir(s.sh, s.el), 90)))),
  };
  return {
    values,
    anchors: a,
    joints: J,
    levels: { floor, top, crotch, hip: hipY, waist: waistY, bust: bustY, neck: neckY, neckBase: J.pescoco.y, back: backY, tips: { left: tipL, right: tipR } },
  };
}

// ---------------------------------------------------------------------------
// Ajuste às medidas
// ---------------------------------------------------------------------------

/** Peso de cada medida no ajuste (busto, cintura e quadril mandam). */
const FIT_WEIGHT: Partial<Record<MeasurementKey, number>> = { busto: 4, cintura: 4, quadril: 4, entrepernas: 3 };
const FIT_KEYS: readonly MeasurementKey[] = [
  "busto",
  "cintura",
  "quadril",
  "alturaDoQuadril",
  "entrepernas",
  "comprimentoDoBraco",
  "punho",
  "ombro",
  "larguraDasCostas",
  "pescoco",
  "coxa",
  "joelho",
  "tornozelo",
  "braco",
];
const RIDGE = 2e-5;

export type RealisticFit = {
  sex: BodySex;
  reading: MeasurementReading;
  weights: Record<Param, number>;
  /** Escala uniforme aplicada depois dos targets (a altura bate por ela). */
  scale: number;
  /** Posições finais (mm, chão em y = 0), todos os vértices guardados. */
  positions: Float32Array;
  measure: ShapeMeasure;
  /** Medidas obtidas no corpo, em mm. */
  obtained: Record<MeasurementKey, number>;
};

/** Escala e chão: o corpo cresce a partir do chão, no meio (x = z = 0). */
function scaled(pos: Float32Array, floor: number, s: number): Float32Array {
  const out = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    out[i] = pos[i]! * s;
    out[i + 1] = (pos[i + 1]! - floor) * s;
    out[i + 2] = pos[i + 2]! * s;
  }
  return out;
}

function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[p]![c]!)) p = r;
    [M[c], M[p]] = [M[p]!, M[c]!];
    const piv = M[c]![c]! || 1e-12;
    for (let r = c + 1; r < n; r++) {
      const f = M[r]![c]! / piv;
      for (let k = c; k <= n; k++) M[r]![k]! -= f * M[c]![k]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r]![n]!;
    for (let k = r + 1; k < n; k++) s -= M[r]![k]! * x[k]!;
    x[r] = s / (M[r]![r]! || 1e-12);
  }
  return x;
}

/**
 * Ajusta os pesos dos targets às medidas (mínimos quadrados com Gauss-Newton,
 * pesos limitados a ±PARAM_LIMIT e um freio pequeno para ficar perto do
 * corpo de partida). A altura bate pela escala.
 */
export function fitRealistic(asset: MakeHumanAsset, table: Record<string, number>, overrides: Partial<Record<MeasurementKey, number>> = {}, sex: BodySex = "feminino"): RealisticFit {
  const reading = readMeasurements(table, overrides);
  const target = reading.values;
  const w: Record<Param, number> = Object.fromEntries(PARAMS.map((p) => [p, 0])) as Record<Param, number>;
  const residuals = (m: ShapeMeasure) => {
    const s = target.altura / m.values.altura;
    return FIT_KEYS.map((k) => ((m.values[k] * s - target[k]) / target[k]) * (FIT_WEIGHT[k] ?? 1));
  };
  const EPS = 0.05;
  let pos = shapePositions(asset, sex, w);
  let m = measureShape(asset, pos);
  const cost = (r: number[], wt: Record<Param, number>) => r.reduce((acc, x) => acc + x * x, 0) + RIDGE * PARAMS.reduce((acc, p) => acc + wt[p] ** 2, 0);
  let damping = 0.01;
  for (let iter = 0; iter < 14; iter++) {
    const r = residuals(m);
    const cols: number[][] = [];
    for (const p of PARAMS) {
      const id = targetId(p, sex);
      // Derivada para o lado que ajuda: o "incr" vale do lado positivo, o "decr" do negativo.
      const side = (sign: 1 | -1) => {
        const probe = Float32Array.from(pos);
        // Ao redor de w: troca o pedaço de w por w + sign·EPS (o target muda no zero).
        addParam(asset, probe, id, w[p], -1);
        addParam(asset, probe, id, w[p] + sign * EPS);
        const rp = residuals(measureShape(asset, probe, m.anchors));
        return rp.map((x, k) => ((x - r[k]!) / EPS) * sign);
      };
      let col: number[];
      if (w[p] > 1e-9) col = side(1);
      else if (w[p] < -1e-9) col = side(-1);
      else {
        const plus = side(1);
        const minus = side(-1);
        const gPlus = plus.reduce((s, x, k) => s + x * r[k]!, 0);
        const gMinus = minus.reduce((s, x, k) => s + x * r[k]!, 0);
        col = gPlus < 0 ? plus : gMinus > 0 ? minus : plus;
      }
      cols.push(col);
    }
    const nP = PARAMS.length;
    const JtJ = Array.from({ length: nP }, (_, i) => Array.from({ length: nP }, (_, j) => cols[i]!.reduce((acc, x, k) => acc + x * cols[j]![k]!, 0)));
    const g = PARAMS.map((p, i) => cols[i]!.reduce((acc, x, k) => acc + x * r[k]!, 0) + RIDGE * w[p]);
    const current = cost(r, w);
    // Levenberg-Marquardt: só aceita o passo que baixa o erro; senão, passo menor.
    let accepted = false;
    for (let tries = 0; tries < 6 && !accepted; tries++) {
      const A = JtJ.map((row, i) => row.map((x, j) => x + (i === j ? RIDGE + damping * (JtJ[i]![i]! + 1e-6) : 0)));
      const delta = solve(A, g.map((x) => -x));
      const next = { ...w };
      PARAMS.forEach((p, i) => (next[p] = Math.max(-PARAM_LIMIT, Math.min(PARAM_LIMIT, w[p] + delta[i]!))));
      const nextPos = shapePositions(asset, sex, next);
      const nextM = measureShape(asset, nextPos);
      const nextCost = cost(residuals(nextM), next);
      if (nextCost < current) {
        const moved = Math.max(...PARAMS.map((p) => Math.abs(next[p] - w[p])));
        Object.assign(w, next);
        pos = nextPos;
        m = nextM;
        damping = Math.max(1e-4, damping / 3);
        accepted = true;
        if (moved < 2e-3 || current - nextCost < 1e-8) iter = Infinity;
      } else damping *= 4;
    }
    if (!accepted) break;
  }
  const s = target.altura / m.values.altura;
  const positions = scaled(pos, m.levels.floor, s);
  const measure = measureShape(asset, positions, m.anchors);
  const obtained = { ...measure.values };
  return { sex, reading, weights: { ...w }, scale: s, positions, measure, obtained };
}

// ---------------------------------------------------------------------------
// Gestante
// ---------------------------------------------------------------------------

/** Barriga aplicada: a altura do ponto mais saliente, a volta que o corpo já tinha ali e a obtida (mm). */
export type RealisticBelly = { y: number; natural: number; obtained: number };

/**
 * Gestante no corpo realista: empurra para a frente (+Z) a pele do tronco entre
 * o quadril e o abaixo do busto, até a volta no ponto mais saliente chegar a
 * `belly` (mm). Como no manequim: a barriga fica entre o quadril e o busto
 * (os dois seguem a tabela), as costas não saem do lugar e a cintura acompanha
 * em parte. O desenho é um domo liso: cos² na altura (zero no quadril e no
 * abaixo do busto), parábola na largura (zero nas laterais) e só no lado da frente.
 * O tamanho do calombo sai por bissecção da volta medida na malha. Volta menor
 * que a do corpo ali: nada muda (`belly` = null).
 */
export function applyBelly(asset: MakeHumanAsset, fit: RealisticFit, belly: number): { fit: RealisticFit; belly: RealisticBelly | null } {
  const topo = topology(asset);
  const n = asset.drawnCount;
  const tri = asset.triangles;
  const trunk = topo.masks.semBraco;
  const L = fit.measure.levels;
  const H = L.top - L.floor;
  const bellyY = L.hip + 0.55 * (L.waist - L.hip);
  const underbustY = L.bust - 0.035 * H;
  const perimAt = (pos: Float32Array, y: number) => hullPerimeter(convexHull(sliceMesh(pos, tri, trunk, { x: 0, y, z: 0 }, UP)));
  const natural = perimAt(fit.positions, bellyY);
  const target = Math.min(belly, BELLY_RANGE[1]);
  if (!Number.isFinite(target) || target <= natural + 1) return { fit, belly: null };

  // Largura e centro do tronco por altura (a cada 10 mm), para o calombo seguir a forma do corpo.
  const STEP = 10;
  const rows: { halfWidth: number; cz: number; halfDepth: number }[] = [];
  for (let y = L.hip; y <= underbustY + STEP; y += STEP) {
    const hull = convexHull(sliceMesh(fit.positions, tri, trunk, { x: 0, y, z: 0 }, UP));
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const [x, z] of hull) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    rows.push(hull.length < 3 ? { halfWidth: 1, cz: 0, halfDepth: 1 } : { halfWidth: (maxX - minX) / 2, cz: (minZ + maxZ) / 2, halfDepth: (maxZ - minZ) / 2 });
  }
  const rowAt = (y: number) => rows[Math.max(0, Math.min(rows.length - 1, Math.round((y - L.hip) / STEP)))]!;
  const cos2 = (t: number) => (Math.abs(t) >= 1 ? 0 : Math.cos((Math.PI / 2) * t) ** 2);
  const smooth = (e0: number, e1: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  // Peso de cada vértice do tronco (0 a 1): o calombo inteiro é peso × tamanho.
  const weights = new Float32Array(n);
  const tronco = SKIN_GROUPS.indexOf("tronco");
  for (let i = 0; i < n; i++) {
    if (topo.dominant[i] !== tronco) continue;
    const x = fit.positions[i * 3]!;
    const y = fit.positions[i * 3 + 1]!;
    const z = fit.positions[i * 3 + 2]!;
    if (y <= L.hip || y >= underbustY) continue;
    const wy = y < bellyY ? cos2((bellyY - y) / (bellyY - L.hip)) : cos2((y - bellyY) / (underbustY - bellyY));
    const r = rowAt(y);
    // Na largura, uma parábola (mais cheia que o cos²: a barriga é um domo, não um bico).
    const u = x / (r.halfWidth || 1);
    const wx = Math.max(0, 1 - u * u);
    const wz = smooth(-0.1, 0.5, (z - r.cz) / (r.halfDepth || 1));
    weights[i] = wy * wx * wz;
  }
  const pushed = (size: number) => {
    const out = Float32Array.from(fit.positions);
    for (let i = 0; i < n; i++) if (weights[i]! > 0) out[i * 3 + 2] = out[i * 3 + 2]! + size * weights[i]!;
    return out;
  };
  let lo = 0;
  let hi = 1500;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (perimAt(pushed(mid), bellyY) < target) lo = mid;
    else hi = mid;
  }
  const positions = pushed((lo + hi) / 2);
  // Mede de novo nos mesmos pontos de referência (as alturas não mudam; a cintura cresce um pouco).
  const measure = measureShape(asset, positions, fit.measure.anchors);
  return {
    fit: { ...fit, positions, measure: { ...measure, levels: fit.measure.levels }, obtained: { ...measure.values } },
    belly: { y: bellyY, natural, obtained: perimAt(positions, bellyY) },
  };
}
