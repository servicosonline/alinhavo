/// <reference lib="webworker" />
import { nest, patternNestPieces } from "@alinhavo/nesting";
import type { FromNestWorker, NestRequest } from "./protocol";

/**
 * Worker do Encaixe: monta as peças da demanda e roda o motor fora da tela,
 * avisando o progresso a cada peça. O cálculo fica no navegador do usuário,
 * nunca no servidor.
 */

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (msg: FromNestWorker) => scope.postMessage(msg);

scope.onmessage = (e: MessageEvent<NestRequest>) => {
  const req = e.data;
  if (req.type !== "run") return;
  try {
    const pieces = patternNestPieces(req.doc, req.demand);
    const result = nest(pieces, {
      widthMm: req.widthMm,
      gapMm: req.gapMm,
      oneWay: req.oneWay,
      onProgress: (done, total) => post({ type: "progress", id: req.id, done, total }),
    });
    post({ type: "done", id: req.id, pieces, result });
  } catch (err) {
    post({ type: "error", id: req.id, message: err instanceof Error ? err.message : "Erro no encaixe." });
  }
};
