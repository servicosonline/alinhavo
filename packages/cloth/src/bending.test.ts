import { describe, expect, it } from "vitest";
import type { Piece } from "@alinhavo/geometry";
import { cantileverDrop } from "./calibration/bench";
import { bendingRigidity, FABRICS, type Fabric } from "./fabrics";
import { meshPiece, type PieceMesh } from "./mesh";
import { collectCurvatureStencils, createSimulation } from "./simulation";

/** Flexão de curvatura: a que segura tecido plano e não depende da malha. */

function rect(w: number, h: number): Piece {
  return {
    id: "folha",
    name: "folha",
    start: "A",
    points: { A: { x: 0, y: 0 }, B: { x: w, y: 0 }, C: { x: w, y: h }, D: { x: 0, y: h } },
    outline: ["B", "C", "D", "A"].map((to) => ({ kind: "line" as const, to })),
    seamAllowance: 0,
    grainline: { from: { x: 0, y: 0 }, to: { x: 0, y: 100 } },
  };
}

/** Energia de flexão com B = 1: Σ ½·|Σ Kᵢxᵢ|² ÷ (A1 + A2). */
function energy(mesh: PieceMesh, xyz: Float64Array): number {
  const idx: number[] = [];
  const k: number[] = [];
  const areas: number[] = [];
  collectCurvatureStencils(mesh, 0, idx, k, areas);
  let e = 0;
  for (let s = 0; s < areas.length; s++) {
    let sx = 0;
    let sy = 0;
    let sz = 0;
    for (let m = 0; m < 4; m++) {
      const i = idx[s * 4 + m]!;
      sx += k[s * 4 + m]! * xyz[i * 3]!;
      sy += k[s * 4 + m]! * xyz[i * 3 + 1]!;
      sz += k[s * 4 + m]! * xyz[i * 3 + 2]!;
    }
    e += (0.5 * (sx * sx + sy * sy + sz * sz)) / areas[s]!;
  }
  return e;
}

/** A folha no plano z = 0 ou enrolada num cilindro de raio r (eixo em y). */
function shape(mesh: PieceMesh, r?: number): Float64Array {
  const n = mesh.positions.length / 2;
  const out = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = mesh.positions[i * 2]!;
    const v = mesh.positions[i * 2 + 1]!;
    out[i * 3] = r === undefined ? u : r * Math.sin(u / r);
    out[i * 3 + 1] = v;
    out[i * 3 + 2] = r === undefined ? 0 : r * (1 - Math.cos(u / r));
  }
  return out;
}

const SIDE = 300;

describe("energia da flexão de curvatura", () => {
  it("é zero com o tecido plano (o repouso)", () => {
    const mesh = meshPiece(rect(SIDE, SIDE), { spacing: 30 });
    expect(energy(mesh, shape(mesh))).toBeLessThan(1e-12);
  });

  it("num cilindro dá a da placa contínua (B/2 ÷ R² por área), na malha da Prova e numa mais fina", () => {
    const radius = 100;
    const continuous = (0.5 * SIDE * SIDE) / radius ** 2;
    for (const spacing of [30, 15]) {
      const mesh = meshPiece(rect(SIDE, SIDE), { spacing });
      const ratio = energy(mesh, shape(mesh, radius)) / continuous;
      // Abaixo de 1: as arestas da borda não têm vizinho e ficam de fora.
      expect(ratio, `malha de ${spacing} mm`).toBeGreaterThan(0.8);
      expect(ratio, `malha de ${spacing} mm`).toBeLessThan(1.1);
    }
  });

  it("não muda ao girar ou deslocar a folha", () => {
    const mesh = meshPiece(rect(SIDE, SIDE), { spacing: 30 });
    const bent = shape(mesh, 120);
    const moved = new Float64Array(bent.length);
    const [c, s] = [Math.cos(0.7), Math.sin(0.7)];
    for (let i = 0; i < bent.length; i += 3) {
      moved[i] = c * bent[i]! - s * bent[i + 2]! + 40;
      moved[i + 1] = bent[i + 1]! - 25;
      moved[i + 2] = s * bent[i]! + c * bent[i + 2]! + 10;
    }
    expect(energy(mesh, moved)).toBeCloseTo(energy(mesh, bent), 6);
  });
});

describe("rigidez pelo comprimento de flexão (Peirce)", () => {
  it("B = peso por área × c³", () => {
    const fabric: Fabric = { ...FABRICS.malha, density: 200, bendingLength: 20 };
    expect(bendingRigidity(fabric)).toBeCloseTo(200e-6 * 9810 * 8000, 6);
  });
});

const OVERHANG = 150;
const withLength = (c: number): Fabric => ({ ...FABRICS.malha, bendingLength: c });

/** Comprimento de flexão pela fórmula de Peirce, do ângulo da corda da ponta. */
function peirce(dropMm: number, reachMm: number): number {
  const theta = Math.atan2(dropMm, reachMm);
  return OVERHANG * Math.cbrt(Math.cos(theta / 2) / (8 * Math.tan(theta)));
}

describe("régua na borda da mesa com a flexão de curvatura", () => {
  it("a tira plana se segura, e o comprimento de flexão volta pela fórmula de Peirce", () => {
    // Peirce: com 150 mm para fora, c = 75 dá 41,5° (o ponto da norma) e c = 100 uns 22°.
    for (const c of [75, 100]) {
      const r = cantileverDrop(withLength(c), OVERHANG);
      expect(r.settled).toBe(true);
      const back = peirce(r.dropMm, r.reachMm);
      expect(back / c, `c = ${c} mm → ${back.toFixed(1)} mm`).toBeGreaterThan(0.85);
      expect(back / c, `c = ${c} mm → ${back.toFixed(1)} mm`).toBeLessThan(1.15);
    }
  });

  it("tecido mais firme cai menos", () => {
    const soft = cantileverDrop(withLength(20), OVERHANG).dropMm;
    const firm = cantileverDrop(withLength(60), OVERHANG).dropMm;
    expect(firm).toBeLessThan(soft - 20);
  });

  it("cai igual na malha da Prova e numa malha com metade do espaçamento", () => {
    const coarse = cantileverDrop(withLength(50), OVERHANG, { spacing: 30 });
    const fine = cantileverDrop(withLength(50), OVERHANG, { spacing: 15 });
    expect(Math.abs(coarse.dropMm - fine.dropMm)).toBeLessThan(0.15 * fine.dropMm);
  });
});

describe("simulação com a flexão de curvatura", () => {
  it("um pano plano sem gravidade fica parado", () => {
    const mesh = meshPiece(rect(200, 200), { spacing: 30 });
    const sim = createSimulation([{ mesh }], { fabric: withLength(30), gravity: { x: 0, y: 0, z: 0 } });
    const start = Float64Array.from(sim.positions);
    for (let f = 0; f < 60; f++) sim.step();
    let moved = 0;
    for (let i = 0; i < start.length; i++) moved = Math.max(moved, Math.abs(sim.positions[i]! - start[i]!));
    expect(moved).toBeLessThan(1e-6);
  });
});
