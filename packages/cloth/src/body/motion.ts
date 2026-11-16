import type { Collider, Vec3 } from "../collider";
import { buildMannequin, poseAngles, type ArmPose, type BodyConditions, type BodyOverrides, type LegPose, type PoseAngles } from "./mannequin";
import type { Body } from "./types";

/**
 * Movimento na Prova (Fase 7, M1): o manequim de hoje anda, corre, dança,
 * acena, senta, agacha e deita. Cada movimento é um clipe de quadros-chave
 * escritos aqui (ângulos das articulações e o giro do corpo inteiro), sem
 * captura de movimento de fora. Todo clipe começa e termina na pose em pé, a
 * mesma em que a roupa assenta antes de o movimento começar.
 *
 * Unidades: graus, mm e s. Coordenadas do corpo (Y para cima, chão em 0,
 * frente em +Z, esquerda em +X).
 */

export type MotionId = "andar" | "correr" | "dancar" | "acenar" | "sentar" | "agachar" | "deitar";

/**
 * O corpo inteiro: giro em volta do eixo vertical (`yaw`, vira para a
 * esquerda), inclinação para trás (`pitch`, 90 = deitado de costas) e para o
 * lado (`roll`), e o deslocamento no chão (`x`, `z`). A altura sai sozinha:
 * o corpo nunca entra no chão.
 */
export type RootPose = { yaw: number; pitch: number; roll: number; x: number; z: number };

export type MotionPose = PoseAngles & { root: RootPose };

export type MotionClip = {
  id: MotionId;
  name: string;
  hint: string;
  /** Quadros-chave em ordem de tempo; o primeiro em 0 e o último no fim do clipe, os dois em pé. */
  keys: readonly { t: number; pose: MotionPose }[];
  /** Assento (sentar): o banco aparece quando o quadril chega nele. */
  seat?: boolean;
  /** Clipe rápido: mais subpassos de simulação, para o tecido não atravessar um membro. */
  fast?: boolean;
  /**
   * No lugar (andar, correr, dançar, acenar): o tronco fica na altura de em pé e
   * o pé sai do chão na passada. Sem isso, o corpo desceria até o pé mais baixo
   * a cada passo, e o tronco subindo e descendo chacoalhava a roupa para baixo.
   */
  inPlace?: boolean;
};

const ROOT: RootPose = { yaw: 0, pitch: 0, roll: 0, x: 0, z: 0 };
const REST = poseAngles("em-pe");
const arm = (abduction: number, flexion: number, elbow: number): ArmPose => ({ abduction, flexion, elbow });
const leg = (abduction: number, flexion: number, knee: number): LegPose => ({ abduction, flexion, knee });

/** A pose em pé, com o que mudar por cima (esquerda primeiro). */
function pose(change: { arms?: [ArmPose?, ArmPose?]; legs?: [LegPose?, LegPose?]; root?: Partial<RootPose> } = {}): MotionPose {
  return {
    arms: [change.arms?.[0] ?? REST.arms[0], change.arms?.[1] ?? REST.arms[1]],
    legs: [change.legs?.[0] ?? REST.legs[0], change.legs?.[1] ?? REST.legs[1]],
    root: { ...ROOT, ...change.root },
  };
}

/** Repete um ciclo `times` vezes depois de `start` s, entre a pose em pé do começo e a do fim. */
function cycle(cycleKeys: readonly MotionPose[], period: number, times: number, start = 0.4): { t: number; pose: MotionPose }[] {
  const out: { t: number; pose: MotionPose }[] = [{ t: 0, pose: pose() }];
  const step = period / cycleKeys.length;
  for (let c = 0; c < times; c++) cycleKeys.forEach((p, k) => out.push({ t: start + c * period + k * step, pose: p }));
  out.push({ t: start + times * period + start * 0.5, pose: pose() });
  return out;
}

