import type { Collider, Vec3 } from "../collider";
import { readMeasurements, type BodyMeasurements, type MeasurementKey } from "./measurements";
import {
  pchip,
  sdEllipsoid,
  sdRoundCone,
  superellipsePerimeter,
  superellipsePoint,
  superellipseRadius,
} from "./shapes";
import type { Body, BodyMesh, BodyPose, TorsoSection } from "./types";

/**
 * Manequim procedural ("forma de costura"): tronco por seções superelípticas
 * dimensionadas pelas medidas da tabela (busto, cintura e quadril batem por
 * construção), membros como cones arredondados articulados e cabeça
 * elipsoide. Sem asset externo. Coordenadas: mm, Y para cima, chão em 0,
 * frente em +Z, lado esquerdo do corpo em +X.
 */

type Section = TorsoSection & { exponent: number };
export type Limb = { a: Vec3; b: Vec3; r1: number; r2: number };

/** Ângulos das poses, em graus. Abdução abre para o lado; flexão leva para a frente. */
const POSES: Record<BodyPose, { arms: [ArmPose, ArmPose]; legs: [LegPose, LegPose] }> = {
  "em-pe": {
    arms: [
      { abduction: 14, flexion: 0, elbow: 8 },
      { abduction: 14, flexion: 0, elbow: 8 },
    ],
    legs: [
      { abduction: 2, flexion: 0, knee: 0 },
      { abduction: 2, flexion: 0, knee: 0 },
    ],
  },
  passo: {
    arms: [
      { abduction: 8, flexion: -14, elbow: 15 },
      { abduction: 8, flexion: 14, elbow: 15 },
    ],
    legs: [
      { abduction: 2, flexion: 20, knee: 12 },
      { abduction: 2, flexion: -12, knee: 4 },
    ],
  },
};
type ArmPose = { abduction: number; flexion: number; elbow: number };
type LegPose = { abduction: number; flexion: number; knee: number };

const RAD = Math.PI / 180;
const UP: Vec3 = { x: 0, y: 1, z: 0 };

/** Medidas trocadas na tela, por cima da tabela (ver readMeasurements). */
export type BodyOverrides = Partial<Record<MeasurementKey, number>>;

/** Membros do corpo; esquerda = +X (lado esquerdo do corpo). */
export type LimbId = "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
export const LIMB_IDS: readonly LimbId[] = ["leftArm", "rightArm", "leftLeg", "rightLeg"];

/**
 * Quanto do membro fica, em peças da corrente: braço = braço (0–1), antebraço
 * (1–2), mão (2–3); perna = coxa (0–1), canela (1–2), pé (2–3). 3 = inteiro,
 * 0 = sem o membro, 1,5 = no meio do antebraço (abaixo do cotovelo).
 */
export const LIMB_WHOLE = 3;

/**
 * Condições do corpo além das medidas: membro cortado (quanto fica, ver
 * LIMB_WHOLE) e barriga de gestante (volta da barriga, mm, no ponto mais
 * saliente entre a cintura e o quadril; menor que a volta natural ali, nada muda).
 */
export type BodyConditions = {
  limbs?: Partial<Record<LimbId, number>>;
  belly?: number;
};

/** Limites da volta da barriga, em mm. */
export const BELLY_RANGE: readonly [number, number] = [500, 2200];

/** Gera o manequim a partir das medidas da tabela (nome → mm), dos ajustes e das condições da tela. */
export function createMannequin(
  table: Record<string, number>,
  pose: BodyPose = "em-pe",
  overrides: BodyOverrides = {},
  conditions: BodyConditions = {},
): Body {
  return buildMannequin(table, pose, overrides, conditions).body;
}

/**
 * Como createMannequin, mas devolve também a distância só do tronco (sem
 * braços), que é o que uma fita métrica mede. Uso interno e nos testes.
 */
