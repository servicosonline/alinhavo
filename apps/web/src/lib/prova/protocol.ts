import type { PatternDocument } from "@alinhavo/geometry";

/**
 * Mensagens entre a tela da Prova e o Worker que simula. Só dados
 * serializáveis; posições vão em Float32Array transferido (sem cópia).
 */

export type FabricId = "malha" | "planoLeve" | "jeans";
export type PoseId = "em-pe" | "passo";

export type ProvaSetup = {
  doc: PatternDocument;
  size: string;
  /** Medidas da tabela para o tamanho (nome → mm). */
  measurements: Record<string, number>;
  fabric: FabricId;
  pose: PoseId;
};

export type ToWorker =
  | { type: "init"; setup: ProvaSetup }
  | { type: "play" }
  | { type: "pause" };

export type ReadyMessage = {
  type: "ready";
  body: { positions: Float32Array; indices: Uint32Array };
  garment: { positions: Float32Array; indices: Uint32Array };
  /** Partes que ficaram de fora (sem posição na Prova). */
  skipped: string[];
  /** Medidas que o corpo estimou (não vieram da tabela). */
  estimated: string[];
};

export type FrameMessage = {
  type: "frame";
  positions: Float32Array;
  /** Tempo simulado, em s. */
  time: number;
  /** Maior vão ainda aberto nas costuras, em mm. */
  seamGap: number;
};

export type FromWorker = ReadyMessage | FrameMessage | { type: "error"; message: string };

/** Parâmetros da simulação da Prova (ver testes de place.test.ts no cloth). */
export const PROVA_MESH_SPACING = 30;
export const PROVA_ITERATIONS = 2;
