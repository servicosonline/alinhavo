import type { Collider, Vec3 } from "../collider";
import type { BodyOverrides, PoseAngles } from "./mannequin";
import { poseAngles } from "./mannequin";
import {
  applyBelly,
  convexHull,
  fitRealistic,
  sliceMesh,
  SKIN_GROUPS,
  type BodySex,
  type JointId,
  type MakeHumanAsset,
  type RealisticBelly,
  type RealisticFit,
  type SkinGroup,
} from "./makehuman";
import { sdEllipsoid, sdRoundCone } from "./shapes";
import type { Body, BodyMesh, BodyPose, LegSample, TorsoSection } from "./types";

/**
 * Corpo realista (Fase 7, M2): a malha do MakeHuman ajustada às medidas
 * (`fitRealistic`), deformada pelo esqueleto com os pesos de pele (pele
 * linear, por grupo) e com um colisor rápido de formas ajustadas à malha:
 * tronco por seções (raio em série de cossenos, uma a cada 5 mm), cabeça
 * elipsoide e cones arredondados nos membros, que andam com os ossos. Entra
 * pelo mesmo contrato `Body` do manequim e aceita as mesmas poses por ângulos.
 */

const RAD = Math.PI / 180;
const UP: Vec3 = { x: 0, y: 1, z: 0 };
/** Harmônicos da série de cossenos do raio do tronco. */
const HARMONICS = 16;
/** Ângulos amostrados por seção para ajustar a série. */
const SAMPLES = 96;
/** Distância entre as seções ajustadas e entre as linhas da tabela, em mm. */
const SECTION_STEP = 5;
const TABLE_STEP = 2;
/** Passadas de suavização (1-2-1) das seções ao longo da altura. */
const SMOOTH_PASSES = 4;

type Mat3 = [number, number, number, number, number, number, number, number, number];
type Transform = { r: Mat3; t: Vec3 };
type Cone = { group: SkinGroup; a: Vec3; b: Vec3; r1: number; r2: number };

export type RealisticModel = {
  fit: RealisticFit;
  sex: BodySex;
  /** Posições de desenho em repouso (mm, chão em 0). */
  rest: Float32Array;
  triangles: Uint32Array;
  skinGroups: Uint8Array;
  skinWeights: Float32Array;
  joints: Record<JointId, Vec3>;
  torso: TorsoProfile;
  head: { c: Vec3; r: Vec3 };
  cones: Cone[];
  sections: { crotch: TorsoSection; hip: TorsoSection; waist: TorsoSection; bust: TorsoSection; shoulder: TorsoSection; neck: TorsoSection; belly?: TorsoSection };
  /** Gestante: a barriga aplicada (null sem barriga ou quando a volta pedida não passa a do corpo). */
  belly: RealisticBelly | null;
  shoulderPoints: { left: Vec3; right: Vec3 };
  headTop: number;
  /** Pontos da superfície do tronco e da cabeça (repouso, sem a descida), para achar o ponto mais baixo ao girar. */
  support: Vec3[];
  /** Pontos extremos da malha de cada membro (repouso), que andam com o grupo: o apoio dos membros ao girar. */
  limbSupport: { group: SkinGroup; p: Vec3 }[];
  /** Raio das referências dos membros (pelas voltas medidas): coxa, joelho, tornozelo; braço, cotovelo, punho. */
  legRadii: [number, number, number];
  armRadii: [number, number, number];
};

/** Raio do tronco por altura: coeficientes da série (a0…aK) e o centro em Z, numa tabela a cada TABLE_STEP mm. */
type TorsoProfile = { bottom: number; top: number; coeffs: Float64Array; centerZ: Float64Array; rows: number };

// ---------------------------------------------------------------------------
// Modelo em repouso (uma vez por corpo)
// ---------------------------------------------------------------------------

const models = new WeakMap<MakeHumanAsset, Map<string, RealisticModel>>();
const fits = new WeakMap<MakeHumanAsset, Map<string, RealisticFit>>();
const CACHE_SIZE = 6;

/** Os últimos `CACHE_SIZE` valores de cada arquivo, pela chave (o usado agora vai para o fim). */
function cached<T>(store: WeakMap<MakeHumanAsset, Map<string, T>>, asset: MakeHumanAsset, key: string, make: () => T): T {
  let cache = store.get(asset);
  if (!cache) store.set(asset, (cache = new Map()));
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const value = make();
  cache.set(key, value);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
  return value;
}

/**
 * O corpo ajustado às medidas, em repouso. Guardado pelos últimos corpos pedidos (o ajuste leva ~1 s; mexer só
 * na barriga reaproveita o ajuste). `belly`: gestante, a volta da barriga em mm (`applyBelly`).
 */
export function realisticModel(
  asset: MakeHumanAsset,
  table: Record<string, number>,
  overrides: BodyOverrides = {},
  sex: BodySex = "feminino",
  belly?: number,
): RealisticModel {
  const fitKey = JSON.stringify([table, overrides, sex]);
  const mm = belly !== undefined && Number.isFinite(belly) ? Math.round(belly) : null;
  return cached(models, asset, JSON.stringify([fitKey, mm]), () => {
    const fit = cached(fits, asset, fitKey, () => fitRealistic(asset, table, overrides, sex));
    if (mm === null) return buildModel(asset, fit, null);
    const pregnant = applyBelly(asset, fit, mm);
    return buildModel(asset, pregnant.fit, pregnant.belly);
  });
}