export function buildMannequin(
  table: Record<string, number>,
  pose: BodyPose = "em-pe",
  overrides: BodyOverrides = {},
  conditions: BodyConditions = {},
) {
  const reading = readMeasurements(table, overrides);
  const m = reading.values;
  const H = m.altura;

  // --- Alturas de referência ------------------------------------------------
  const crotchY = m.entrepernas;
  const waistY = Math.max(0.62 * H, crotchY + 0.1 * H);
  const hipY = Math.max(waistY - m.alturaDoQuadril, crotchY + 0.03 * H);
  const bustY = Math.max(0.72 * H, waistY + 0.07 * H);
  const shoulderY = Math.max(0.815 * H, bustY + 0.07 * H);
  const neckBaseY = shoulderY + 0.025 * H;

  // --- Cabeça ----------------------------------------------------------------
  const headR = { x: 0.045 * H, y: 0.068 * H, z: 0.058 * H };
  const headC = { x: 0, y: H - headR.y, z: 0.006 * H };
  // O pescoço termina dentro da cabeça: a tampa do tronco fica escondida e
  // não forma um degrau onde o tecido se prende.
  const neckTopY = Math.max(neckBaseY + 0.02 * H, headC.y - 0.3 * headR.y);

  // --- Tronco: seções e interpolação ----------------------------------------
  const bellyY = hipY + 0.55 * (waistY - hipY);
  const sections = torsoSections(m, { crotchY, hipY, waistY, bustY, shoulderY, neckBaseY, neckTopY }, bellyY, conditions.belly);
  const ys = sections.map((s) => s.y);
  const halfWidthAt = pchip(ys, sections.map((s) => s.halfWidth));
  const halfDepthAt = pchip(ys, sections.map((s) => s.halfDepth));
  const centerZAt = pchip(ys, sections.map((s) => s.centerZ));
  const exponentAt = pchip(ys, sections.map((s) => s.exponent));
  const torsoBottom = ys[0]!;
  const torsoTop = ys.at(-1)!;
  const byName = (y: number) => sections.find((s) => s.y === y)!;

  // --- Membros ---------------------------------------------------------------
  const { arms: armPoses, legs: legPoses } = POSES[pose];
  const shoulder = byName(shoulderY);
  const hip = byName(hipY);
  const rUpperArm = m.braco / (2 * Math.PI);
  const rElbow = rUpperArm * 0.82;
  const rWrist = m.punho / (2 * Math.PI);
  const upperArmLen = m.comprimentoDoBraco * 0.55;
  const forearmLen = m.comprimentoDoBraco * 0.45;
  const rThigh = m.coxa / (2 * Math.PI);
  const rKnee = m.joelho / (2 * Math.PI);
  const rAnkle = m.tornozelo / (2 * Math.PI);
  const hipJointY = crotchY + 0.06 * H;
  const standingAnkleY = 0.045 * H;
  const kneeLen = hipJointY - 0.285 * H;
  const shinLen = 0.285 * H - standingAnkleY;

  const limbs: Limb[] = [];
  /** Corrente de cada membro, inteira (a tela corta depois): ombro → mão, quadril → pé. */
  const chains: Record<LimbId, Limb[]> = { leftArm: [], rightArm: [], leftLeg: [], rightLeg: [] };
  const shoulderPoints = { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } };
  const ankles: Vec3[] = [];
  const legLimbs: Limb[] = [];
  const legAxes: { a: Vec3; r: number }[][] = [];
  ([1, -1] as const).forEach((side, k) => {
    // Braço: ombro → cotovelo → punho → mão.
    const arm = armPoses[k]!;
    const joint = { x: side * (shoulder.halfWidth - rUpperArm * 0.9), y: shoulderY - rUpperArm * 0.6, z: shoulder.centerZ };
    const dUpper = limbDirection(side, arm.abduction, arm.flexion);
    const elbow = add(joint, scale(dUpper, upperArmLen));
    const dFore = limbDirection(side, arm.abduction, arm.flexion + arm.elbow);
    const wrist = add(elbow, scale(dFore, forearmLen));
    const fingertip = add(wrist, scale(dFore, 0.11 * H));
    chains[side === 1 ? "leftArm" : "rightArm"].push(
      { a: joint, b: elbow, r1: rUpperArm, r2: rElbow },
      { a: elbow, b: wrist, r1: rElbow, r2: rWrist },
      { a: wrist, b: fingertip, r1: rWrist * 1.1, r2: rWrist * 0.6 },
    );
    const tip = { x: side * shoulder.halfWidth * 0.97, y: shoulderY, z: shoulder.centerZ };
    if (side === 1) shoulderPoints.left = tip;
    else shoulderPoints.right = tip;

    // Perna: quadril → joelho → tornozelo.
    const leg = legPoses[k]!;
    const hipJoint = { x: side * hip.halfWidth * 0.45, y: hipJointY, z: hip.centerZ * 0.5 };
    const dThigh = limbDirection(side, leg.abduction, leg.flexion);
    const knee = add(hipJoint, scale(dThigh, kneeLen));
    const dShin = limbDirection(side, leg.abduction, leg.flexion - leg.knee);
    const ankle = add(knee, scale(dShin, shinLen));
    chains[side === 1 ? "leftLeg" : "rightLeg"].push(
      { a: hipJoint, b: knee, r1: rThigh, r2: rKnee },
      { a: knee, b: ankle, r1: rKnee, r2: rAnkle },
    );
    legAxes.push([
      { a: hipJoint, r: rThigh },
      { a: knee, r: rKnee },
      { a: ankle, r: rAnkle },
    ]);
    ankles.push(ankle);
  });
  // Pé preso ao tornozelo, apoiado no chão quando o tornozelo está na altura de pé.
  ankles.forEach((ankle, k) => {
    const side = k === 0 ? 1 : -1;
    const heel = { x: ankle.x, y: ankle.y - (standingAnkleY - 0.018 * H), z: ankle.z - 0.02 * H };
    const toe = { x: ankle.x + side * 0.01 * H, y: ankle.y - (standingAnkleY - 0.013 * H), z: ankle.z + 0.12 * H };
    chains[side === 1 ? "leftLeg" : "rightLeg"].push({ a: heel, b: toe, r1: 0.018 * H, r2: 0.013 * H });
  });
  // Membro cortado: só o que fica entra no desenho e no colisor. Os pontos de
  // referência da perna continuam (a calça sabe onde a perna estaria e cai vazia).
  for (const id of LIMB_IDS) {
    const kept = cutChain(chains[id], conditions.limbs?.[id] ?? LIMB_WHOLE);
    (id.endsWith("Arm") ? limbs : legLimbs).push(...kept);
  }
  // Na pose de passo as pernas inclinadas encurtam a altura: desce o corpo até o pé mais baixo tocar o chão.
  // Só os pés que ficaram tocam o chão (sem nenhum, vale o corpo inteiro).
  const standing = ankles.filter((_, k) => (conditions.limbs?.[k === 0 ? "leftLeg" : "rightLeg"] ?? LIMB_WHOLE) >= 2);
  const shift = Math.min(...(standing.length > 0 ? standing : ankles).map((a) => a.y)) - standingAnkleY;
  const down = (p: Vec3): Vec3 => ({ x: p.x, y: p.y - shift, z: p.z });
  for (const l of legLimbs) limbs.push(l);
  const parts: Limb[] = limbs.map((l) => ({ ...l, a: down(l.a), b: down(l.b) }));
  const head = { c: down(headC), r: headR };
  const yOf = (y: number) => y - shift;

  // --- Colisor ---------------------------------------------------------------
  // Perfil do tronco em fatias de 1 mm, só para a inclinação vertical (o raio em si sai exato).
  const STEP = 1;
  const slices = Math.ceil((torsoTop - torsoBottom) / STEP) + 1;
  const profileTable = new Float64Array(slices * 3);
  for (let i = 0; i < slices; i++) {
    const y = Math.min(torsoTop, torsoBottom + i * STEP);
    profileTable[i * 3] = halfWidthAt(y);
    profileTable[i * 3 + 1] = halfDepthAt(y);
    profileTable[i * 3 + 2] = exponentAt(y);
  }
  /** Raio do tronco pela tabela, na altura y (do tronco) e na direção (c, s). */
  const tableRadius = (y: number, c: number, s: number): number => {
    const f = Math.min(slices - 1, Math.max(0, (y - torsoBottom) / STEP));
    const i = Math.min(slices - 2, Math.floor(f));
    const t = f - i;
    const lerp = (k: number) => profileTable[i * 3 + k]! * (1 - t) + profileTable[(i + 1) * 3 + k]! * t;
    return superellipseRadius(lerp(0), lerp(1), lerp(2), c, s);
  };
  /** Quanto o centro do tronco anda em Z por mm de altura. */
  const centerZSlope = (y: number) => (centerZAt(y + 1) - centerZAt(y - 1)) / 2;
  /**
   * Distância ao tronco. A diferença radial f = ρ − R(y, θ) é medida na
   * horizontal; dividida por |∇f| vira uma boa estimativa da distância real
   * perto da superfície, inclusive onde ela é quase horizontal (ombros).
   */
  const torsoSdf = (p: Vec3): number => {
    const py = p.y + shift;
    const y = Math.min(torsoTop, Math.max(torsoBottom, py));
    const a = halfWidthAt(y);
    const b = halfDepthAt(y);
    const n = exponentAt(y);
    const dx = p.x;
    const dz = p.z - centerZAt(y);
    const rho = Math.hypot(dx, dz);
    let radial: number;
    if (rho < 1e-6) {
      radial = -Math.min(a, b);
    } else {
      const c = dx / rho;
      const s = dz / rho;
      const f = rho - superellipseRadius(a, b, n, c, s);
      const dRdy = (tableRadius(y + 1, c, s) - tableRadius(y - 1, c, s)) / 2;
      const e = 0.01;
      const ce = Math.cos(e);
      const se = Math.sin(e);
      const dRdTheta =
        (superellipseRadius(a, b, n, c * ce - s * se, s * ce + c * se) - superellipseRadius(a, b, n, c * ce + s * se, s * ce - c * se)) /
        (2 * e);
      const k = dRdTheta / Math.max(rho, 1);
      // ∂f/∂y inclui o centro do tronco andando em Z com a altura (busto à frente).
      const gy = -dRdy - (s - k * c) * centerZSlope(y);
      radial = f / Math.sqrt(1 + k * k + gy * gy);
    }
    const vertical = Math.max(torsoBottom - py, py - torsoTop); // > 0 fora das tampas
    if (vertical > 0) return radial > 0 ? Math.hypot(radial, vertical) : vertical;
    return Math.max(radial, vertical);
  };

  /**
   * Direção para fora do tronco pela fórmula (∇f de f = ρ − R(y, θ)), sem
   * diferenças numéricas. Nas tampas devolve null (lá vale o cálculo numérico).
   */
  const torsoNormal = (p: Vec3): Vec3 | null => {
    const py = p.y + shift;
    if (py < torsoBottom || py > torsoTop) return null;
    const a = halfWidthAt(py);
    const b = halfDepthAt(py);
    const n = exponentAt(py);
    const dx = p.x;
    const dz = p.z - centerZAt(py);
    const rho = Math.hypot(dx, dz);
    if (rho < 1e-6) return null;
    const c = dx / rho;
    const s = dz / rho;
    const radial = rho - superellipseRadius(a, b, n, c, s);
    const vertical = Math.max(torsoBottom - py, py - torsoTop);
    if (vertical > radial) return null; // mais perto da tampa que da lateral
    const dRdy = (tableRadius(py + 1, c, s) - tableRadius(py - 1, c, s)) / 2;
    const e = 0.01;
    const ce = Math.cos(e);
    const se = Math.sin(e);
    const dRdTheta =
      (superellipseRadius(a, b, n, c * ce - s * se, s * ce + c * se) - superellipseRadius(a, b, n, c * ce + s * se, s * ce - c * se)) /
      (2 * e);
    const k = dRdTheta / Math.max(rho, 1);
    // Radial (c, 0, s), tangente (−s, 0, c); ∂f/∂y = −dR/dy − ∂f/∂z·dcz/dy.
    const gx = c + k * s;
    const gz = s - k * c;
    const gy = -dRdy - gz * centerZSlope(py);
    const len = Math.hypot(gx, gy, gz);
    return { x: gx / len, y: gy / len, z: gz / len };
  };

  // Partes com esfera envolvente, para pular as que estão longe.
  type Part = { sdf: (p: Vec3) => number; normal?: (p: Vec3) => Vec3 | null; center: Vec3; radius: number };
  const torsoRadiusMax = Math.max(...sections.map((s) => Math.max(s.halfWidth, s.halfDepth) + Math.abs(s.centerZ)));
  const torsoMid = (torsoBottom + torsoTop) / 2;
  const partList: Part[] = [
    {
      sdf: torsoSdf,
      normal: torsoNormal,
      center: { x: 0, y: torsoMid - shift, z: 0 },
      radius: Math.hypot(torsoRadiusMax, (torsoTop - torsoBottom) / 2),
    },
    {
      sdf: (p) => sdEllipsoid(p, head.c, head.r),
      center: head.c,
      radius: Math.max(head.r.x, head.r.y, head.r.z),
    },
    ...parts.map((l): Part => ({
      sdf: (p) => sdRoundCone(p, l.a, l.b, l.r1, l.r2),
      center: { x: (l.a.x + l.b.x) / 2, y: (l.a.y + l.b.y) / 2, z: (l.a.z + l.b.z) / 2 },
      radius: Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y, l.b.z - l.a.z) / 2 + Math.max(l.r1, l.r2),
    })),
  ];
  /** Menor distância e a parte que a deu. */
  const nearest = (p: Vec3): { d: number; part: Part } => {
    let d = Infinity;
    let best = partList[0]!;
    for (const part of partList) {
      const bound = Math.hypot(p.x - part.center.x, p.y - part.center.y, p.z - part.center.z) - part.radius;
      if (bound >= d) continue; // a esfera envolvente já está mais longe que o melhor achado
      const pd = part.sdf(p);
      if (pd < d) {
        d = pd;
        best = part;
      }
    }
    return { d, part: best };
  };

  const mesh = buildMesh(sections, { halfWidthAt, halfDepthAt, centerZAt, exponentAt }, parts, head, shift);
  const box = boundingBox(mesh.positions);
  const collider: Collider = {
    query(x, y, z) {
      // Longe do corpo, a distância à caixa já basta (é menor ou igual à real).
      const out = Math.hypot(
        Math.max(box.min.x - x, 0, x - box.max.x),
        Math.max(box.min.y - y, 0, y - box.max.y),
        Math.max(box.min.z - z, 0, z - box.max.z),
      );
      if (out > 30) return { distance: out, normal: UP };
      const { d: distance, part } = nearest({ x, y, z });
      // A direção para fora só importa perto da superfície (o simulador só a usa no contato).
      if (distance > 30) return { distance, normal: UP };
      const analytic = part.normal?.({ x, y, z });
      if (analytic) return { distance, normal: analytic };
      const e = 0.5;
      const f = part.sdf;
      const gx = f({ x: x + e, y, z }) - f({ x: x - e, y, z });
      const gy = f({ x, y: y + e, z }) - f({ x, y: y - e, z });
      const gz = f({ x, y, z: z + e }) - f({ x, y, z: z - e });
      const len = Math.hypot(gx, gy, gz);
      return { distance, normal: len > 1e-12 ? { x: gx / len, y: gy / len, z: gz / len } : UP };
    },
  };

  const shifted = (s: Section): TorsoSection => ({ y: yOf(s.y), halfWidth: s.halfWidth, halfDepth: s.halfDepth, centerZ: s.centerZ });
  const perimeterAt = (y: number) => {
    const s = byName(y);
    return superellipsePerimeter(s.halfWidth, s.halfDepth, s.exponent);
  };

  const body: Body = {
    kind: "manequim",
    pose,
    mesh,
    collider,
    fit: {
      reading,
      obtained: { busto: perimeterAt(bustY), cintura: perimeterAt(waistY), quadril: perimeterAt(hipY), altura: box.max.y },
    },
    landmarks: {
      crotch: shifted(byName(crotchY)),
      hip: shifted(hip),
      waist: shifted(byName(waistY)),
      ...(sections.some((s) => s.y === bellyY) ? { belly: shifted(byName(bellyY)) } : {}),
      bust: shifted(byName(bustY)),
      shoulder: shifted(shoulder),
      neck: shifted(byName(neckBaseY)),
      shoulderPoints: { left: down(shoulderPoints.left), right: down(shoulderPoints.right) },
      legs: {
        left: legAxes[0]!.map((p) => ({ ...down(p.a), r: p.r })),
        right: legAxes[1]!.map((p) => ({ ...down(p.a), r: p.r })),
      },
    },
  };
  return { body, torsoSdf, chains };
}

