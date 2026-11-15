/// <reference lib="webworker" />
import { scanPhoto, type Rectified } from "@alinhavo/scan";
import type { ScanPreview, ScanReply, ScanRequest } from "./protocol";

/**
 * Worker do Scan: a foto inteira é processada fora da tela (marcadores,
 * perspectiva, papel, contorno) e volta a parte em mm e uma prévia da foto
 * endireitada. Nada vai para o servidor.
 */

const scope = self as unknown as DedicatedWorkerGlobalScope;
const PREVIEW_SIDE = 1100;

function preview(r: Rectified): ScanPreview {
  const k = Math.max(1, Math.ceil(Math.max(r.width, r.height) / PREVIEW_SIDE));
  const width = Math.floor(r.width / k);
  const height = Math.floor(r.height / k);
  const gray = new Uint8Array(width * height);
  for (let j = 0; j < height; j++)
    for (let i = 0; i < width; i++) {
      const v = r.data[j * k * r.width + i * k]!;
      gray[j * width + i] = Number.isNaN(v) ? 0 : Math.max(0, Math.min(255, Math.round(v)));
    }
  return { width, height, gray, originX: r.originX, originY: r.originY, mmPerPx: r.step * k };
}

scope.onmessage = (e: MessageEvent<ScanRequest>) => {
  const req = e.data;
  if (req.type !== "scan") return;
  try {
    const r = scanPhoto({ width: req.width, height: req.height, data: new Uint8ClampedArray(req.data) });
    const reply: ScanReply = r.ok
      ? {
          type: "done",
          id: req.id,
          piece: r.piece,
          piques: r.piques.length,
          corners: r.corners.length,
          offsetMm: r.offsetMm,
          outlineMm: r.outlineMm,
          markerErrorMm: r.markerErrorMm,
          warnings: r.warnings,
          preview: preview(r.rectified),
        }
      : { type: "failed", id: req.id, error: r.error };
    scope.postMessage(reply);
  } catch {
    scope.postMessage({ type: "failed", id: req.id, error: "Não foi possível ler a foto. Tente outra." } satisfies ScanReply);
  }
};
