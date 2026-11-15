import type { Piece, Point } from "@alinhavo/geometry";

/** Mensagens entre a tela do Scan e o Worker. A foto vai como buffer transferido (sem cópia). */

export type ScanRequest = { type: "scan"; id: number; width: number; height: number; data: ArrayBuffer };

/** Prévia da foto endireitada: cinza, reduzida para a tela, com a escala em mm. */
export type ScanPreview = { width: number; height: number; gray: Uint8Array; originX: number; originY: number; mmPerPx: number };

export type ScanReply =
  | {
      type: "done";
      id: number;
      piece: Piece;
      piques: number;
      corners: number;
      offsetMm: Point;
      outlineMm: Point[];
      markerErrorMm: number;
      warnings: string[];
      preview: ScanPreview;
    }
  | { type: "failed"; id: number; error: string };
