import { emptyDocument, type PatternDocument, type Piece } from "@alinhavo/geometry";

/**
 * Regras da tela do Scan: as peças escaneadas viram um molde novo (grade
 * P/M/G sem gradação, como o molde vazio), lado a lado, com a margem
 * escolhida. Medidas em mm.
 */

export const MAX_SCANNED_PIECES = 30;
/** Espaço entre as peças no molde, mm. */
const GAP = 50;
/** Maior lado da foto que vai para o Worker (fotos de 12 MP ficam lentas e não ganham precisão). */
export const MAX_PHOTO_SIDE = 2400;
/** Margem de costura aceita, mm. */
export const MAX_SEAM_MM = 50;

export type ScannedPiece = { name: string; piece: Piece };

export function scannedDocument(items: readonly ScannedPiece[], seamAllowanceMm: number): PatternDocument {
  const doc = emptyDocument();
  let x = 0;
  const seam = Math.max(0, Math.min(MAX_SEAM_MM, seamAllowanceMm));
  doc.pieces = items.map((item, k) => {
    const xs = Object.values(item.piece.points).map((p) => p.x);
    const width = Math.max(...xs) - Math.min(...xs);
    const ox = x - Math.min(...xs);
    x += width + GAP + 2 * seam;
    const points = Object.fromEntries(Object.entries(item.piece.points).map(([id, p]) => [id, { x: p.x + ox, y: p.y }]));
    const outline = item.piece.outline.map((s) => (s.kind === "cubic" ? { ...s, c1: { x: s.c1.x + ox, y: s.c1.y }, c2: { x: s.c2.x + ox, y: s.c2.y } } : s));
    return { ...item.piece, id: `scan-${k + 1}`, name: item.name.trim() || `Peça ${k + 1}`, points, outline, seamAllowance: seam };
  });
  return doc;
}

/** Tamanho da foto para o Worker, sem passar de MAX_PHOTO_SIDE e sem aumentar. */
export function photoSize(width: number, height: number): { width: number; height: number } {
  const k = Math.min(1, MAX_PHOTO_SIDE / Math.max(width, height));
  return { width: Math.round(width * k), height: Math.round(height * k) };
}
