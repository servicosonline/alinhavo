import { describe, expect, it } from "vitest";
import type { Piece } from "@alinhavo/geometry";
import type { Vec3 } from "../collider";
import { FABRICS } from "../fabrics";
import { meshPiece } from "../mesh";
import { createSimulation } from "../simulation";
import { buildMannequin, createMannequin } from "./mannequin";
import { readMeasurements } from "./measurements";
import { pchip, superellipsePerimeter } from "./shapes";

const TABELA_M = { busto: 920, cintura: 740, quadril: 1000, altura: 1680 };

/**
 * Circunferência medida como uma fita: em 720 direções, procura por
 * bisseção onde a distância do tronco troca de sinal, e soma o polígono.
 * Usa só o colisor, não as contas que construíram o corpo.
 */
function tape(sdf: (p: Vec3) => number, y: number, centerZ: number): number {
  const N = 720;
  let total = 0;
  let prev: { x: number; z: number } | null = null;
  for (let k = 0; k <= N; k++) {
    const th = (2 * Math.PI * k) / N;
    const c = Math.cos(th);
    const s = Math.sin(th);
    let lo = 0;
    let hi = 2000;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (sdf({ x: c * mid, y, z: centerZ + s * mid }) < 0) lo = mid;
      else hi = mid;
    }
    const p = { x: c * lo, z: centerZ + s * lo };
    if (prev) total += Math.hypot(p.x - prev.x, p.z - prev.z);
    prev = p;
  }
  return total;
}

function yRange(positions: Float32Array) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 1; i < positions.length; i += 3) {
    min = Math.min(min, positions[i]!);
    max = Math.max(max, positions[i]!);
  }
  return { min, max };
}

describe("readMeasurements", () => {
  it("usa a tabela, estima o que falta e avisa o que ignorou ou recusou", () => {
    const r = readMeasurements({ Busto: 920, cintura: 740, "altura do quadril": 200, manga: 600, quadril: 99999 });
    expect(r.values.busto).toBe(920);
    expect(r.values.cintura).toBe(740);
    expect(r.values.alturaDoQuadril).toBe(200);
    expect(r.ignored).toEqual(["manga"]);
    expect(r.rejected).toEqual(["quadril"]);
    expect(r.estimated).toContain("quadril");
    expect(r.estimated).toContain("altura");
    expect(r.estimated).not.toContain("busto");
    // Estimativas por proporção da altura padrão (1650 mm).
    expect(r.values.altura).toBe(1650);
    expect(r.values.quadril).toBeCloseTo(1650 * 0.58, 9);
  });

  it("aceita variações de nome", () => {
    const r = readMeasurements({ estatura: 1700, "tórax": 980, "pescoço": 360 });
    expect([r.values.altura, r.values.busto, r.values.pescoco]).toEqual([1700, 980, 360]);
    expect(r.ignored).toEqual([]);
  });
});

describe("formas", () => {
  it("perímetro da superelipse com expoente 2 é o da elipse (círculo: 2πr)", () => {
    expect(superellipsePerimeter(100, 100, 2)).toBeCloseTo(2 * Math.PI * 100, 1);
  });

  it("pchip passa pelos pontos e não ultrapassa os vizinhos", () => {
    const f = pchip([0, 10, 20, 30], [5, 8, 8, 2]);
    expect([f(0), f(10), f(20), f(30)]).toEqual([5, 8, 8, 2]);
    for (let x = 10; x <= 20; x += 0.5) expect(f(x)).toBeLessThanOrEqual(8 + 1e-12);
  });
});

