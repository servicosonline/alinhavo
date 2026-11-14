import { describe, expect, it } from "vitest";
import { detectMarkers } from "./aruco";
import { A4_SHEET, sheetMarkerCorners } from "./sheet";
import { sheetDrawing } from "./sheet-drawing";

describe("folha de marcadores", () => {
  it("o que vai para a impressão é lido pelo detector, cada marcador no seu lugar", () => {
    const { black, check } = sheetDrawing(A4_SHEET);
    const k = 4; // px por mm
    const W = A4_SHEET.widthMm * k;
    const H = A4_SHEET.heightMm * k;
    const data = new Uint8ClampedArray(W * H * 4).fill(255);
    for (const r of black)
      for (let y = Math.round(r.y * k); y < Math.round((r.y + r.h) * k); y++)
        for (let x = Math.round(r.x * k); x < Math.round((r.x + r.w) * k); x++) {
          const i = (y * W + x) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
    const found = detectMarkers({ width: W, height: H, data });
    expect(found.map((m) => m.id).sort()).toEqual([0, 1, 2, 3]);
    for (const m of found) {
      const expected = sheetMarkerCorners(A4_SHEET.markers.find((s) => s.id === m.id)!);
      m.corners.forEach((c, i) => {
        expect(Math.abs(c.x / k - expected[i]!.x)).toBeLessThan(1);
        expect(Math.abs(c.y / k - expected[i]!.y)).toBeLessThan(1);
      });
    }
    // Quadrado de conferência de 50 mm, longe dos marcadores.
    expect(check).toEqual({ x: 80, y: 123.5, w: 50, h: 50 });
  });
});
