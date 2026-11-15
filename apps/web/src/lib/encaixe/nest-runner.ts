import type { NestResult, PatternNestPiece } from "@alinhavo/nesting";
import type { FromNestWorker, NestRequest } from "./protocol";

/**
 * Roda encaixes no Worker (só no navegador), um por vez, um Worker por
 * encaixe. `cancel` mata o Worker na hora (o motor não tem pausa) e recusa
 * a promessa com `NestCancelled`; um `run` novo cancela o anterior.
 */
export type NestRunner = {
  run(req: Omit<NestRequest, "type" | "id">, onProgress?: (done: number, total: number) => void): Promise<{ pieces: PatternNestPiece[]; result: NestResult }>;
  cancel(): void;
  dispose(): void;
};

export class NestCancelled extends Error {
  constructor() {
    super("Encaixe cancelado.");
  }
}

export function createNestRunner(): NestRunner {
  let worker: Worker | null = null;
  let seq = 0;
  let pending: { id: number; reject: (e: Error) => void } | null = null;

  const kill = () => {
    worker?.terminate();
    worker = null;
    pending?.reject(new NestCancelled());
    pending = null;
  };

  return {
    run(req, onProgress) {
      kill();
      const w = new Worker(new URL("./nesting.worker.ts", import.meta.url), { type: "module" });
      worker = w;
      const id = ++seq;
      return new Promise((resolve, reject) => {
        pending = { id, reject };
        // Um Worker por encaixe: terminou, solta a memória.
        const settle = () => {
          if (pending?.id === id) pending = null;
          if (worker === w) worker = null;
          w.terminate();
        };
        w.onmessage = (e: MessageEvent<FromNestWorker>) => {
          const msg = e.data;
          if (msg.id !== id) return;
          if (msg.type === "progress") onProgress?.(msg.done, msg.total);
          else if (msg.type === "error") {
            settle();
            reject(new Error(msg.message));
          } else {
            settle();
            resolve({ pieces: msg.pieces, result: msg.result });
          }
        };
        w.onerror = () => {
          settle();
          reject(new Error("O encaixe parou com um erro. Tente de novo."));
        };
        w.postMessage({ type: "run", id, ...req } satisfies NestRequest);
      });
    },
    cancel: kill,
    dispose: kill,
  };
}
