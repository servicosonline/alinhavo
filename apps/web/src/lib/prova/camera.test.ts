import { describe, expect, it } from "vitest";
import { clampLook, LOOK_MAX_Y, LOOK_MIN_Y } from "./camera";

describe("câmera da Prova", () => {
  it("mover para cima e para baixo fica; o lado volta ao eixo e a câmera anda junto", () => {
    const target = { x: 0.3, y: 1.4, z: -0.1 };
    const camera = { x: 1.2, y: 1.7, z: 3 };
    expect(clampLook(target, camera, { x: 0, z: 0 })).toBe(true);
    expect(target).toEqual({ x: 0, y: 1.4, z: 0 });
    expect(camera.x).toBeCloseTo(0.9, 9);
    expect(camera.y).toBeCloseTo(1.7, 9);
    expect(camera.z).toBeCloseTo(3.1, 9);
  });

  it("a altura do olhar fica entre o chão e acima da cabeça", () => {
    const low = { x: 0, y: -1, z: 0 };
    const cam = { x: 0, y: 0, z: 3 };
    clampLook(low, cam, { x: 0, z: 0 });
    expect(low.y).toBe(LOOK_MIN_Y);
    expect(cam.y).toBeCloseTo(1.05, 9);
    const high = { x: 0, y: 9, z: 0 };
    clampLook(high, { x: 0, y: 9, z: 3 }, null);
    expect(high.y).toBe(LOOK_MAX_Y);
  });

  it("sem trava de lado (grade inteira), só a altura é presa; dentro dos limites nada muda", () => {
    const t = { x: 2, y: 1, z: 0.5 };
    expect(clampLook(t, { x: 2, y: 1, z: 3 }, null)).toBe(false);
    expect(t).toEqual({ x: 2, y: 1, z: 0.5 });
  });
});