function buildModel(asset: MakeHumanAsset, fit: RealisticFit, belly: RealisticBelly | null): RealisticModel {
  const n = asset.drawnCount;
  const pos = fit.positions;
  const rest = pos.slice(0, n * 3);
  const J = fit.measure.joints;
  const L = fit.measure.levels;
  const H = L.top - L.floor;
  const groupIndex = (g: SkinGroup) => SKIN_GROUPS.indexOf(g);
  const dominant = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (asset.skinWeights[i * 4 + k]! > asset.skinWeights[i * 4 + best]!) best = k;
    dominant[i] = asset.skinGroups[i * 4 + best]!;
  }
  const armGroups = new Set(["bracoE", "antebracoE", "maoE", "bracoD", "antebracoD", "maoD"].map((g) => groupIndex(g as SkinGroup)));
  const tri = asset.triangles;
  const count = tri.length / 3;
  // O tronco e a cabeça saem da malha na pose em pé (a pele do ombro muda com o braço; a pose em pé é a mais usada).
  const standing = skin({ rest, skinGroups: asset.skinGroups, skinWeights: asset.skinWeights }, poseTransforms(J, poseAngles("em-pe")).transforms, 0);
  // O alto do ombro (deltoide acima da articulação) entra no tronco, como no manequim: é onde a roupa apoia.
  const upperArm = new Set([groupIndex("bracoE"), groupIndex("bracoD")]);
  const shoulderTop = Math.min(J.ombroE.y, J.ombroD.y) - 20;
  const torsoVertex = (v: number) => !armGroups.has(dominant[v]!) || (upperArm.has(dominant[v]!) && standing[v * 3 + 1]! >= shoulderTop);
  const noArm = new Uint8Array(count);
  // Triângulo do tronco: pelo menos dois vértices do tronco (a borda com o braço entra).
  for (let t = 0; t < count; t++) noArm[t] = [0, 1, 2].filter((k) => torsoVertex(tri[t * 3 + k]!)).length >= 2 ? 1 : 0;
  const hullAt = (y: number) => convexHull(sliceMesh(standing, tri, noArm, { x: 0, y, z: 0 }, UP));
  const sectionAt = (y: number): TorsoSection => {
    const hull = hullAt(y);
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
    return { y, halfWidth: (maxX - minX) / 2, halfDepth: (maxZ - minZ) / 2, centerZ: (maxZ + minZ) / 2 };
  };

  // --- Tronco: do gancho até o pescoço ----------------------------------------
  const bottom = L.crotch;
  const top = L.neck + 0.015 * H;
  const torso = torsoProfile(hullAt, bottom, top);

  // --- Cabeça: elipsoide que cobre a malha acima do pescoço ---------------------
  let lo = { x: Infinity, y: Infinity, z: Infinity };
  let hi = { x: -Infinity, y: -Infinity, z: -Infinity };
  const headVerts: number[] = [];
  for (let i = 0; i < n; i++) {
    if (rest[i * 3 + 1]! < L.neck || armGroups.has(dominant[i]!)) continue;
    headVerts.push(i);
    lo = { x: Math.min(lo.x, rest[i * 3]!), y: Math.min(lo.y, rest[i * 3 + 1]!), z: Math.min(lo.z, rest[i * 3 + 2]!) };
    hi = { x: Math.max(hi.x, rest[i * 3]!), y: Math.max(hi.y, rest[i * 3 + 1]!), z: Math.max(hi.z, rest[i * 3 + 2]!) };
  }
  const hc = { x: 0, y: (lo.y + hi.y) / 2, z: (lo.z + hi.z) / 2 };
  const hr0 = { x: (hi.x - lo.x) / 2, y: (hi.y - lo.y) / 2, z: (hi.z - lo.z) / 2 };
  const norm = headVerts.map((i) => Math.hypot((rest[i * 3]! - hc.x) / hr0.x, (rest[i * 3 + 1]! - hc.y) / hr0.y, (rest[i * 3 + 2]! - hc.z) / hr0.z)).sort((a, b) => a - b);
  const grow = Math.max(0.9, norm[Math.floor(norm.length * 0.99)] ?? 1);
  const head = { c: hc, r: { x: hr0.x * grow, y: hr0.y * grow, z: hr0.z * grow } };

  // --- Membros: cones arredondados ajustados aos vértices de cada grupo ---------
  const cones: Cone[] = [];
  const fingertip = (wrist: Vec3, elbow: Vec3, g: SkinGroup): Vec3 => {
    const d = unit(sub(wrist, elbow));
    let best = wrist;
    let bt = 0;
    for (let i = 0; i < n; i++) {
      if (dominant[i] !== groupIndex(g)) continue;
      const p = vec(rest, i);
      const t = dot(sub(p, wrist), d);
      if (t > bt) {
        bt = t;
        best = p;
      }
    }
    // A ponta fica no eixo do antebraço (o cone cobre a mão pelo raio).
    return add(wrist, scale(d, bt));
  };
  const fitCone = (group: SkinGroup, a: Vec3, b: Vec3, from = 0, quantile = 0.95, maxR1 = Infinity): Cone => {
    const g = groupIndex(group);
    const ab = sub(b, a);
    const len2 = dot(ab, ab);
    const BINS = 8;
    const bins: number[][] = Array.from({ length: BINS }, () => []);
    for (let i = 0; i < n; i++) {
      if (dominant[i] !== g) continue;
      const p = vec(rest, i);
      const t = dot(sub(p, a), ab) / len2;
      if (t < from || t > 1) continue;
      const d = Math.hypot(...xyz(sub(p, add(a, scale(ab, t)))));
      bins[Math.min(BINS - 1, Math.floor(((t - from) / (1 - from)) * BINS))]!.push(d);
    }
    const pts: [number, number][] = [];
    bins.forEach((list, k) => {
      if (list.length < 3) return;
      list.sort((x, y) => x - y);
      pts.push([from + ((k + 0.5) / BINS) * (1 - from), list[Math.floor(list.length * quantile)]!]);
    });
    // Reta pelos raios das faixas, levantada até cobrir todas.
    const m = pts.length;
    const st = pts.reduce((s, p) => s + p[0], 0) / m;
    const sr = pts.reduce((s, p) => s + p[1], 0) / m;
    const cov = pts.reduce((s, p) => s + (p[0] - st) * (p[1] - sr), 0);
    const vt = pts.reduce((s, p) => s + (p[0] - st) ** 2, 0) || 1;
    const slope = cov / vt;
    let r1 = sr - slope * st;
    let lift = 0;
    for (const [t, r] of pts) lift = Math.max(lift, r - (r1 + slope * t));
    r1 += lift;
    const r2 = r1 + slope;
    // Antes de `from` (perto da articulação, onde o tronco cobre), o raio não passa do de `from`.
    if (from > 0) r1 = Math.min(r1, r1 + slope * from);
    r1 = Math.min(r1, maxR1);
    const len = Math.sqrt(len2);
    const clamp = (r: number) => Math.max(8, r);
    let c1 = clamp(r1);
    let c2 = clamp(r2);
    // O cone arredondado pede |r1 − r2| < comprimento.
    if (Math.abs(c1 - c2) > len * 0.9) {
      if (c1 > c2) c1 = c2 + len * 0.9;
      else c2 = c1 + len * 0.9;
    }
    return { group, a, b, r1: c1, r2: c2 };
  };
  /**
   * Alto do eixo da coxa: a articulação do quadril fica atrás e por fora da
   * carne da coxa; o eixo passa pelo meio dos vértices do alto da coxa (t de 0,2 a 0,4).
   */
  const thighTop = (group: SkinGroup, hip: Vec3, knee: Vec3): Vec3 => {
    const g = groupIndex(group);
    const ab = sub(knee, hip);
    const len2 = dot(ab, ab);
    let sum = { x: 0, y: 0, z: 0 };
    let count = 0;
    for (let i = 0; i < n; i++) {
      if (dominant[i] !== g) continue;
      const p = vec(rest, i);
      const t = dot(sub(p, hip), ab) / len2;
      if (t < 0.2 || t > 0.4) continue;
      sum = add(sum, sub(p, add(hip, scale(ab, t))));
      count++;
    }
    if (count === 0) return hip;
    return add(hip, scale(sum, 1 / count));
  };
  /** Pé: eixo do calcanhar à ponta, na altura média de cada ponta, e os raios ajustados à malha. */
  const footCone = (group: SkinGroup): Cone => {
    const g = groupIndex(group);
    const verts: Vec3[] = [];
    for (let i = 0; i < n; i++) if (dominant[i] === g) verts.push(vec(rest, i));
    const zs = verts.map((p) => p.z).sort((x, y) => x - y);
    const zMin = zs[0]!;
    const zMax = zs.at(-1)!;
    const end = (lo: number, hi: number): Vec3 => {
      const sel = verts.filter((p) => p.z >= lo && p.z <= hi);
      const m = (f: (p: Vec3) => number) => sel.reduce((acc, p) => acc + f(p), 0) / Math.max(1, sel.length);
      return { x: m((p) => p.x), y: m((p) => p.y), z: lo + (hi - lo) / 2 };
    };
    const span = zMax - zMin;
    const a0 = end(zMin, zMin + 0.2 * span);
    const b0 = end(zMax - 0.2 * span, zMax);
    const c = fitCone(group, a0, b0);
    const d = unit(sub(b0, a0));
    return { ...c, a: add(c.a, scale(d, c.r1 * 0.6)), b: sub(c.b, scale(d, c.r2 * 0.6)) };
  };
  for (const s of ["E", "D"] as const) {
    const sh = J[`ombro${s}`];
    const el = J[`cotovelo${s}`];
    const wr = J[`punho${s}`];
    const hip = J[`quadril${s}`];
    const kn = J[`joelho${s}`];
    const an = J[`tornozelo${s}`];
    cones.push(
      fitCone(`braco${s}`, sh, el, 0.25),
      fitCone(`antebraco${s}`, el, wr),
      // Mão: a metade dos vértices dentro (dedos abertos e o polegar ficam de fora; um cone gordo empurraria a roupa no quadril).
      fitCone(`mao${s}`, wr, fingertip(wr, el, `mao${s}`), 0, 0.5),
      // Coxa: no alto, no máximo a volta da coxa medida (a carne do quadril fica com o tronco; um cone gordo sai pela lateral do quadril e empurra a calça a cada passo).
      fitCone(`coxa${s}`, thighTop(`coxa${s}`, hip, kn), kn, 0.25, 0.95, (fit.obtained.coxa / (2 * Math.PI)) * 1.2),
      fitCone(`canela${s}`, kn, an),
      footCone(`pe${s}`),
    );
  }

  const tips = L.tips;
  const shoulderY = (tips.left.y + tips.right.y) / 2;
  const shoulderSection = sectionAt(shoulderY);
  const o = fit.obtained;
  const r = (c: number) => c / (2 * Math.PI);
  return {
    fit,
    sex: fit.sex,
    rest,
    triangles: asset.triangles,
    skinGroups: asset.skinGroups,
    skinWeights: asset.skinWeights,
    joints: J,
    torso,
    head,
    cones,
    sections: {
      crotch: sectionAt(L.crotch + 2),
      hip: sectionAt(L.hip),
      waist: sectionAt(L.waist),
      bust: sectionAt(L.bust),
      shoulder: { ...shoulderSection, halfWidth: Math.max(shoulderSection.halfWidth, Math.abs(tips.left.x), Math.abs(tips.right.x)) },
      neck: sectionAt(L.neckBase),
      ...(belly ? { belly: sectionAt(belly.y) } : {}),
    },
    belly,
    shoulderPoints: { left: tips.left, right: tips.right },
    headTop: L.top,
    support: [...torsoSupport(torso), ...ellipsoidSupport(head)],
    limbSupport: limbExtremes(rest, dominant),
    legRadii: [r(o.coxa), r(o.joelho), r(o.tornozelo)],
    armRadii: [r(o.braco), r(o.braco) * 0.82, r(o.punho)],
  };
}

