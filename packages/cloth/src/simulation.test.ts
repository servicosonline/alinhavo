import { describe, expect, it } from "vitest";
import type { Piece, Seam } from "@alinhavo/geometry";
import { floorCollider, sphereCollider } from "./collider";
import { FABRICS, stretchCompliance, type Fabric } from "./fabrics";
import { meshPiece, type PieceMesh } from "./mesh";
import { createSimulation, type Placement, type Simulation } from "./simulation";

const VERTICAL = { from: { x: 0, y: 0 }, to: { x: 0, y: 100 } };
const HORIZONTAL = { from: { x: 0, y: 0 }, to: { x: 100, y: 0 } };

/** Retângulo w × h (mm); segmentos 0 topo, 1 direita, 2 base, 3 esquerda. */
function rect(id: string, w: number, h: number, grainline = VERTICAL): Piece {
  return {
    id,
    name: id,
    start: "A",
    points: { A: { x: 0, y: 0 }, B: { x: w, y: 0 }, C: { x: w, y: h }, D: { x: 0, y: h } },
    outline: ["B", "C", "D", "A"].map((to) => ({ kind: "line" as const, to })),
    seamAllowance: 0,
    grainline,
  };
}

const mesh = (piece: Piece) => meshPiece(piece, { spacing: 20 });
const NO_GRAVITY = { x: 0, y: 0, z: 0 };

const at = (sim: Simulation, i: number) => ({
  x: sim.positions[i * 3]!,
  y: sim.positions[i * 3 + 1]!,
  z: sim.positions[i * 3 + 2]!,
});
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

function run(sim: Simulation, seconds: number) {
  for (let f = 0; f < Math.round(seconds * 60); f++) sim.step();
}

/** Pendura o retângulo pela borda de cima e deixa assentar. */
function hang(fabric: Fabric, grainline = VERTICAL) {
  const m = mesh(rect("p", 300, 300, grainline));
  const sim = createSimulation([{ mesh: m }], { fabric });
  for (let i = 0; i < m.boundaryCount; i++) if (m.positions[i * 2 + 1] === 0) sim.pin(i);
  run(sim, 3);
  return sim;
}

const maxOf = (a: Float64Array) => a.reduce((m, x) => Math.max(m, x), -Infinity);

/** Índice do vértice da borda na posição (u, v) do molde. */
function corner(m: PieceMesh, u: number, v: number): number {
  for (let i = 0; i < m.boundaryCount; i++) {
    if (m.positions[i * 2] === u && m.positions[i * 2 + 1] === v) return i;
  }
  throw new Error(`sem vértice em ${u},${v}`);
}

describe("stretchCompliance", () => {
  it("urdume a 0°, viés a 45°, trama a 90°", () => {
    const f = FABRICS.malha;
    expect(stretchCompliance(f, 10, 0)).toBe(f.stretch.warp);
    expect(stretchCompliance(f, -10, 0)).toBe(f.stretch.warp);
    expect(stretchCompliance(f, 10, 10)).toBeCloseTo(f.stretch.bias, 15);
    expect(stretchCompliance(f, 0, -10)).toBeCloseTo(f.stretch.weft, 15);
  });

  it("presets: jeans é o mais firme, malha a mais elástica, e trama e viés cedem mais que o urdume", () => {
    for (const dir of ["warp", "weft", "bias"] as const) {
      expect(FABRICS.jeans.stretch[dir]).toBeLessThan(FABRICS.planoLeve.stretch[dir]);
      expect(FABRICS.planoLeve.stretch[dir]).toBeLessThan(FABRICS.malha.stretch[dir]);
    }
    for (const f of Object.values(FABRICS)) {
      expect(f.stretch.weft).toBeGreaterThan(f.stretch.warp);
      expect(f.stretch.bias).toBeGreaterThan(f.stretch.warp);
    }
  });
});