/** Espelho de uma pose: esquerda ↔ direita (o ciclo de andar é metade e o espelho). */
function mirror(p: MotionPose): MotionPose {
  return { arms: [p.arms[1], p.arms[0]], legs: [p.legs[1], p.legs[0]], root: { ...p.root, yaw: -p.root.yaw, roll: -p.root.roll, x: -p.root.x } };
}

// Andar: pé da frente toca o chão, passa, troca.
const walkContact = pose({ arms: [arm(10, -18, 15), arm(10, 18, 22)], legs: [leg(2, 22, 4), leg(2, -14, 14)] });
const walkPass = pose({ arms: [arm(12, 0, 12), arm(12, 0, 12)], legs: [leg(2, 2, 6), leg(2, 18, 48)] });
// Correr: passadas maiores, cotovelos a 90°.
const runContact = pose({ arms: [arm(10, -38, 85), arm(10, 40, 95)], legs: [leg(3, 42, 18), leg(3, -22, 40)] });
const runPass = pose({ arms: [arm(10, 0, 90), arm(10, 0, 90)], legs: [leg(3, 8, 20), leg(3, 50, 105)] });
// Dançar: braços para cima um de cada vez, joelhos marcando o tempo, o corpo balançando.
const danceA = pose({ arms: [arm(150, 10, 40), arm(40, 20, 70)], legs: [leg(6, 10, 18), leg(6, 4, 6)], root: { yaw: 18, roll: 4 } });
const danceB = pose({ arms: [arm(60, 15, 60), arm(120, 5, 50)], legs: [leg(6, 4, 6), leg(6, 10, 18)], root: { yaw: 0, roll: 0 } });
// Acenar: braço direito para cima, o antebraço indo e vindo.
const waveOut = pose({ arms: [undefined, arm(150, 15, 20)] });
const waveIn = pose({ arms: [undefined, arm(150, 15, 70)] });
// Sentar, agachar e deitar.
const seated = pose({ arms: [arm(14, 35, 60), arm(14, 35, 60)], legs: [leg(4, 90, 90), leg(4, 90, 90)] });
const squat = pose({ arms: [arm(10, 70, 20), arm(10, 70, 20)], legs: [leg(16, 112, 132), leg(16, 112, 132)] });
const lying = pose({ arms: [arm(12, 0, 10), arm(12, 0, 10)], root: { pitch: 90 } });

export const MOTIONS: readonly MotionClip[] = [
  { id: "andar", name: "Andar", hint: "Caminha no lugar: a roupa na passada", keys: cycle([walkContact, walkPass, mirror(walkContact), mirror(walkPass)], 1.1, 3), inPlace: true },
  { id: "correr", name: "Correr", hint: "Corre no lugar: passadas grandes", keys: cycle([runContact, runPass, mirror(runContact), mirror(runPass)], 0.7, 4), fast: true, inPlace: true },
  { id: "dancar", name: "Dançar", hint: "Braços para cima e o corpo balançando", keys: cycle([danceA, danceB, mirror(danceA), danceB], 2, 2), fast: true, inPlace: true },
  { id: "acenar", name: "Acenar", hint: "O braço direito para cima, acenando", inPlace: true, keys: [{ t: 0, pose: pose() }, ...cycle([waveOut, waveIn], 0.6, 4, 0.8).slice(1, -1), { t: 3.6, pose: pose() }] },
  {
    id: "sentar",
    name: "Sentar",
    hint: "Senta num banco e levanta",
    seat: true,
    keys: [
      { t: 0, pose: pose() },
      { t: 1.4, pose: seated },
      { t: 2.8, pose: seated },
      { t: 4.2, pose: pose() },
    ],
  },
  {
    id: "agachar",
    name: "Agachar",
    hint: "Agacha e levanta",
    keys: [
      { t: 0, pose: pose() },
      { t: 1.2, pose: squat },
      { t: 2.2, pose: squat },
      { t: 3.4, pose: pose() },
    ],
  },
  {
    id: "deitar",
    name: "Deitar",
    hint: "Inclina para trás até deitar de costas e levanta",
    keys: [
      { t: 0, pose: pose() },
      { t: 2, pose: lying },
      { t: 3.5, pose: lying },
      { t: 5.5, pose: pose() },
    ],
  },
];