/**
 * Corta a corrente do membro: `keep` em peças (0 a LIMB_WHOLE). A peça cortada
 * no meio termina ali, com o raio daquele ponto (a ponta do cone já é redonda).
 * Pedaço menor que 5 mm não entra (some com o membro).
 */
export function cutChain(chain: readonly Limb[], keep: number): Limb[] {
  const k = Math.min(chain.length, Math.max(0, Number.isFinite(keep) ? keep : chain.length));
  const out: Limb[] = [];
  for (let i = 0; i < chain.length; i++) {
    const l = chain[i]!;
    const t = Math.min(1, k - i);
    if (t <= 0) break;
    if (t >= 1) {
      out.push(l);
      continue;
    }
    const b = { x: l.a.x + (l.b.x - l.a.x) * t, y: l.a.y + (l.b.y - l.a.y) * t, z: l.a.z + (l.b.z - l.a.z) * t };
    if (Math.hypot(b.x - l.a.x, b.y - l.a.y, b.z - l.a.z) >= 5) out.push({ a: l.a, b, r1: l.r1, r2: l.r1 + (l.r2 - l.r1) * t });
  }
  return out;
}

// ---------------------------------------------------------------------------

type Levels = {
  crotchY: number;
  hipY: number;
  waistY: number;
  bustY: number;
  shoulderY: number;
  neckBaseY: number;
  neckTopY: number;
};

