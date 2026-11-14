import { markerBits, MARKER_MODULES } from "./aruco";
import { moduleSize, type MarkerSheet } from "./sheet";

/**
 * O que imprimir na folha de marcadores, em mm (Y para baixo): quadrados
 * pretos dos marcadores (borda e módulos pretos, juntos por linha para
 * caber em poucos retângulos) e o quadrado de conferência da escala.
 */
export type SheetRect = { x: number; y: number; w: number; h: number };

export function sheetDrawing(sheet: MarkerSheet): { black: SheetRect[]; check: SheetRect } {
  const black: SheetRect[] = [];
  for (const m of sheet.markers) {
    const mod = moduleSize(m);
    const bits = markerBits(m.id);
    for (let row = 0; row < MARKER_MODULES; row++) {
      let start = -1;
      for (let col = 0; col <= MARKER_MODULES; col++) {
        const inner = row >= 1 && col >= 1 && row <= MARKER_MODULES - 2 && col <= MARKER_MODULES - 2;
        const isBlack = col < MARKER_MODULES && !(inner && bits[row - 1]![col - 1]);
        if (isBlack && start < 0) start = col;
        if (!isBlack && start >= 0) {
          black.push({ x: m.x + start * mod, y: m.y + row * mod, w: (col - start) * mod, h: mod });
          start = -1;
        }
      }
    }
  }
  const c = sheet.check;
  return { black, check: { x: c.x, y: c.y, w: c.size, h: c.size } };
}