/** Ajusta a série de cossenos do raio do tronco em cada seção e monta a tabela fina. */
function torsoProfile(hullAt: (y: number) => [number, number][], bottom: number, top: number): TorsoProfile {
  const K = HARMONICS;
  const ys: number[] = [];
  for (let y = bottom; y < top; y += SECTION_STEP) ys.push(y);
  ys.push(top);
  const fitted = ys.map((y) => {
    const hull = hullAt(y);
    if (hull.length < 3) return { cz: 0, a: new Float64Array(K + 1) };
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const [, z] of hull) {
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    const cz = (minZ + maxZ) / 2;
    // Raio do fecho em cada ângulo φ (a partir de +Z, para +X), simétrico (o corpo é).
    const R = new Float64Array(SAMPLES);
    for (let j = 0; j < SAMPLES; j++) {
      const phi = (2 * Math.PI * j) / SAMPLES;
      R[j] = rayHull(hull, 0, cz, Math.sin(phi), Math.cos(phi));
    }
    const sym = R.map((v, j) => Math.max(v, R[(SAMPLES - j) % SAMPLES]!));
    const a = new Float64Array(K + 1);
    for (let k = 0; k <= K; k++) {
      let s = 0;
      for (let j = 0; j < SAMPLES; j++) s += sym[j]! * Math.cos((2 * Math.PI * k * j) / SAMPLES);
      a[k] = (k === 0 ? 1 : 2) * (s / SAMPLES);
    }
    // Sobe a série até cobrir o fecho (no máximo 6 mm: os cantos agudos ficam um pouco de fora).
    let deficit = 0;
    for (let j = 0; j < SAMPLES; j++) {
      let v = 0;
      for (let k = 0; k <= K; k++) v += a[k]! * Math.cos((2 * Math.PI * k * j) / SAMPLES);
      deficit = Math.max(deficit, sym[j]! - v);
    }
    a[0] = a[0]! + Math.min(6, deficit);
    return { cz, a };
  });
  // Suaviza ao longo da altura (a distância dividida pelo gradiente precisa de um raio que muda sem degraus).
  for (let pass = 0; pass < SMOOTH_PASSES; pass++) {
    const prev = fitted.map((f) => ({ cz: f.cz, a: Float64Array.from(f.a) }));
    for (let i = 1; i < fitted.length - 1; i++) {
      fitted[i]!.cz = (prev[i - 1]!.cz + 2 * prev[i]!.cz + prev[i + 1]!.cz) / 4;
      for (let k = 0; k <= K; k++) fitted[i]!.a[k] = (prev[i - 1]!.a[k]! + 2 * prev[i]!.a[k]! + prev[i + 1]!.a[k]!) / 4;
      // O raio médio não encolhe: a roupa não entra no corpo onde ele afina rápido.
      fitted[i]!.a[0] = Math.max(fitted[i]!.a[0]!, prev[i]!.a[0]!);
    }
  }
  const rows = Math.ceil((top - bottom) / TABLE_STEP) + 1;
  const coeffs = new Float64Array(rows * (K + 1));
  const centerZ = new Float64Array(rows);
  for (let r = 0; r < rows; r++) {
    const y = Math.min(top, bottom + r * TABLE_STEP);
    let i = 0;
    while (i < ys.length - 2 && ys[i + 1]! <= y) i++;
    const t = Math.max(0, Math.min(1, (y - ys[i]!) / (ys[i + 1]! - ys[i]! || 1)));
    centerZ[r] = fitted[i]!.cz * (1 - t) + fitted[i + 1]!.cz * t;
    for (let k = 0; k <= K; k++) coeffs[r * (K + 1) + k] = fitted[i]!.a[k]! * (1 - t) + fitted[i + 1]!.a[k]! * t;
  }
  return { bottom, top, coeffs, centerZ, rows };
}