export const motionClip = (id: MotionId): MotionClip => MOTIONS.find((m) => m.id === id)!;

/** Duração do clipe, em s. */
export const motionDuration = (clip: MotionClip) => clip.keys.at(-1)!.t;

// ---------------------------------------------------------------------------
// Pose no tempo
// ---------------------------------------------------------------------------

function flatten(p: MotionPose): number[] {
  const out: number[] = [];
  for (const a of p.arms) out.push(a.abduction, a.flexion, a.elbow);
  for (const l of p.legs) out.push(l.abduction, l.flexion, l.knee);
  out.push(p.root.yaw, p.root.pitch, p.root.roll, p.root.x, p.root.z);
  return out;
}

function unflatten(v: readonly number[]): MotionPose {
  const a = (i: number) => arm(v[i]!, v[i + 1]!, v[i + 2]!);
  const l = (i: number) => leg(v[i]!, v[i + 1]!, v[i + 2]!);
  return { arms: [a(0), a(3)], legs: [l(6), l(9)], root: { yaw: v[12]!, pitch: v[13]!, roll: v[14]!, x: v[15]!, z: v[16]! } };
}

/**
 * Pose no tempo t (s), entre os quadros-chave por uma curva monotônica
 * (passa por todos, sem tranco e sem passar do ponto: parado é parado). Fora do clipe, a pose em pé. Nas pontas, a curva
 * para (velocidade zero), então emendar o fim no começo não dá tranco.
 */
export function motionPose(clip: MotionClip, t: number): MotionPose {
  const keys = clip.keys;
  if (!(t > 0)) return unflatten(flatten(keys[0]!.pose));
  if (t >= motionDuration(clip)) return unflatten(flatten(keys.at(-1)!.pose));
  let k = 0;
  while (k < keys.length - 2 && keys[k + 1]!.t <= t) k++;
  const k0 = keys[k]!;
  const k1 = keys[k + 1]!;
  const u = (t - k0.t) / (k1.t - k0.t);
  const p1 = flatten(k0.pose);
  const p2 = flatten(k1.pose);
  // Tangentes monotônicas (Fritsch-Carlson, como a pchip): a curva nunca passa de um quadro-chave.
  // Onde a pose para (dois quadros iguais) ou vira, a tangente é zero; zero também nas pontas do clipe.
  const tangent = (i: number) => {
    if (i <= 0 || i >= keys.length - 1) return p1.map(() => 0);
    const a = flatten(keys[i - 1]!.pose);
    const c = flatten(keys[i]!.pose);
    const b = flatten(keys[i + 1]!.pose);
    const h0 = keys[i]!.t - keys[i - 1]!.t;
    const h1 = keys[i + 1]!.t - keys[i]!.t;
    return c.map((x, j) => {
      const d0 = (x - a[j]!) / h0;
      const d1 = (b[j]! - x) / h1;
      if (d0 === 0 || d1 === 0 || Math.sign(d0) !== Math.sign(d1)) return 0;
      // Média harmônica ponderada: limita a tangente e impede o passa-do-ponto.
      const w0 = 2 * h1 + h0;
      const w1 = h1 + 2 * h0;
      return (w0 + w1) / (w0 / d0 + w1 / d1);
    });
  };
  const m1 = tangent(k);
  const m2 = tangent(k + 1);
  const span = k1.t - k0.t;
  const u2 = u * u;
  const u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;
  return unflatten(p1.map((x, j) => h00 * x + h10 * span * m1[j]! + h01 * p2[j]! + h11 * span * m2[j]!));
}

// ---------------------------------------------------------------------------
// O corpo na pose
// ---------------------------------------------------------------------------

type Mat3 = readonly [number, number, number, number, number, number, number, number, number];

