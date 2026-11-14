import type { MapSummary } from "@alinhavo/cloth";
import type { PatternDocument } from "@alinhavo/geometry";
import type { ProvaEdges } from "./edges";

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
  /** Esticamento máximo do tecido (fração), o vermelho do mapa de pressão. */
  fabricLimit: number;
  /** Bordas da roupa ligadas aos segmentos do molde (para clicar e ajustar). */
  edges: ProvaEdges;
};

/** Mapas por vértice e resumo para a leitura em texto. */
export type ProvaMaps = {
  /** Esticamento por vértice (fração: 0,05 = 5%). */
  stretch: Float32Array;
  /** Folga até o corpo por vértice, em mm. */
  clearance: Float32Array;
  summary: MapSummary;
};

export type FrameMessage = {
  type: "frame";
  positions: Float32Array;
  /** Tempo simulado, em s. */
  time: number;
  /** Maior vão ainda aberto nas costuras, em mm. */
  seamGap: number;
  /** A cada MAPS_EVERY quadros (calcular a folga custa mais que o quadro). */
  maps?: ProvaMaps;
};

/** De quantos em quantos quadros os mapas são recalculados. */
export const MAPS_EVERY = 6;

export type FromWorker = ReadyMessage | FrameMessage | { type: "error"; message: string };

/** Parâmetros da simulação da Prova (ver testes de place.test.ts no cloth). */
export const PROVA_MESH_SPACING = 30;
export const PROVA_ITERATIONS = 2;
/** Fase de costura (s): a gravidade só entra com as costuras fechadas (ver garments.test.ts no cloth). */
export const PROVA_SEWING_TIME = 2;