/** Pontos do tronco pela série: a cada 2 cm de altura, 16 ângulos. */
function torsoSupport(tp: TorsoProfile): Vec3[] {
  const K = HARMONICS;
  const out: Vec3[] = [];
  for (let r = 0; r < tp.rows; r += 10) {
    const y = Math.min(tp.top, tp.bottom + r * TABLE_STEP);
    for (let j = 0; j < 16; j++) {
      const phi = (2 * Math.PI * j) / 16;
      let R = 0;
      for (let k = 0; k <= K; k++) R += tp.coeffs[r * (K + 1) + k]! * Math.cos(k * phi);
      out.push({ x: R * Math.sin(phi), y, z: tp.centerZ[r]! + R * Math.cos(phi) });
    }
  }
  return out;
}

/** Em cada membro, o vértice mais longe em 14 direções (eixos e diagonais): onde ele encosta no chão. */
function limbExtremes(rest: Float32Array, dominant: Uint8Array): { group: SkinGroup; p: Vec3 }[] {
  const dirs: Vec3[] = [];
  for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) dirs.push({ x: d[0]!, y: d[1]!, z: d[2]! });
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) dirs.push(unit({ x: sx, y: sy, z: sz }));
  const out: { group: SkinGroup; p: Vec3 }[] = [];
  SKIN_GROUPS.forEach((group, g) => {
    if (group === "tronco") return;
    for (const d of dirs) {
      let best = -1;
      let bv = -Infinity;
      for (let i = 0; i < dominant.length; i++) {
        if (dominant[i] !== g) continue;
        const v = rest[i * 3]! * d.x + rest[i * 3 + 1]! * d.y + rest[i * 3 + 2]! * d.z;
        if (v > bv) {
          bv = v;
          best = i;
        }
      }
      if (best >= 0) out.push({ group, p: vec(rest, best) });
    }
  });
  return out;
}