/** Giro do corpo: inclina para trás (X), para o lado (Z) e vira (Y), nessa ordem. */
function rootMatrix(r: RootPose): Mat3 {
  const p = (-r.pitch * Math.PI) / 180; // para trás: a frente (+Z) sobe
  const q = (r.roll * Math.PI) / 180;
  const y = (r.yaw * Math.PI) / 180;
  const [cp, sp, cq, sq, cy, sy] = [Math.cos(p), Math.sin(p), Math.cos(q), Math.sin(q), Math.cos(y), Math.sin(y)];
  // Rx(p): y' = y cp − z sp, z' = y sp + z cp. Rz(q), Ry(y). M = Ry · Rz · Rx.
  const rx: Mat3 = [1, 0, 0, 0, cp, -sp, 0, sp, cp];
  const rz: Mat3 = [cq, -sq, 0, sq, cq, 0, 0, 0, 1];
  const ry: Mat3 = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  return mul(ry, mul(rz, rx));
}

function mul(a: Mat3, b: Mat3): Mat3 {
  const o: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(a[i * 3]! * b[j]! + a[i * 3 + 1]! * b[3 + j]! + a[i * 3 + 2]! * b[6 + j]!);
  return o as unknown as Mat3;
}

const apply = (m: Mat3, v: Vec3): Vec3 => ({
  x: m[0] * v.x + m[1] * v.y + m[2] * v.z,
  y: m[3] * v.x + m[4] * v.y + m[5] * v.z,
  z: m[6] * v.x + m[7] * v.y + m[8] * v.z,
});
const applyT = (m: Mat3, v: Vec3): Vec3 => ({
  x: m[0] * v.x + m[3] * v.y + m[6] * v.z,
  y: m[1] * v.x + m[4] * v.y + m[7] * v.z,
  z: m[2] * v.x + m[5] * v.y + m[8] * v.z,
});

/** Pontos de apoio do corpo (bordas das seções do tronco e as articulações com o raio), para achar o mais baixo depois do giro. */
function supportPoints(body: Body): { p: Vec3; r: number }[] {
  const out: { p: Vec3; r: number }[] = [];
  const l = body.landmarks;
  for (const s of [l.crotch, l.hip, l.waist, l.bust, l.shoulder, l.neck, ...(l.belly ? [l.belly] : [])]) {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      out.push({ p: { x: s.halfWidth * Math.cos(a), y: s.y, z: s.centerZ + s.halfDepth * Math.sin(a) }, r: 0 });
    }
  }
  for (const chain of [l.legs.left, l.legs.right, l.arms.left, l.arms.right]) for (const j of chain) out.push({ p: { x: j.x, y: j.y, z: j.z }, r: j.r });
  // Cabeça: alto e nuca (o manequim tem a cabeça no alto do corpo).
  const top = l.neck.y + (l.neck.y - l.shoulder.y) * 4;
  out.push({ p: { x: 0, y: top, z: -l.neck.halfDepth }, r: 0 }, { p: { x: 0, y: top, z: l.neck.halfDepth }, r: 0 });
  return out;
}

/** Corpo girado e deslocado: o colisor pergunta no corpo de antes, e a malha e as referências andam junto. */
function transformBody(body: Body, m: Mat3, offset: Vec3): Body {
  const inner = body.collider;
  const collider: Collider = {
    query(x, y, z) {
      const local = applyT(m, { x: x - offset.x, y: y - offset.y, z: z - offset.z });
      const q = inner.query(local.x, local.y, local.z);
      return { distance: q.distance, normal: apply(m, q.normal) };
    },
  };
  const src = body.mesh.positions;
  const positions = new Float32Array(src.length);
  for (let i = 0; i < src.length; i += 3) {
    const v = apply(m, { x: src[i]!, y: src[i + 1]!, z: src[i + 2]! });
    positions[i] = v.x + offset.x;
    positions[i + 1] = v.y + offset.y;
    positions[i + 2] = v.z + offset.z;
  }
  const move = (p: Vec3): Vec3 => {
    const v = apply(m, p);
    return { x: v.x + offset.x, y: v.y + offset.y, z: v.z + offset.z };
  };
  const axis = (list: readonly { x: number; y: number; z: number; r: number }[]) => list.map((j) => ({ ...move(j), r: j.r }));
  const l = body.landmarks;
  return {
    ...body,
    collider,
    mesh: { positions, indices: body.mesh.indices },
    landmarks: {
      ...l,
      shoulderPoints: { left: move(l.shoulderPoints.left), right: move(l.shoulderPoints.right) },
      legs: { left: axis(l.legs.left), right: axis(l.legs.right) },
      arms: { left: axis(l.arms.left), right: axis(l.arms.right) },
    },
  };
}