describe("createSimulation", () => {
  it("queda livre sem amortecimento: ½·g·t²", () => {
    const sim = createSimulation([{ mesh: mesh(rect("p", 100, 100)) }], { fabric: FABRICS.jeans, damping: 0 });
    run(sim, 0.5);
    expect(at(sim, 0).y).toBeCloseTo(-0.5 * 9810 * 0.25, -1); // ±5 mm em 1226 mm
    expect(at(sim, 0).x).toBeCloseTo(0, 9);
  });

  it("queda livre com amortecimento c = 1/s segue a fórmula com arrasto linear", () => {
    const sim = createSimulation([{ mesh: mesh(rect("p", 100, 100)) }], { fabric: FABRICS.jeans, damping: 1 });
    run(sim, 0.5);
    const t = 0.5;
    const expected = -9810 * (t - (1 - Math.exp(-t)));
    expect(Math.abs(at(sim, 0).y - expected) / Math.abs(expected)).toBeLessThan(0.01);
  });

  it("sem gravidade, o tecido parado fica parado", () => {
    const sim = createSimulation([{ mesh: mesh(rect("p", 200, 200)) }], { fabric: FABRICS.malha, gravity: NO_GRAVITY });
    const before = Float64Array.from(sim.positions);
    run(sim, 1);
    expect(sim.positions.every((p, i) => Math.abs(p - before[i]!) < 1e-9)).toBe(true);
  });

  it("vértice preso não sai do lugar", () => {
    const m = mesh(rect("p", 200, 200));
    const sim = createSimulation([{ mesh: m }], { fabric: FABRICS.malha });
    sim.pin(0);
    const p = at(sim, 0);
    run(sim, 1);
    expect(at(sim, 0)).toEqual(p);
    expect(() => sim.pin(sim.vertexCount)).toThrow(/não existe/);
  });

  it("pendurado pela borda: assenta, sem NaN e esticando pouco", () => {
    for (const [fabric, limit] of [
      [FABRICS.jeans, 0.02],
      [FABRICS.planoLeve, 0.02],
      [FABRICS.malha, 0.05],
    ] as const) {
      const sim = hang(fabric);
      expect(sim.positions.every(Number.isFinite)).toBe(true);
      expect(maxOf(sim.triangleStretch())).toBeLessThan(limit);
      const before = Float64Array.from(sim.positions);
      sim.step();
      const moved = maxOf(sim.positions.map((p, i) => Math.abs(p - before[i]!)));
      expect(moved).toBeLessThan(0.1); // parado: menos de 0,1 mm por quadro
    }
    // Simula três tecidos: uns 2 s sozinho, mais com o check inteiro rodando junto (o padrão é 5 s).
  }, 30_000);

  it("malha estica mais que jeans, e mais na trama que no urdume", () => {
    const malhaUrdume = maxOf(hang(FABRICS.malha, VERTICAL).triangleStretch());
    const malhaTrama = maxOf(hang(FABRICS.malha, HORIZONTAL).triangleStretch());
    const jeansUrdume = maxOf(hang(FABRICS.jeans, VERTICAL).triangleStretch());
    expect(malhaUrdume).toBeGreaterThan(jeansUrdume * 1.5);
    expect(malhaTrama).toBeGreaterThan(malhaUrdume * 1.5);
  });

  describe("costura", () => {
    const right = (x: number): Placement => ({
      origin: { x, y: 0, z: 0 },
      xAxis: { x: 1, y: 0, z: 0 },
      yAxis: { x: 0, y: -1, z: 0 },
    });

    function sewn(direction: Seam["direction"]) {
      const a = mesh(rect("a", 100, 200));
      const b = mesh(rect("b", 100, 200));
      // Lateral direita de A (segmento 1, de cima para baixo) com a esquerda de B (3, de baixo para cima).
      const seam: Seam = { id: "s", a: { piece: "a", segment: 1 }, b: { piece: "b", segment: 3 }, direction };
      const sim = createSimulation([{ mesh: a }, { mesh: b, placement: right(120) }], {
        fabric: FABRICS.planoLeve,
        gravity: NO_GRAVITY,
        seams: [seam],
      });
      return { sim, a, b };
    }

    it("fecha o vão entre as duas partes", () => {
      const { sim } = sewn("opposite");
      expect(sim.seamGap()).toBeCloseTo(20, 6);
      run(sim, 1);
      expect(sim.seamGap()).toBeLessThan(0.5);
      expect(sim.positions.every(Number.isFinite)).toBe(true);
    });

    it("no sentido oposto, alto encontra alto; no mesmo sentido, o lado de B chega invertido", () => {
      {
        const { sim, a, b } = sewn("opposite");
        run(sim, 1);
        const offB = sim.pieceOffset.get("b")!;
        expect(dist(at(sim, corner(a, 100, 0)), at(sim, offB + corner(b, 0, 0)))).toBeLessThan(1);
        expect(dist(at(sim, corner(a, 100, 200)), at(sim, offB + corner(b, 0, 200)))).toBeLessThan(1);
      }
      {
        const { sim, a, b } = sewn("same");
        run(sim, 1);
        const offB = sim.pieceOffset.get("b")!;
        // "same": o início do lado de A (alto) vai no início do lado de B (embaixo).
        expect(dist(at(sim, corner(a, 100, 0)), at(sim, offB + corner(b, 0, 200)))).toBeLessThan(1);
      }
    });

    it("recusa costura com parte fora da simulação e parte repetida", () => {
      const a = mesh(rect("a", 100, 100));
      const seam: Seam = { id: "s", a: { piece: "a", segment: 1 }, b: { piece: "manga", segment: 0 }, direction: "opposite" };
      expect(() => createSimulation([{ mesh: a }], { fabric: FABRICS.jeans, seams: [seam] })).toThrow(/manga/);
      expect(() => createSimulation([{ mesh: a }, { mesh: a }], { fabric: FABRICS.jeans })).toThrow(/duas vezes/);
    });
  });

  describe("colisão", () => {
    it("o tecido que cai sobre a esfera não a atravessa", () => {
      const m = mesh(rect("p", 400, 400));
      const flat: Placement = { origin: { x: -200, y: 150, z: -200 }, xAxis: { x: 1, y: 0, z: 0 }, yAxis: { x: 0, y: 0, z: 1 } };
      const sim = createSimulation([{ mesh: m, placement: flat }], {
        fabric: FABRICS.malha,
        colliders: [sphereCollider({ x: 0, y: 0, z: 0 }, 100)],
      });
      run(sim, 2);
      let closest = Infinity;
      for (let i = 0; i < sim.vertexCount; i++) closest = Math.min(closest, dist(at(sim, i), { x: 0, y: 0, z: 0 }) - 100);
      expect(closest).toBeGreaterThan(FABRICS.malha.thickness - 0.01);
      // E de fato ficou apoiado: o centro do tecido repousa em cima da esfera.
      expect(closest).toBeLessThan(FABRICS.malha.thickness + 1);
    });

    it("pousa no chão na altura da espessura", () => {
      const m = mesh(rect("p", 200, 200));
      const flat: Placement = { origin: { x: 0, y: 50, z: 0 }, xAxis: { x: 1, y: 0, z: 0 }, yAxis: { x: 0, y: 0, z: 1 } };
      const sim = createSimulation([{ mesh: m, placement: flat }], { fabric: FABRICS.jeans, colliders: [floorCollider(0)] });
      run(sim, 1);
      for (let i = 0; i < sim.vertexCount; i++) expect(at(sim, i).y).toBeCloseTo(FABRICS.jeans.thickness, 3);
    });
  });

  it("a mesma entrada dá sempre o mesmo resultado", () => {
    const make = () => {
      const sim = hang(FABRICS.malha);
      return Array.from(sim.positions);
    };
    expect(make()).toEqual(make());
  });
});