describe("createMannequin", () => {
  it("busto, cintura e quadril medidos com fita batem com a tabela (±1 mm)", () => {
    for (const pose of ["em-pe", "passo"] as const) {
      const { body, torsoSdf } = buildMannequin(TABELA_M, pose);
      const L = body.landmarks;
      expect(tape(torsoSdf, L.bust.y, L.bust.centerZ)).toBeCloseTo(920, 0);
      expect(tape(torsoSdf, L.waist.y, L.waist.centerZ)).toBeCloseTo(740, 0);
      expect(tape(torsoSdf, L.hip.y, L.hip.centerZ)).toBeCloseTo(1000, 0);
      expect(body.fit.obtained.busto).toBeCloseTo(920, 6);
    }
  });

  it("em pé, os pés tocam o chão e o alto da cabeça fica na altura da tabela", () => {
    const body = createMannequin(TABELA_M);
    const { min, max } = yRange(body.mesh.positions);
    expect(min).toBeGreaterThan(-1);
    expect(min).toBeLessThan(2);
    expect(Math.abs(max - 1680)).toBeLessThan(2);
    expect(body.fit.obtained.altura).toBeCloseTo(max, 6);
  });

  it("na pose de passo uma perna vai à frente e a outra atrás, e o pé continua no chão", () => {
    const body = createMannequin(TABELA_M, "passo");
    expect(yRange(body.mesh.positions).min).toBeLessThan(2);
    // Pé esquerdo (+X) à frente: há pontos do lado esquerdo bem à frente do corpo, perto do chão.
    let frontLeft = -Infinity;
    let frontRight = -Infinity;
    const P = body.mesh.positions;
    for (let i = 0; i < P.length; i += 3) {
      if (P[i + 1]! > 150) continue;
      if (P[i]! > 0) frontLeft = Math.max(frontLeft, P[i + 2]!);
      else frontRight = Math.max(frontRight, P[i + 2]!);
    }
    expect(frontLeft - frontRight).toBeGreaterThan(100);
  });

  it("colisor: positivo fora, negativo dentro e direção apontando para fora", () => {
    const body = createMannequin(TABELA_M);
    const w = body.landmarks.waist;
    const q = (x: number, y: number, z: number) => body.collider.query(x, y, z);
    expect(q(0, w.y, w.centerZ).distance).toBeLessThan(-50);
    expect(q(0, w.y, 2000).distance).toBeGreaterThan(1000);
    const front = q(0, w.y, w.centerZ + w.halfDepth + 5);
    expect(front.distance).toBeCloseTo(5, 0);
    expect(front.normal.z).toBeGreaterThan(0.99);
    const side = q(w.halfWidth + 5, w.y, w.centerZ);
    expect(side.distance).toBeCloseTo(5, 0);
    expect(side.normal.x).toBeGreaterThan(0.99);
    expect(Math.hypot(side.normal.x, side.normal.y, side.normal.z)).toBeCloseTo(1, 9);
    // Acima da cabeça.
    expect(q(0, 1680 + 50, 0).distance).toBeCloseTo(50, -1);
  });

  it("um tamanho maior dá um corpo maior", () => {
    const m = buildMannequin(TABELA_M);
    const g = buildMannequin({ ...TABELA_M, busto: 980, cintura: 800, quadril: 1060 });
    expect(tape(g.torsoSdf, g.body.landmarks.bust.y, g.body.landmarks.bust.centerZ)).toBeGreaterThan(
      tape(m.torsoSdf, m.body.landmarks.bust.y, m.body.landmarks.bust.centerZ) + 50,
    );
    // Um ponto fixo 20 mm à frente da cintura do M fica mais perto do corpo maior.
    const w = m.body.landmarks.waist;
    const p = { x: 0, y: w.y, z: w.centerZ + w.halfDepth + 20 };
    expect(g.body.collider.query(p.x, p.y, p.z).distance).toBeLessThan(m.body.collider.query(p.x, p.y, p.z).distance);
  });

  it("malha válida: índices dentro do limite e sem NaN", () => {
    const body = createMannequin(TABELA_M, "passo");
    const count = body.mesh.positions.length / 3;
    expect(body.mesh.positions.every(Number.isFinite)).toBe(true);
    expect(body.mesh.indices.length % 3).toBe(0);
    expect(body.mesh.indices.every((i) => i < count)).toBe(true);
    expect(body.kind).toBe("manequim");
  });

  it("o tecido que cai sobre os ombros não atravessa o corpo", () => {
    const body = createMannequin(TABELA_M);
    const square: Piece = {
      id: "p",
      name: "p",
      start: "A",
      points: { A: { x: 0, y: 0 }, B: { x: 400, y: 0 }, C: { x: 400, y: 300 }, D: { x: 0, y: 300 } },
      outline: ["B", "C", "D", "A"].map((to) => ({ kind: "line" as const, to })),
      seamAllowance: 0,
    };
    const sim = createSimulation(
      [
        {
          mesh: meshPiece(square, { spacing: 20 }),
          placement: {
            origin: { x: -200, y: body.landmarks.shoulder.y + 60, z: -150 },
            xAxis: { x: 1, y: 0, z: 0 },
            yAxis: { x: 0, y: 0, z: 1 },
          },
        },
      ],
      { fabric: FABRICS.malha, colliders: [body.collider] },
    );
    for (let f = 0; f < 90; f++) sim.step();
    let closest = Infinity;
    let lowest = Infinity;
    for (let i = 0; i < sim.vertexCount; i++) {
      const [x, y, z] = [sim.positions[i * 3]!, sim.positions[i * 3 + 1]!, sim.positions[i * 3 + 2]!];
      closest = Math.min(closest, body.collider.query(x, y, z).distance);
      lowest = Math.min(lowest, y);
    }
    expect(closest).toBeGreaterThan(FABRICS.malha.thickness - 0.05);
    // E ficou pendurado no corpo, não caiu até o chão.
    expect(lowest).toBeGreaterThan(body.landmarks.waist.y);
  });

  it("a mesma tabela dá sempre o mesmo corpo", () => {
    const a = createMannequin(TABELA_M, "passo");
    const b = createMannequin(TABELA_M, "passo");
    expect(Array.from(a.mesh.positions)).toEqual(Array.from(b.mesh.positions));
  });
});
