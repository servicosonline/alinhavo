import type { Collider } from "../collider";
import type { MeasurementReading } from "./measurements";

/**
 * Contrato comum dos corpos da Prova. O manequim procedural e, depois, o
 * corpo realista (MakeHuman, CC0) entregam a mesma coisa: o simulador e a
 * tela não sabem qual estão usando.
 *
 * Coordenadas em mm, Y para cima, chão em y = 0, frente do corpo em +Z,
 * lado esquerdo do corpo em +X.
 */
export type BodyKind = "manequim" | "makehuman";

export type BodyPose = "em-pe" | "passo" | "sentada" | "braco-dobrado" | "bracos-abertos";
export const BODY_POSES: readonly BodyPose[] = ["em-pe", "passo", "sentada", "braco-dobrado", "bracos-abertos"];

/** Malha para desenhar: x, y, z por vértice e três índices por triângulo. */
export type BodyMesh = { positions: Float32Array; indices: Uint32Array };

/** Seção do tronco numa altura: meia largura (X), meia profundidade (Z) e centro em Z. */
export type TorsoSection = { y: number; halfWidth: number; halfDepth: number; centerZ: number };

/** Pontos de referência para posicionar as partes da roupa (Passo 4). */
export type BodyLandmarks = {
  crotch: TorsoSection;
  hip: TorsoSection;
  waist: TorsoSection;
  /** Ponto mais saliente da barriga (só no corpo de gestante). */
  belly?: TorsoSection;
  bust: TorsoSection;
  shoulder: TorsoSection;
  neck: TorsoSection;
  /** Ponta dos ombros (esquerda +X, direita −X). */
  shoulderPoints: { left: Vec; right: Vec };
  /**
   * Eixo de cada perna, de cima para baixo (articulação do quadril, joelho,
   * tornozelo), com o raio nesse ponto: é onde a calça se enrola abaixo do gancho.
   */
  legs: { left: LegSample[]; right: LegSample[] };
  /**
   * Eixo de cada braço, de cima para baixo (articulação do ombro, cotovelo,
   * punho), com o raio nesse ponto: é onde a manga se enrola. Esquerdo = +X.
   */
  arms: { left: LegSample[]; right: LegSample[] };
  /** Alto da cabeça (mm), quando o corpo sabe (o corpo realista); o movimento usa para achar o ponto mais baixo ao deitar. */
  headTop?: number;
};

/** Um ponto do eixo da perna e o raio dela ali, em mm. */
export type LegSample = Vec & { r: number };

type Vec = { x: number; y: number; z: number };

/** Medida pedida × medida obtida no corpo, em mm. */
export type BodyFit = {
  reading: MeasurementReading;
  obtained: { busto: number; cintura: number; quadril: number; altura: number };
};

export type Body = {
  kind: BodyKind;
  /** A pose com nome, ou "movimento" quando o corpo foi montado por ângulos. */
  pose: BodyPose | "movimento";
  mesh: BodyMesh;
  collider: Collider;
  fit: BodyFit;
  landmarks: BodyLandmarks;
  /**
   * Pontos da superfície (centro e raio), já na pose: o movimento acha por eles
   * o ponto mais baixo depois de girar o corpo (deitar). Sem eles, saem das
   * seções e das articulações (o manequim).
   */
  support?: readonly { p: Vec; r: number }[];
};