/** Folga entre a coxa sentada e o alto do banco, em mm: a espessura do tecido e a folga da colisão. */
export const SEAT_CLEARANCE = 10;

/** Assento do "sentar": altura do alto (mm) e a caixa no chão. */
export type Seat = { top: number; minX: number; maxX: number; minZ: number; maxZ: number; /** Altura da articulação do quadril sentado (mm). */ hip: number };

/**
 * O manequim na pose do movimento. `mesh: false` monta só o colisor (para
 * cada passo da simulação); a malha vai só nos quadros que se desenham.
 * Com giro, o corpo sobe até o ponto mais baixo encostar no chão.
 */
export function motionBody(
  table: Record<string, number>,
  pose: MotionPose,
  overrides: BodyOverrides = {},
  conditions: BodyConditions = {},
  options: { mesh?: boolean; shift?: number } = {},
): Body {
  return posedMotion(table, pose, overrides, conditions, options).body;
}

/**
 * Como motionBody, mais os pontos de referência do corpo já no lugar
 * (`probe`, sempre os mesmos e na mesma ordem): a maior distância entre os de
 * duas poses diz quanto a superfície andou (ver `probeMoved`).
 */
export function posedMotion(
  table: Record<string, number>,
  pose: MotionPose,
  overrides: BodyOverrides = {},
  conditions: BodyConditions = {},
  options: { mesh?: boolean; shift?: number } = {},
): { body: Body; probe: Vec3[] } {
  const body = buildMannequin(table, pose, overrides, conditions, options).body;
  const local = probePoints(body);
  const r = pose.root;
  if (r.yaw === 0 && r.pitch === 0 && r.roll === 0 && r.x === 0 && r.z === 0) return { body, probe: local };
  const m = rootMatrix(r);
  let lowest = 0;
  if (r.pitch !== 0 || r.roll !== 0) {
    lowest = Infinity;
    for (const { p, r: radius } of supportPoints(body)) lowest = Math.min(lowest, apply(m, p).y - radius);
    lowest = Math.min(0, lowest);
  }
  const offset = { x: r.x, y: -lowest, z: r.z };
  const probe = local.map((p) => {
    const v = apply(m, p);
    return { x: v.x + offset.x, y: v.y + offset.y, z: v.z + offset.z };
  });
  return { body: transformBody(body, m, offset), probe };
}

/** Pontos de referência no corpo sem giro: borda do tronco, articulações e as pontas (dedos e pés), que andam mais. */
function probePoints(body: Body): Vec3[] {
  const out = supportPoints(body).map(({ p }) => p);
  const l = body.landmarks;
  for (const chain of [l.arms.left, l.arms.right, l.legs.left, l.legs.right]) {
    const [, mid, end] = chain;
    if (!mid || !end) continue;
    // A mão e o pé passam da última articulação: estende o último trecho.
    out.push({ x: end.x + (end.x - mid.x) * 0.5, y: end.y + (end.y - mid.y) * 0.5, z: end.z + (end.z - mid.z) * 0.5 });
  }
  return out;
}

/** Quanto a superfície andou entre duas poses, em mm (a maior distância entre os pontos de referência, com folga). */
export function probeMoved(a: readonly Vec3[], b: readonly Vec3[]): number {
  if (a.length !== b.length) return Infinity;
  let max = 0;
  for (let i = 0; i < a.length; i++) max = Math.max(max, Math.hypot(a[i]!.x - b[i]!.x, a[i]!.y - b[i]!.y, a[i]!.z - b[i]!.z));
  // Entre os pontos medidos a superfície pode andar um pouco mais (o meio de um membro que gira).
  return max * 1.25 + 0.5;
}