/**
 * Seções do tronco, de baixo para cima. As de busto, cintura e quadril têm
 * exatamente a circunferência da tabela; as intermediárias saem de
 * proporções delas.
 */
function torsoSections(m: BodyMeasurements, l: Levels, bellyY: number, belly?: number): Section[] {
  const H = m.altura;
  const byCircumference = (y: number, c: number, aspect: number, exponent: number, zFactor: number): Section => {
    const halfWidth = c / superellipsePerimeter(1, aspect, exponent);
    const halfDepth = halfWidth * aspect;
    return { y, halfWidth, halfDepth, centerZ: zFactor * halfDepth, exponent };
  };
  const underbustY = l.bustY - 0.035 * H;
  const armpitY = l.bustY + 0.035 * H;
  const shoulderHalfWidth = m.larguraDasCostas / 2 + m.ombro * 0.15;
  const list: Section[] = [
    byCircumference(l.crotchY - 0.01 * H, m.quadril * 0.8, 0.66, 2.4, -0.03),
    byCircumference(l.crotchY, m.quadril * 0.93, 0.68, 2.4, -0.04),
    byCircumference(l.hipY, m.quadril, 0.7, 2.3, -0.06),
    byCircumference(l.waistY, m.cintura, 0.74, 2.2, 0),
    byCircumference(underbustY, Math.max(m.busto * 0.88, m.cintura), 0.7, 2.2, 0.02),
    byCircumference(l.bustY, m.busto, 0.72, 2.2, 0.08),
    byCircumference(armpitY, m.busto * 0.96, 0.64, 2.5, 0.02),
    { y: l.shoulderY, halfWidth: shoulderHalfWidth, halfDepth: shoulderHalfWidth * 0.42, centerZ: -0.02 * shoulderHalfWidth, exponent: 3 },
    byCircumference(l.neckBaseY, m.pescoco * 1.25, 0.85, 2.1, 0),
    byCircumference(l.neckTopY, m.pescoco, 0.9, 2, 0.05),
  ];
  if (belly !== undefined && Number.isFinite(belly)) {
    // Gestante: a barriga avança só pela frente (cresce a profundidade e o centro
    // anda o mesmo tanto para a frente: as costas não saem do lugar). Quadril e
    // busto continuam os da tabela; a cintura e o abaixo do busto acompanham em parte.
    const natural = byCircumference(bellyY, (m.quadril + m.cintura) / 2, 0.72, 2.2, -0.03);
    const target = Math.min(BELLY_RANGE[1], belly);
    const grow = frontGrowth(natural, target);
    if (grow > 0) {
      const push = (s: Section, d: number): Section => ({ ...s, halfDepth: s.halfDepth + d, centerZ: s.centerZ + d });
      const at = (y: number) => list.findIndex((s) => s.y === y);
      list.push(push(natural, grow));
      const w = at(l.waistY);
      list[w] = push(list[w]!, grow * 0.75);
      const u = at(underbustY);
      list[u] = push(list[u]!, grow * 0.3);
    }
  }
  return list.sort((a, b) => a.y - b.y);
}