/** Pontos da cabeça: os seis polos e oito cantos do elipsoide. */
function ellipsoidSupport(e: { c: Vec3; r: Vec3 }): Vec3[] {
  const out: Vec3[] = [];
  for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) out.push({ x: e.c.x + d[0]! * e.r.x, y: e.c.y + d[1]! * e.r.y, z: e.c.z + d[2]! * e.r.z });
  const k = 1 / Math.sqrt(3);
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) out.push({ x: e.c.x + sx * k * e.r.x, y: e.c.y + sy * k * e.r.y, z: e.c.z + sz * k * e.r.z });
  return out;
}

/** Distância do ponto (x0, z0) até o fecho convexo na direção (dx, dz). */
function rayHull(hull: readonly [number, number][], x0: number, z0: number, dx: number, dz: number): number {
  let best = 0;
  for (let i = 0; i < hull.length; i++) {
    const [ax, az] = hull[i]!;
    const [bx, bz] = hull[(i + 1) % hull.length]!;
    const ex = bx - ax;
    const ez = bz - az;
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((ax - x0) * ez - (az - z0) * ex) / den;
    const u = ((ax - x0) * dz - (az - z0) * dx) / den;
    if (t > 0 && u >= -1e-9 && u <= 1 + 1e-9) best = Math.max(best, t);
  }
  return best;
}

// ---------------------------------------------------------------------------
// O corpo numa pose
// ---------------------------------------------------------------------------

export type RealisticOptions = { mesh?: boolean; shift?: number };

