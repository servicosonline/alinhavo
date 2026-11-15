import { describe, expect, it } from "vitest";
import { clampCrop, sourceRect, ZOOM_MAX } from "./avatar-crop";

describe("recorte da foto de perfil", () => {
  it("sem zoom nem deslocamento: o quadrado central do lado menor", () => {
    expect(sourceRect({ zoom: 1, x: 0, y: 0 }, 1200, 800, 300)).toEqual({ sx: 200, sy: 0, size: 800 });
  });

  it("zoom 2 pega metade do lado menor, no centro", () => {
    expect(sourceRect({ zoom: 2, x: 0, y: 0 }, 1000, 1000, 250)).toEqual({ sx: 250, sy: 250, size: 500 });
  });

  it("nunca deixa borda vazia: o deslocamento para na beira da foto", () => {
    const c = clampCrop({ zoom: 1, x: 999, y: 999 }, 1200, 800, 300);
    expect(c.y).toBe(0); // no lado menor não sobra nada para mover
    expect(c.x).toBeCloseTo((1200 * (300 / 800) - 300) / 2);
    const r = sourceRect(c, 1200, 800, 300);
    expect(r.sx).toBeCloseTo(0);
    expect(r.sx + r.size).toBeLessThanOrEqual(1200);
  });

  it("zoom fica entre 1 e o máximo; valor inválido volta ao normal", () => {
    expect(clampCrop({ zoom: 0.2, x: 0, y: 0 }, 100, 100, 100).zoom).toBe(1);
    expect(clampCrop({ zoom: 99, x: 0, y: 0 }, 100, 100, 100).zoom).toBe(ZOOM_MAX);
    expect(clampCrop({ zoom: Number.NaN, x: Number.NaN, y: 0 }, 100, 100, 100)).toEqual({ zoom: 1, x: 0, y: 0 });
  });

  it("o recorte fica sempre dentro da foto (vários casos)", () => {
    for (const [w, h] of [[640, 480], [480, 640], [3000, 1000]] as const)
      for (const zoom of [1, 1.7, 3.2])
        for (const x of [-500, 0, 500])
          for (const y of [-500, 0, 500]) {
            const r = sourceRect({ zoom, x, y }, w, h, 280);
            expect(r.sx).toBeGreaterThanOrEqual(-1e-6);
            expect(r.sy).toBeGreaterThanOrEqual(-1e-6);
            expect(r.sx + r.size).toBeLessThanOrEqual(w + 1e-6);
            expect(r.sy + r.size).toBeLessThanOrEqual(h + 1e-6);
          }
  });
});
