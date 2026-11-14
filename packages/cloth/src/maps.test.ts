import { describe, expect, it } from "vitest";
import type { Piece } from "@alinhavo/geometry";
import { sphereCollider } from "./collider";
import { FABRICS } from "./fabrics";
import { summarizeMaps, vertexClearance, vertexStretch } from "./maps";
import { meshPiece } from "./mesh";
import { createSimulation } from "./simulation";

function square(): Piece {
  return {
    id: "p",
    name: "p",
    start: "A",
    points: { A: { x: 0, y: 0 }, B: { x: 100, y: 0 }, C: { x: 100, y: 100 }, D: { x: 0, y: 100 } },
    outline: ["B", "C", "D", "A"].map((to) => ({ kind: "line" as const, to })),
    seamAllowance: 0,
  };
}

describe("vertexStretch", () => {
  it("média dos triângulos em volta de cada vértice", () => {
    // Dois triângulos: 0-1-2 com 10% e 1-3-2 com 0%.
    const triangles = Uint32Array.from([0, 1, 2, 1, 3, 2]);
    const s = vertexStretch(triangles, Float64Array.from([0.1, 0]), 5);
    expect(Array.from(s)).toEqual([0.1, 0.05, 0.05, 0, 0]); // o vértice 4 não está em triângulo: 0
  });

  it("tecido parado e sem tensão dá pressão zero", () => {
    const sim = createSimulation([{ mesh: meshPiece(square(), { spacing: 20 }) }], {
      fabric: FABRICS.malha,
      gravity: { x: 0, y: 0, z: 0 },
    });
    sim.step();
    const s = vertexStretch(sim.triangles, sim.triangleStretch(), sim.vertexCount);
    expect(Math.max(...s.map(Math.abs))).toBeLessThan(1e-9);
  });
});

describe("vertexClearance", () => {
  it("distância até a superfície menos a espessura, e encostado vale zero", () => {
    const ball = sphereCollider({ x: 0, y: 0, z: 0 }, 100);
    const positions = Float64Array.from([0, 150, 0, 101, 0, 0, 0, 0, 50]);
    expect(Array.from(vertexClearance(positions, [ball], 1))).toEqual([49, 0, 0]);
  });
});

describe("summarizeMaps", () => {
  it("maior esticamento, área perto do limite (pela área do molde) e faixa de folga", () => {
    const s = summarizeMaps(Float64Array.from([0.01, 0.045, 0.05]), Float64Array.from([2, 1, 1]), Float64Array.from([0, 12, 40]), 0.05);
    expect(s.maxStretch).toBe(0.05);
    // Acima de 80% do limite (4%): dois triângulos de área 1 em 4.
    expect(s.areaNearLimit).toBeCloseTo(0.5, 12);
    expect([s.minClearance, s.maxClearance]).toEqual([0, 40]);
  });

  it("highStretch ignora um pico pequeno: 98% da área abaixo dele", () => {
    // 99 triângulos de área 1 a 2% e um de área 1 a 30% (pico de costura).
    const stretch = Float64Array.from([...Array<number>(99).fill(0.02), 0.3]);
    const area = new Float64Array(100).fill(1);
    const s = summarizeMaps(stretch, area, Float64Array.from([5]), 0.05);
    expect(s.maxStretch).toBe(0.3);
    expect(s.highStretch).toBe(0.02);
    // Se o pico cobre mais de 2% da área, ele conta.
    const big = summarizeMaps(Float64Array.from([0.02, 0.3]), Float64Array.from([90, 10]), Float64Array.from([5]), 0.05);
    expect(big.highStretch).toBe(0.3);
  });
});