/** Monta o corpo realista numa pose (com nome ou por ângulos). Devolve também quanto ele desceu. */
export function buildRealistic(model: RealisticModel, pose: BodyPose | PoseAngles = "em-pe", options: RealisticOptions = {}): { body: Body; shift: number } {
  const angles = typeof pose === "string" ? poseAngles(pose) : pose;
  const J = model.joints;
  const { transforms, posed } = poseTransforms(J, angles);
  const restAnkle = Math.min(J.tornozeloE.y, J.tornozeloD.y);
  const shift = Number.isFinite(options.shift) ? options.shift! : Math.min(posed.tornozeloE!.y, posed.tornozeloD!.y) - restAnkle;
  const down = (p: Vec3): Vec3 => ({ x: p.x, y: p.y - shift, z: p.z });
  const move = (g: SkinGroup, p: Vec3) => {
    const t = transforms[SKIN_GROUPS.indexOf(g)]!;
    return down(add(apply(t.r, p), t.t));
  };

  // --- Colisor ---------------------------------------------------------------
  type Part = { sdf: (p: Vec3) => number; normal?: (p: Vec3) => Vec3 | null; center: Vec3; radius: number };
  const torsoSdf = torsoDistance(model.torso, shift);
  const tp = model.torso;
  let torsoR = 0;
  for (let r = 0; r < tp.rows; r++) {
    let sum = 0;
    for (let k = 0; k <= HARMONICS; k++) sum += Math.abs(tp.coeffs[r * (HARMONICS + 1) + k]!);
    torsoR = Math.max(torsoR, sum + Math.abs(tp.centerZ[r]!));
  }
  const head = { c: down(model.head.c), r: model.head.r };
  const limbs = model.cones.map((c) => ({ a: move(c.group, c.a), b: move(c.group, c.b), r1: c.r1, r2: c.r2 }));
  const parts: Part[] = [
    {
      sdf: (p) => torsoSdf(p).d,
      normal: (p) => torsoSdf(p).n,
      center: { x: 0, y: (tp.bottom + tp.top) / 2 - shift, z: 0 },
      radius: Math.hypot(torsoR, (tp.top - tp.bottom) / 2),
    },
    { sdf: (p) => sdEllipsoid(p, head.c, head.r), center: head.c, radius: Math.max(head.r.x, head.r.y, head.r.z) },
    ...limbs.map((l): Part => ({
      sdf: (p) => sdRoundCone(p, l.a, l.b, l.r1, l.r2),
      center: scale(add(l.a, l.b), 0.5),
      radius: Math.hypot(...xyz(sub(l.b, l.a))) / 2 + Math.max(l.r1, l.r2),
    })),
  ];
  const box = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };
  for (const { center: c, radius: r } of parts) {
    box.min = { x: Math.min(box.min.x, c.x - r), y: Math.min(box.min.y, c.y - r), z: Math.min(box.min.z, c.z - r) };
    box.max = { x: Math.max(box.max.x, c.x + r), y: Math.max(box.max.y, c.y + r), z: Math.max(box.max.z, c.z + r) };
  }
  const collider: Collider = {
    query(x, y, z) {
      const out = Math.hypot(Math.max(box.min.x - x, 0, x - box.max.x), Math.max(box.min.y - y, 0, y - box.max.y), Math.max(box.min.z - z, 0, z - box.max.z));
      if (out > 30) return { distance: out, normal: UP };
      const p = { x, y, z };
      let d = Infinity;
      let best = parts[0]!;
      for (const part of parts) {
        const bound = Math.hypot(x - part.center.x, y - part.center.y, z - part.center.z) - part.radius;
        if (bound >= d) continue;
        const pd = part.sdf(p);
        if (pd < d) {
          d = pd;
          best = part;
        }
      }
      if (d > 30) return { distance: d, normal: UP };
      const analytic = best.normal?.(p);
      if (analytic) return { distance: d, normal: analytic };
      const e = 0.5;
      const f = best.sdf;
      const gx = f({ x: x + e, y, z }) - f({ x: x - e, y, z });
      const gy = f({ x, y: y + e, z }) - f({ x, y: y - e, z });
      const gz = f({ x, y, z: z + e }) - f({ x, y, z: z - e });
      const len = Math.hypot(gx, gy, gz);
      return { distance: d, normal: len > 1e-12 ? { x: gx / len, y: gy / len, z: gz / len } : UP };
    },
  };

  const mesh: BodyMesh = options.mesh === false ? { positions: new Float32Array(0), indices: new Uint32Array(0) } : { positions: skin(model, transforms, shift), indices: model.triangles };
  const sec = (s: TorsoSection): TorsoSection => ({ ...s, y: s.y - shift });
  const axis = (ids: JointId[], radii: readonly number[]): LegSample[] => ids.map((id, i) => ({ ...down(posed[id]!), r: radii[i]! }));
  const S = model.sections;
  const o = model.fit.obtained;
  const body: Body = {
    kind: "makehuman",
    pose: typeof pose === "string" ? pose : "movimento",
    mesh,
    collider,
    fit: { reading: model.fit.reading, obtained: { busto: o.busto, cintura: o.cintura, quadril: o.quadril, altura: o.altura } },
    landmarks: {
      crotch: sec(S.crotch),
      hip: sec(S.hip),
      waist: sec(S.waist),
      bust: sec(S.bust),
      shoulder: sec(S.shoulder),
      neck: sec(S.neck),
      ...(S.belly ? { belly: sec(S.belly) } : {}),
      shoulderPoints: { left: down(model.shoulderPoints.left), right: down(model.shoulderPoints.right) },
      legs: { left: axis(["quadrilE", "joelhoE", "tornozeloE"], model.legRadii), right: axis(["quadrilD", "joelhoD", "tornozeloD"], model.legRadii) },
      arms: { left: axis(["ombroE", "cotoveloE", "punhoE"], model.armRadii), right: axis(["ombroD", "cotoveloD", "punhoD"], model.armRadii) },
      headTop: model.headTop - shift,
    },
    support: [...model.support.map((p) => ({ p: down(p), r: 0 })), ...model.limbSupport.map((s) => ({ p: move(s.group, s.p), r: 0 }))],
  };
  return { body, shift };
}

