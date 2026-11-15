import type { Decal, MapSummary } from "@alinhavo/cloth";
import type { PatternDocument } from "@alinhavo/geometry";
import type { ProvaEdges } from "./edges";
import type { LookExtra } from "./look";

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
  /** Camada do molde em prova no look (0, padrão, é a de dentro). */
  layer?: number;
  /** Outras roupas do look, cada uma com o seu tecido e a sua camada. */
  extras?: LookExtra[];
};

/** Uma roupa na Prova: os vértices dela (início e quantidade, na numeração da simulação) e o tecido. */
export type ProvaPart = {
  name: string;
  /** O molde em prova (o que se ajusta); as outras são do look. */
  main: boolean;
  start: number;
  count: number;
  fabric: FabricId;
  /** Esticamento máximo do tecido desta roupa (fração), o vermelho do mapa de pressão. */
  fabricLimit: number;
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
  /** Esticamento máximo do tecido do molde em prova (fração), o vermelho do mapa de pressão. */
  fabricLimit: number;
  /** As roupas, na ordem da simulação: o molde em prova primeiro, depois as do look. */
  parts: ProvaPart[];
  /** Avisos do look (ex.: roupa sem o tamanho, que vestiu o base dela). */
  lookNotes: string[];
  /** Acabamentos (pesponto, zíper, etiqueta, estampa) presos à malha da roupa. */
  decals: Decal[];
  /** Bordas do molde em prova ligadas aos segmentos do molde (para clicar e ajustar). */
  edges: ProvaEdges;
};

/** Mapas por vértice e resumo para a leitura em texto. */
export type ProvaMaps = {
  /** Esticamento por vértice (fração: 0,05 = 5%). */
  stretch: Float32Array;
  /** Folga até o corpo por vértice, em mm. */
  clearance: Float32Array;
  /** Resumo só do molde em prova (o look entra nas cores, não no texto). */
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
