import type { BodyConditions, BodyOverrides } from "./body/mannequin";
import {
  bodyBones,
  boneStep,
  clipBodyOptions,
  motionDuration,
  motionPose,
  motionSeat,
  onSeat,
  posedMotion,
  probeMoved,
  seatCollider,
  type Bone,
  type MotionClip,
  type Seat,
} from "./body/motion";
import type { BodyMesh } from "./body/types";
import type { Collider, Vec3 } from "./collider";
import type { Simulation } from "./simulation";

/**
 * O movimento simulado, quadro a quadro ("preparar e tocar"): a simulação
 * roda mais devagar que o tempo real, então o movimento é calculado antes e
 * guardado; depois toca liso. A roupa já assentada em pé entra parada, e o
 * corpo começa a se mexer.
 *
 * A cada `colliderEvery` subpassos o corpo vai para a pose daquele instante
 * (só o colisor, sem a malha) e a simulação desconta da folga guardada o
 * quanto ele andou. A malha do corpo é montada só nos quadros guardados.
 */
export type MotionFrame = {
  /** Tempo no movimento, em s. */
  t: number;
  /** x, y, z da roupa (mm), como `Simulation.positions`. */
  positions: Float32Array;
  /** O corpo nessa pose, para desenhar. */
  body: BodyMesh;
  /** O banco já está em uso (o quadril chegou nele). */
  seated: boolean;
};

export type MotionRunOptions = {
  clip: MotionClip;
  /** Medidas (nome → mm), ajustes e condições: as mesmas do corpo em que a roupa assentou. */
  table: Record<string, number>;
  overrides?: BodyOverrides;
  conditions?: BodyConditions;
  /** Outros obstáculos que ficam (o chão). */
  fixed?: readonly Collider[];
  /** Quadros guardados por segundo. Padrão: 30. */
  fps?: number;
  /** De quantos em quantos subpassos o corpo muda de pose. Padrão: 4. */
  colliderEvery?: number;
};

export type MotionRun = {
  readonly clip: MotionClip;
  /** Quantos quadros o movimento guarda (do 0 ao fim, inclusive). */
  readonly frameCount: number;
  /** O banco do "sentar" (para desenhar), ou null. */
  readonly seat: Seat | null;
  /** Calcula o próximo quadro; null quando acabou. */
  next(): MotionFrame | null;
};

export function createMotionRun(sim: Simulation, options: MotionRunOptions): MotionRun {
  const { clip, table } = options;
  const overrides = options.overrides ?? {};
  const conditions = options.conditions ?? {};
  const fixed = options.fixed ?? [];
  const fps = Math.max(1, options.fps ?? 30);
  const every = Math.max(1, Math.round(options.colliderEvery ?? 4));
  const duration = motionDuration(clip);
  const frameCount = Math.ceil(duration * fps) + 1;
  const seat = motionSeat(clip, table, overrides, conditions);
  const seatBox = seat ? seatCollider(seat) : null;
  const start = sim.time;
  // Clipe rápido: passos de simulação menores (o dobro de subpassos por quadro).
  const maxDt = clip.fast ? 1 / 120 : 1 / 60;
  const bodyOptions = clipBodyOptions(clip, table, overrides, conditions);

  const first = posedMotion(table, motionPose(clip, 0), overrides, conditions, { ...bodyOptions, mesh: false });
  let probe: Vec3[] = first.probe;
  let bones: Bone[] = bodyBones(first.body);
  let seated = false;
  let substeps = 0;
  let frame = 0;

  const onSubstep = (time: number) => {
    if (substeps++ % every !== 0) return;
    const now = posedMotion(table, motionPose(clip, time - start), overrides, conditions, { ...bodyOptions, mesh: false });
    const moved = probeMoved(probe, now.probe);
    probe = now.probe;
    // A pele anda com os ossos, espalhada pelos subpassos até a próxima troca.
    const nextBones = bodyBones(now.body);
    const step = boneStep(bones, nextBones, every);
    bones = nextBones;
    const moving: Collider = { query: (x, y, z) => now.body.collider.query(x, y, z), surfaceStep: step };
    if (seat) seated = onSeat(now.body, seat);
    sim.setColliders(seated && seatBox ? [moving, ...fixed, seatBox] : [moving, ...fixed], moved);
  };

  return {
    clip,
    frameCount,
    seat,
    next() {
      if (frame >= frameCount) return null;
      const t = Math.min(duration, frame / fps);
      while (sim.time - start < t - 1e-9) sim.step(Math.min(maxDt, t - (sim.time - start)), onSubstep);
      const body = posedMotion(table, motionPose(clip, t), overrides, conditions, bodyOptions).body;
      frame++;
      return { t, positions: Float32Array.from(sim.positions), body: body.mesh, seated };
    },
  };
}