/** Transformação rígida de cada grupo de pele na pose, e as articulações no lugar (sem a descida). */
function poseTransforms(J: Record<JointId, Vec3>, angles: PoseAngles): { transforms: Transform[]; posed: Partial<Record<JointId, Vec3>> } {
  const transforms = new Array<Transform>(SKIN_GROUPS.length);
  const identity: Transform = { r: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: { x: 0, y: 0, z: 0 } };
  transforms.fill(identity);
  const set = (g: SkinGroup, t: Transform) => (transforms[SKIN_GROUPS.indexOf(g)] = t);
  /** Gira em volta de `pivot` (no repouso) e leva o pivô a `to`. */
  const about = (r: Mat3, pivot: Vec3, to: Vec3): Transform => ({ r, t: sub(to, apply(r, pivot)) });
  const posed: Partial<Record<JointId, Vec3>> = {};
  ([1, -1] as const).forEach((side, k) => {
    const s = side === 1 ? "E" : "D";
    const arm = angles.arms[k]!;
    const sh = J[`ombro${s}`];
    const el = J[`cotovelo${s}`];
    const wr = J[`punho${s}`];
    const rU = arc(unit(sub(el, sh)), limbDirection(side, arm.abduction, arm.flexion));
    const elP = add(sh, apply(rU, sub(el, sh)));
    const rF = mul(arc(apply(rU, unit(sub(wr, el))), limbDirection(side, arm.abduction, arm.flexion + arm.elbow)), rU);
    const wrP = add(elP, apply(rF, sub(wr, el)));
    set(`braco${s}`, about(rU, sh, sh));
    set(`antebraco${s}`, about(rF, el, elP));
    set(`mao${s}`, about(rF, el, elP));
    posed[`ombro${s}`] = sh;
    posed[`cotovelo${s}`] = elP;
    posed[`punho${s}`] = wrP;

    const leg = angles.legs[k]!;
    const hip = J[`quadril${s}`];
    const kn = J[`joelho${s}`];
    const an = J[`tornozelo${s}`];
    const rT = arc(unit(sub(kn, hip)), limbDirection(side, leg.abduction, leg.flexion));
    const knP = add(hip, apply(rT, sub(kn, hip)));
    const rS = mul(arc(apply(rT, unit(sub(an, kn))), limbDirection(side, leg.abduction, leg.flexion - leg.knee)), rT);
    const anP = add(knP, apply(rS, sub(an, kn)));
    set(`coxa${s}`, about(rT, hip, hip));
    set(`canela${s}`, about(rS, kn, knP));
    // O pé fica plano (como no manequim): só acompanha o tornozelo.
    set(`pe${s}`, { r: identity.r, t: sub(anP, an) });
    posed[`quadril${s}`] = hip;
    posed[`joelho${s}`] = knP;
    posed[`tornozelo${s}`] = anP;
  });
  return { transforms, posed };
}

/** O corpo realista como montador de corpo do movimento (`createMotionRun`, `posedWith`). */
export function realisticBuilder(model: RealisticModel): (pose: PoseAngles, options: RealisticOptions) => { body: Body; shift: number } {
  return (pose, options) => buildRealistic(model, pose, options);
}

/** O corpo realista ajustado às medidas, na pose: atalho de realisticModel + buildRealistic. */
export function createRealisticBody(
  asset: MakeHumanAsset,
  table: Record<string, number>,
  pose: BodyPose | PoseAngles = "em-pe",
  overrides: BodyOverrides = {},
  options: RealisticOptions & { sex?: BodySex; belly?: number } = {},
): Body {
  return buildRealistic(realisticModel(asset, table, overrides, options.sex, options.belly), pose, options).body;
}

/** Pele linear: cada vértice vai pela média dos grupos, com os pesos. */
function skin(model: Pick<RealisticModel, "rest" | "skinGroups" | "skinWeights">, transforms: Transform[], shift: number): Float32Array {
  const P = model.rest;
  const out = new Float32Array(P.length);
  const n = P.length / 3;
  for (let i = 0; i < n; i++) {
    const x = P[i * 3]!;
    const y = P[i * 3 + 1]!;
    const z = P[i * 3 + 2]!;
    let ox = 0;
    let oy = 0;
    let oz = 0;
    for (let k = 0; k < 4; k++) {
      const w = model.skinWeights[i * 4 + k]!;
      if (w === 0) continue;
      const { r, t } = transforms[model.skinGroups[i * 4 + k]!]!;
      ox += w * (r[0] * x + r[1] * y + r[2] * z + t.x);
      oy += w * (r[3] * x + r[4] * y + r[5] * z + t.y);
      oz += w * (r[6] * x + r[7] * y + r[8] * z + t.z);
    }
    out[i * 3] = ox;
    out[i * 3 + 1] = oy - shift;
    out[i * 3 + 2] = oz;
  }
  return out;
}

/**
 * Distância ao tronco pela série f = ρ − R(y, φ) (φ medido de +Z para +X),
 * dividida por |∇f| como no manequim, e a direção para fora pela fórmula.
 */
