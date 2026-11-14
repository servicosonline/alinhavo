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

export type BodyPose = "em-pe" | "passo";

/** Malha para desenhar: x, y, z por vértice e três índices por triângulo. */
export type BodyMesh = { positions: Float32Array; indices: Uint32Array };

/** Seção do tronco numa altura: meia largura (X), meia profundidade (Z) e centro em Z. */
export type TorsoSection = { y: number; halfWidth: number; halfDepth: number; centerZ: number };

/** Pontos de referência para posicionar as partes da roupa (Passo 4). */
export type BodyLandmarks = {
  crotch: TorsoSection;
  hip: TorsoSection;
  waist: TorsoSection;
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
  pose: BodyPose;
  mesh: BodyMesh;
  collider: Collider;
  fit: BodyFit;
  landmarks: BodyLandmarks;
};
