import { describe, expect, it } from "vitest";
import { MOTION_FPS, MOTION_OPTIONS, frameAt, frameOf, motionName, motionProgressText, packFrames } from "./motion";

describe("movimento na Prova", () => {
  it("os 7 movimentos com nome", () => {
    expect(MOTION_OPTIONS.map((m) => m.id)).toEqual(["andar", "correr", "dancar", "acenar", "sentar", "agachar", "deitar"]);
    expect(motionName("dancar")).toBe("Dançar");
  });

  it("junta e separa os quadros sem trocar a ordem", () => {
    const packed = packFrames([new Float32Array([1, 2, 3]), new Float32Array([4, 5, 6])]);
    expect(Array.from(frameOf(packed, 2, 1))).toEqual([4, 5, 6]);
    expect(Array.from(frameOf(packed, 2, 9))).toEqual([4, 5, 6]);
    expect(() => packFrames([new Float32Array(3), new Float32Array(2)])).toThrow(/mesmo tamanho/);
    expect(packFrames([]).length).toBe(0);
  });

  it("toca em volta, na velocidade dos quadros", () => {
    expect(frameAt(0, MOTION_FPS, 100)).toBe(0);
    expect(frameAt(1000, MOTION_FPS, 100)).toBe(30);
    expect(frameAt(4000, MOTION_FPS, 100)).toBe(20);
    expect(frameAt(500, MOTION_FPS, 1)).toBe(0);
  });

  it("texto do preparo em porcentagem", () => {
    expect(motionProgressText(40, 100)).toBe("Preparando o movimento… 40%");
    expect(motionProgressText(5, 0)).toBe("Preparando o movimento… 0%");
  });
});