/**
 * O banco do "sentar", pela pose sentada do clipe: o alto fica SEAT_CLEARANCE
 * mm abaixo do ponto mais baixo do corpo sobre ele (o bumbum ou a coxa), e a caixa vai das costas do quadril até um pouco antes do joelho, para
 * as canelas e os pés ficarem de fora. null se o clipe não tem assento.
 */
export function motionSeat(clip: MotionClip, table: Record<string, number>, overrides: BodyOverrides = {}, conditions: BodyConditions = {}): Seat | null {
  if (!clip.seat) return null;
  // A pose mais baixa do clipe (o quadril mais perto do chão).
  let best: Body | null = null;
  for (const k of clip.keys) {
    const b = motionBody(table, k.pose, overrides, conditions, { mesh: false });
    if (!best || b.landmarks.legs.left[0]!.y < best.landmarks.legs.left[0]!.y) best = b;
  }
  const [hipL, kneeL] = best!.landmarks.legs.left;
  const hip = best!.landmarks.hip;
  const box = {
    minX: -hip.halfWidth * 1.2,
    maxX: hip.halfWidth * 1.2,
    minZ: hip.centerZ - hip.halfDepth * 1.1,
    maxZ: hipL!.z + (kneeL!.z - hipL!.z) * 0.6,
  };
  // O fundo do corpo sobre o banco (o bumbum fica abaixo da coxa): descendo pelo colisor em vários pontos da caixa.
  let bottom = Infinity;
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= 6; j++) {
      const x = box.minX + ((box.maxX - box.minX) * i) / 6;
      const z = box.minZ + ((box.maxZ - box.minZ) * j) / 6;
      for (let y = hipL!.y; y > 0; y -= 2) {
        if (best!.collider.query(x, y, z).distance <= 0) bottom = Math.min(bottom, y);
      }
    }
  }
  if (!Number.isFinite(bottom)) bottom = hipL!.y - hipL!.r;
  // Espaço para o tecido entre o corpo e o banco (sem ele o banco espreme o pano para dentro do corpo).
  return { top: bottom - SEAT_CLEARANCE, ...box, hip: hipL!.y };
}

/** Colisor do banco (caixa do chão até o alto). */
export function seatCollider(seat: Seat): Collider {
  return {
    query(x, y, z) {
      const dx = Math.max(seat.minX - x, x - seat.maxX);
      const dy = Math.max(-y, y - seat.top);
      const dz = Math.max(seat.minZ - z, z - seat.maxZ);
      const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
      const distance = outside > 0 ? outside : Math.max(dx, dy, dz);
      // Para fora pelo lado mais perto (por cima, quase sempre).
      let normal: Vec3;
      if (outside > 0) normal = { x: Math.max(dx, 0) * Math.sign(x - (seat.minX + seat.maxX) / 2) / outside, y: Math.max(dy, 0) * (y > seat.top ? 1 : -1) / outside, z: Math.max(dz, 0) * Math.sign(z - (seat.minZ + seat.maxZ) / 2) / outside };
      else if (dy >= dx && dy >= dz) normal = { x: 0, y: y > seat.top / 2 ? 1 : -1, z: 0 };
      else if (dx >= dz) normal = { x: x > 0 ? 1 : -1, y: 0, z: 0 };
      else normal = { x: 0, y: 0, z: z > (seat.minZ + seat.maxZ) / 2 ? 1 : -1 };
      return { distance, normal };
    },
  };
}

/** O quadril já chegou ao banco (o banco entra na simulação daí em diante, até levantar). */
export function onSeat(body: Body, seat: Seat): boolean {
  return body.landmarks.legs.left[0]!.y <= seat.hip + 25;
}

/** Quanto o corpo desce em pé (mm), para o movimento no lugar manter o tronco nessa altura. */
export function standingShift(table: Record<string, number>, overrides: BodyOverrides = {}, conditions: BodyConditions = {}): number {
  return buildMannequin(table, "em-pe", overrides, conditions, { mesh: false }).shift;
}