/** Quanto a frente precisa avançar (mm) para a volta da seção chegar a `target` (0 se já chega). */
function frontGrowth(s: Section, target: number): number {
  const perimeter = (d: number) => superellipsePerimeter(s.halfWidth, s.halfDepth + d, s.exponent);
  if (perimeter(0) >= target) return 0;
  let lo = 0;
  let hi = 2000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (perimeter(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function limbDirection(side: 1 | -1, abductionDeg: number, flexionDeg: number): Vec3 {
  const a = abductionDeg * RAD;
  const f = flexionDeg * RAD;
  // Pendurado (0, −1, 0), aberto para o lado e depois levado para a frente (+Z).
  const x = side * Math.sin(a);
  const y = -Math.cos(a);
  return { x, y: y * Math.cos(f), z: -y * Math.sin(f) };
}

const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });

function boundingBox(positions: Float32Array) {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (let i = 0; i < positions.length; i += 3) {
    min.x = Math.min(min.x, positions[i]!);
    min.y = Math.min(min.y, positions[i + 1]!);
    min.z = Math.min(min.z, positions[i + 2]!);
    max.x = Math.max(max.x, positions[i]!);
    max.y = Math.max(max.y, positions[i + 1]!);
    max.z = Math.max(max.z, positions[i + 2]!);
  }
  return { min, max };
}

// --- Malha para desenhar ------------------------------------------------------

type Profile = {
  halfWidthAt: (y: number) => number;
  halfDepthAt: (y: number) => number;
  centerZAt: (y: number) => number;
  exponentAt: (y: number) => number;
};

function buildMesh(
  sections: Section[],
  profile: Profile,
  limbs: Limb[],
  head: { c: Vec3; r: Vec3 },
  shift: number,
): BodyMesh {
  const pos: number[] = [];
  const idx: number[] = [];
  const AROUND = 48;

  // Tronco: anéis a cada ~1 cm, com tampa embaixo e em cima.
  const y0 = sections[0]!.y;
  const y1 = sections.at(-1)!.y;
  const rings = Math.max(2, Math.ceil((y1 - y0) / 10));
  const base = pos.length / 3;
  for (let r = 0; r <= rings; r++) {
    const y = y0 + ((y1 - y0) * r) / rings;
    const a = profile.halfWidthAt(y);
    const b = profile.halfDepthAt(y);
    const n = profile.exponentAt(y);
    const cz = profile.centerZAt(y);
    for (let k = 0; k < AROUND; k++) {
      const p = superellipsePoint(a, b, n, (2 * Math.PI * k) / AROUND);
      pos.push(p.x, y - shift, cz + p.z);
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let k = 0; k < AROUND; k++) {
      const a = base + r * AROUND + k;
      const b = base + r * AROUND + ((k + 1) % AROUND);
      const c = a + AROUND;
      const d = b + AROUND;
      idx.push(a, c, b, b, c, d);
    }
  }
  const cap = (ring: number, y: number, up: boolean) => {
    const center = pos.length / 3;
    pos.push(0, y - shift, profile.centerZAt(y));
    for (let k = 0; k < AROUND; k++) {
      const a = base + ring * AROUND + k;
      const b = base + ring * AROUND + ((k + 1) % AROUND);
      if (up) idx.push(center, b, a);
      else idx.push(center, a, b);
    }
  };
  cap(0, y0, false);
  cap(rings, y1, true);

  for (const l of limbs) addCapsule(pos, idx, l);
  addEllipsoid(pos, idx, head.c, head.r);
  return { positions: Float32Array.from(pos), indices: Uint32Array.from(idx) };
}

/** Tubo afinado de a até b com pontas arredondadas (aproxima o cone arredondado). */
function addCapsule(pos: number[], idx: number[], l: Limb) {
  const AROUND = 20;
  const axis = { x: l.b.x - l.a.x, y: l.b.y - l.a.y, z: l.b.z - l.a.z };
  const len = Math.hypot(axis.x, axis.y, axis.z) || 1;
  const w = { x: axis.x / len, y: axis.y / len, z: axis.z / len };
  const helper = Math.abs(w.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u = normalize(cross(helper, w));
  const v = cross(w, u);
  // Perfil: meia esfera em a, tronco de cone, meia esfera em b.
  const profile: { t: number; r: number }[] = [];
  const CAP = 5;
  for (let i = 0; i <= CAP; i++) {
    const ang = (Math.PI / 2) * (1 - i / CAP);
    profile.push({ t: -Math.sin(ang) * l.r1, r: Math.cos(ang) * l.r1 });
  }
  const BODY = 6;
  for (let i = 1; i < BODY; i++) profile.push({ t: (len * i) / BODY, r: l.r1 + ((l.r2 - l.r1) * i) / BODY });
  for (let i = 0; i <= CAP; i++) {
    const ang = (Math.PI / 2) * (i / CAP);
    profile.push({ t: len + Math.sin(ang) * l.r2, r: Math.cos(ang) * l.r2 });
  }
  const base = pos.length / 3;
  for (const { t, r } of profile) {
    for (let k = 0; k < AROUND; k++) {
      const ang = (2 * Math.PI * k) / AROUND;
      const c = Math.cos(ang) * r;
      const s = Math.sin(ang) * r;
      pos.push(l.a.x + w.x * t + u.x * c + v.x * s, l.a.y + w.y * t + u.y * c + v.y * s, l.a.z + w.z * t + u.z * c + v.z * s);
    }
  }
  for (let r = 0; r < profile.length - 1; r++) {
    for (let k = 0; k < AROUND; k++) {
      const a = base + r * AROUND + k;
      const b = base + r * AROUND + ((k + 1) % AROUND);
      idx.push(a, b, a + AROUND, b, b + AROUND, a + AROUND);
    }
  }
}

function addEllipsoid(pos: number[], idx: number[], c: Vec3, r: Vec3) {
  const LAT = 16;
  const LON = 24;
  const base = pos.length / 3;
  for (let i = 0; i <= LAT; i++) {
    const phi = (Math.PI * i) / LAT;
    for (let k = 0; k < LON; k++) {
      const th = (2 * Math.PI * k) / LON;
      pos.push(c.x + r.x * Math.sin(phi) * Math.cos(th), c.y + r.y * Math.cos(phi), c.z + r.z * Math.sin(phi) * Math.sin(th));
    }
  }
  for (let i = 0; i < LAT; i++) {
    for (let k = 0; k < LON; k++) {
      const a = base + i * LON + k;
      const b = base + i * LON + ((k + 1) % LON);
      idx.push(a, b, a + LON, b, b + LON, a + LON);
    }
  }
}

const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
function normalize(a: Vec3): Vec3 {
  const len = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / len, y: a.y / len, z: a.z / len };
}