function torsoDistance(tp: TorsoProfile, shift: number): (p: Vec3) => { d: number; n: Vec3 | null } {
  const K = HARMONICS;
  const row = (y: number) => {
    const f = Math.min(tp.rows - 1, Math.max(0, (y - tp.bottom) / TABLE_STEP));
    const i = Math.min(tp.rows - 2, Math.floor(f));
    return { i, t: f - i };
  };
  const coef = (i: number, t: number, k: number) => tp.coeffs[i * (K + 1) + k]! * (1 - t) + tp.coeffs[(i + 1) * (K + 1) + k]! * t;
  const centerAt = (y: number) => {
    const { i, t } = row(y);
    return tp.centerZ[i]! * (1 - t) + tp.centerZ[i + 1]! * t;
  };
  /** R e dR/dφ na altura y e no ângulo (c = cos φ, s = sin φ). */
  const radius = (y: number, c: number, s: number) => {
    const { i, t } = row(y);
    let R = coef(i, t, 0);
    let dR = 0;
    // Chebyshev: cos(kφ) = T_k(c), sin(kφ) = s · U_{k−1}(c).
    let tPrev = 1;
    let tCur = c;
    let uPrev = 0;
    let uCur = 1;
    for (let k = 1; k <= K; k++) {
      const a = coef(i, t, k);
      R += a * tCur;
      dR -= k * a * s * uCur;
      const tNext = 2 * c * tCur - tPrev;
      const uNext = 2 * c * uCur - uPrev;
      tPrev = tCur;
      tCur = tNext;
      uPrev = uCur;
      uCur = uNext;
    }
    return { R, dR };
  };
  return (p) => {
    const py = p.y + shift;
    const y = Math.min(tp.top, Math.max(tp.bottom, py));
    const cz = centerAt(y);
    const dx = p.x;
    const dz = p.z - cz;
    const rho = Math.hypot(dx, dz);
    const vertical = Math.max(tp.bottom - py, py - tp.top);
    if (rho < 1e-6) {
      const { R } = radius(y, 1, 0);
      const radial = -R;
      return { d: vertical > 0 ? vertical : Math.max(radial, vertical), n: null };
    }
    const c = dz / rho;
    const s = dx / rho;
    const { R, dR } = radius(y, c, s);
    const f = rho - R;
    const k = dR / Math.max(rho, 1);
    const gx = s - k * c;
    const gz = c + k * s;
    const dRdy = (radius(y + 1, c, s).R - radius(y - 1, c, s).R) / 2;
    const czSlope = (centerAt(y + 1) - centerAt(y - 1)) / 2;
    const gy = -dRdy - gz * czSlope;
    const len = Math.sqrt(gx * gx + gz * gz + gy * gy);
    const radial = f / len;
    let d: number;
    if (vertical > 0) d = radial > 0 ? Math.hypot(radial, vertical) : vertical;
    else d = Math.max(radial, vertical);
    const n = vertical > radial ? null : { x: gx / len, y: gy / len, z: gz / len };
    return { d, n };
  };
}

// --- Vetores e rotações --------------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const xyz = (a: Vec3): [number, number, number] => [a.x, a.y, a.z];
const vec = (P: Float32Array, i: number): Vec3 => ({ x: P[i * 3]!, y: P[i * 3 + 1]!, z: P[i * 3 + 2]! });
function unit(a: Vec3): Vec3 {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}
const apply = (m: Mat3, v: Vec3): Vec3 => ({
  x: m[0] * v.x + m[1] * v.y + m[2] * v.z,
  y: m[3] * v.x + m[4] * v.y + m[5] * v.z,
  z: m[6] * v.x + m[7] * v.y + m[8] * v.z,
});
function mul(a: Mat3, b: Mat3): Mat3 {
  const o: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(a[i * 3]! * b[j]! + a[i * 3 + 1]! * b[3 + j]! + a[i * 3 + 2]! * b[6 + j]!);
  return o as unknown as Mat3;
}

/** Menor rotação que leva a direção unitária `from` até `to` (Rodrigues). */
function arc(from: Vec3, to: Vec3): Mat3 {
  const c = dot(from, to);
  const v = { x: from.y * to.z - from.z * to.y, y: from.z * to.x - from.x * to.z, z: from.x * to.y - from.y * to.x };
  if (c < -0.999999) {
    // Meia volta: em volta de um eixo perpendicular qualquer.
    const axis = unit(Math.abs(from.x) < 0.9 ? { x: 0, y: -from.z, z: from.y } : { x: -from.y, y: from.x, z: 0 });
    return [2 * axis.x * axis.x - 1, 2 * axis.x * axis.y, 2 * axis.x * axis.z, 2 * axis.y * axis.x, 2 * axis.y * axis.y - 1, 2 * axis.y * axis.z, 2 * axis.z * axis.x, 2 * axis.z * axis.y, 2 * axis.z * axis.z - 1];
  }
  const k = 1 / (1 + c);
  return [
    c + v.x * v.x * k, v.x * v.y * k - v.z, v.x * v.z * k + v.y,
    v.y * v.x * k + v.z, c + v.y * v.y * k, v.y * v.z * k - v.x,
    v.z * v.x * k - v.y, v.z * v.y * k + v.x, c + v.z * v.z * k,
  ];
}

/** A mesma direção do membro do manequim: pendurado, aberto para o lado e levado para a frente. */
function limbDirection(side: 1 | -1, abductionDeg: number, flexionDeg: number): Vec3 {
  const a = abductionDeg * RAD;
  const f = flexionDeg * RAD;
  const x = side * Math.sin(a);
  const y = -Math.cos(a);
  return { x, y: y * Math.cos(f), z: -y * Math.sin(f) };
}
