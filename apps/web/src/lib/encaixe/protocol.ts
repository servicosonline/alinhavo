import type { PatternDocument } from "@alinhavo/geometry";
import type { NestResult, PatternNestPiece, SizeDemand } from "@alinhavo/nesting";

/** Mensagens entre a tela do Encaixe e o Worker. Só dados serializáveis. */

export type NestRequest = {
  type: "run";
  /** Número do pedido: respostas de um pedido antigo são ignoradas. */
  id: number;
  doc: PatternDocument;
  demand: SizeDemand;
  widthMm: number;
  gapMm: number;
  oneWay: boolean;
};

export type FromNestWorker =
  | { type: "progress"; id: number; done: number; total: number }
  | { type: "done"; id: number; pieces: PatternNestPiece[]; result: NestResult }
  | { type: "error"; id: number; message: string };