/** Opções de montagem do corpo do clipe: no lugar, a altura de em pé. */
export function clipBodyOptions(clip: MotionClip, table: Record<string, number>, overrides: BodyOverrides = {}, conditions: BodyConditions = {}): { shift?: number } {
  return clip.inPlace ? { shift: standingShift(table, overrides, conditions) } : {};
}

/** Um osso do corpo na pose: de `a` a `b` (mm). O tronco é um osso do meio do quadril ao meio dos ombros. */
export type Bone = { a: Vec3; b: Vec3 };

/** Os ossos do corpo, sempre na mesma ordem (tronco, braços e pernas com a ponta), para comparar duas poses. */
export function bodyBones(body: Body): Bone[] {
  const l = body.landmarks;
  const mid = (p: Vec3, q: Vec3): Vec3 => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: (p.z + q.z) / 2 });
  const pelvis = mid(l.legs.left[0]!, l.legs.right[0]!);
  const shoulders = mid(l.shoulderPoints.left, l.shoulderPoints.right);
  // A cabeça segue o tronco: o osso passa do ombro (o pescoço e a cabeça andam junto).
  const head = { x: shoulders.x + (shoulders.x - pelvis.x) * 0.45, y: shoulders.y + (shoulders.y - pelvis.y) * 0.45, z: shoulders.z + (shoulders.z - pelvis.z) * 0.45 };
  const bones: Bone[] = [{ a: pelvis, b: head }];
  for (const chain of [l.arms.left, l.arms.right, l.legs.left, l.legs.right]) {
    const [j0, j1, j2] = chain;
    if (!j0 || !j1 || !j2) continue;
    const tip = { x: j2.x + (j2.x - j1.x) * 0.5, y: j2.y + (j2.y - j1.y) * 0.5, z: j2.z + (j2.z - j1.z) * 0.5 };
    bones.push({ a: j0, b: j1 }, { a: j1, b: j2 }, { a: j2, b: tip });
  }
  return bones;
}

/**
 * Quanto a superfície anda perto de (x, y, z) entre duas poses: o andar do
 * ponto mais perto no osso mais perto (a pele acompanha o osso). `steps`
 * divide o andar (por subpasso). Ossos em número diferente: parado.
 */
export function boneStep(before: readonly Bone[], after: readonly Bone[], steps: number): (x: number, y: number, z: number) => Vec3 {
  const zero = { x: 0, y: 0, z: 0 };
  if (before.length !== after.length || before.length === 0) return () => zero;
  const k = 1 / Math.max(1, steps);
  return (x, y, z) => {
    let best = Infinity;
    let at = 0;
    let s = 0;
    after.forEach((bone, i) => {
      const dx = bone.b.x - bone.a.x;
      const dy = bone.b.y - bone.a.y;
      const dz = bone.b.z - bone.a.z;
      const len2 = dx * dx + dy * dy + dz * dz;
      const t = len2 > 0 ? Math.min(1, Math.max(0, ((x - bone.a.x) * dx + (y - bone.a.y) * dy + (z - bone.a.z) * dz) / len2)) : 0;
      const d = Math.hypot(x - bone.a.x - dx * t, y - bone.a.y - dy * t, z - bone.a.z - dz * t);
      if (d < best) {
        best = d;
        at = i;
        s = t;
      }
    });
    const p = before[at]!;
    const q = after[at]!;
    // Ponto do osso na mesma fração, antes e depois.
    return {
      x: (q.a.x + (q.b.x - q.a.x) * s - (p.a.x + (p.b.x - p.a.x) * s)) * k,
      y: (q.a.y + (q.b.y - q.a.y) * s - (p.a.y + (p.b.y - p.a.y) * s)) * k,
      z: (q.a.z + (q.b.z - q.a.z) * s - (p.a.z + (p.b.z - p.a.z) * s)) * k,
    };
  };
}
