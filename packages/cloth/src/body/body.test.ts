import { describe, expect, it } from "vitest";
import type { Piece } from "@alinhavo/geometry";
import { MAX_OVERESTIMATE, TRUSTED_CLEARANCE_MM, type Vec3 } from "../collider";
import { FABRIC_MAX_THICKNESS, FABRICS } from "../fabrics";
import { meshPiece } from "../mesh";
import { createSimulation } from "../simulation";
import { BELLY_RANGE, buildMannequin, createMannequin, cutChain, HEEL_RANGE, LIMB_WHOLE } from "./mannequin";
import { BODY_POSES } from "./types";
import { MEASUREMENT_KEYS, MEASUREMENT_RANGE, readMeasurements } from "./measurements";
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

describe("ajustes da tela (overrides)", () => {
  it("valem por cima da tabela, contam como dados e puxam as estimativas", () => {
    const r = readMeasurements({ quadril: 1000, altura: 1680 }, { quadril: 1100, coxa: 640 });
    expect(r.values.quadril).toBe(1100);
    expect(r.values.coxa).toBe(640);
    expect(r.estimated).not.toContain("coxa");
    // O joelho estimado acompanha o quadril ajustado, não o da tabela.
    expect(r.values.joelho).toBeCloseTo(1100 * 0.38, 9);
  });

  it("fora do plausível são recusados pelo nome do campo e a tabela continua valendo", () => {
    const r = readMeasurements({ busto: 920 }, { busto: 99999, punho: Number.NaN });
    expect(r.values.busto).toBe(920);
    expect(r.rejected).toEqual(["busto", "punho"]);
  });

  it("a lista da tela tem todos os campos, uma vez cada", () => {
    expect([...MEASUREMENT_KEYS].sort()).toEqual(Object.keys(MEASUREMENT_RANGE).sort());
  });

  it("o corpo aceita os extremos de cada medida e continua de pé, com a altura pedida", () => {
    for (const key of MEASUREMENT_KEYS) {
      for (const value of MEASUREMENT_RANGE[key]) {
        const body = createMannequin(TABELA_M, "em-pe", { [key]: value });
        const { min, max } = yRange(body.mesh.positions);
        expect(Number.isFinite(min) && Number.isFinite(max), `${key} = ${value}`).toBe(true);
        expect(min, `${key} = ${value}`).toBeGreaterThan(-1);
        expect(max, `${key} = ${value}`).toBeGreaterThan(min);
        if (key === "altura") expect(Math.abs(max - value), `altura = ${value}`).toBeLessThan(2);
      }
    }
  });

  it("braço mais grosso e perna mais comprida mudam o corpo", () => {
    const base = createMannequin(TABELA_M);
    const longLegs = createMannequin(TABELA_M, "em-pe", { entrepernas: 900 });
    expect(longLegs.landmarks.crotch.y).toBeGreaterThan(base.landmarks.crotch.y + 100);
    const thick = createMannequin(TABELA_M, "em-pe", { coxa: 700 });
    expect(thick.landmarks.legs.left[0]!.r).toBeGreaterThan(base.landmarks.legs.left[0]!.r + 10);
  });
});

describe("condições do corpo", () => {
  const mid = (a: Vec3, b: Vec3, t = 0.5): Vec3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });

  it("cortar a corrente: inteiro, sem nada e no meio de uma peça", () => {
    const chain = buildMannequin(TABELA_M).chains.leftArm;
    expect(cutChain(chain, LIMB_WHOLE)).toEqual(chain);
    expect(cutChain(chain, 0)).toEqual([]);
    const half = cutChain(chain, 1.5);
    expect(half).toHaveLength(2);
    expect(half[1]!.b).toEqual(mid(chain[1]!.a, chain[1]!.b));
    expect(half[1]!.r2).toBeCloseTo((chain[1]!.r1 + chain[1]!.r2) / 2, 9);
    expect(cutChain(chain, 99)).toEqual(chain);
    expect(cutChain(chain, Number.NaN)).toEqual(chain);
  });

  it("braço cortado abaixo do cotovelo: o coto fica, o punho some, o outro braço não muda", () => {
    const full = buildMannequin(TABELA_M);
    const cut = buildMannequin(TABELA_M, "em-pe", {}, { limbs: { leftArm: 1.5 } });
    const fore = full.chains.leftArm[1]!;
    const q = (b: typeof cut, p: Vec3) => b.body.collider.query(p.x, p.y, p.z).distance;
    expect(q(cut, mid(fore.a, fore.b, 0.25))).toBeLessThan(0); // ainda dentro do coto
    expect(q(cut, fore.b)).toBeGreaterThan(30); // o punho não existe mais
    expect(q(full, fore.b)).toBeLessThan(0);
    const right = full.chains.rightArm[1]!;
    expect(q(cut, mid(right.a, right.b))).toBeCloseTo(q(full, mid(right.a, right.b)), 6);
    expect(cut.body.mesh.positions.length).toBeLessThan(full.body.mesh.positions.length);
  });

  it("sem a perna esquerda: o corpo continua em pé, na mesma altura, sobre a outra", () => {
    const full = createMannequin(TABELA_M);
    const cut = buildMannequin(TABELA_M, "em-pe", {}, { limbs: { leftLeg: 0 } });
    const r = yRange(cut.body.mesh.positions);
    expect(r.min).toBeLessThan(2);
    expect(Math.abs(r.max - yRange(full.mesh.positions).max)).toBeLessThan(1);
    const knee = cut.chains.leftLeg[0]!.b;
    expect(cut.body.collider.query(knee.x, knee.y, knee.z).distance).toBeGreaterThan(30);
    // O eixo da perna continua nos pontos de referência (a calça ainda sabe onde a perna estaria).
    expect(cut.body.landmarks.legs.left).toHaveLength(3);
  });

  it("gestante: a barriga mede o pedido, as costas não saem do lugar e busto e quadril seguem a tabela", () => {
    const plain = buildMannequin(TABELA_M);
    const preg = buildMannequin(TABELA_M, "em-pe", {}, { belly: 1150 });
    const B = preg.body.landmarks.belly!;
    expect(B).toBeDefined();
    expect(plain.body.landmarks.belly).toBeUndefined();
    expect(tape(preg.torsoSdf, B.y, B.centerZ)).toBeCloseTo(1150, -1);
    const L = preg.body.landmarks;
    expect(tape(preg.torsoSdf, L.hip.y, L.hip.centerZ)).toBeCloseTo(1000, 0);
    expect(tape(preg.torsoSdf, L.bust.y, L.bust.centerZ)).toBeCloseTo(920, 0);
    // Na altura da barriga: a frente avança muito, as costas ficam (±3 mm).
    const along = (b: typeof preg, dir: 1 | -1) => {
      let lo = 0;
      let hi = 1500;
      for (let i = 0; i < 60; i++) {
        const m = (lo + hi) / 2;
        if (b.torsoSdf({ x: 0, y: B.y, z: dir * m }) < 0) lo = m;
        else hi = m;
      }
      return lo;
    };
    expect(along(preg, 1) - along(plain, 1)).toBeGreaterThan(80);
    expect(Math.abs(along(preg, -1) - along(plain, -1))).toBeLessThan(3);
  });

  it("barriga menor que a volta natural não muda o corpo; acima do limite fica no limite", () => {
    const plain = createMannequin(TABELA_M);
    const small = createMannequin(TABELA_M, "em-pe", {}, { belly: 600 });
    expect(small.mesh.positions).toEqual(plain.mesh.positions);
    const huge = buildMannequin(TABELA_M, "em-pe", {}, { belly: 99999 });
    const B = huge.body.landmarks.belly!;
    expect(tape(huge.torsoSdf, B.y, B.centerZ)).toBeLessThan(BELLY_RANGE[1] + 20);
  });

  it("gestante e sem membros ainda cumprem a altura e o colisor continua coerente", () => {
    const b = createMannequin(TABELA_M, "passo", {}, { belly: 1200, limbs: { rightArm: 0, rightLeg: 1.2, leftArm: 2 } });
    const w = b.landmarks.waist;
    expect(b.collider.query(0, w.y, w.centerZ).distance).toBeLessThan(-50);
    expect(b.collider.query(0, w.y, 3000).distance).toBeGreaterThan(1000);
    expect(yRange(b.mesh.positions).min).toBeLessThan(2);
  });
});

describe("poses e salto", () => {
  it("em toda pose os pés tocam o chão e a cabeça fica na altura", () => {
    for (const pose of BODY_POSES) {
      const r = yRange(createMannequin(TABELA_M, pose).mesh.positions);
      expect(r.min, pose).toBeGreaterThan(-1);
      expect(r.min, pose).toBeLessThan(2);
      expect(r.max, pose).toBeGreaterThan(1600);
    }
  });

  it("braço dobrado: o punho fica à frente do cotovelo; braços abertos: a mão longe do corpo", () => {
    const bent = buildMannequin(TABELA_M, "braco-dobrado").chains.leftArm;
    expect(bent[1]!.b.z - bent[1]!.a.z).toBeGreaterThan(150);
    const open = buildMannequin(TABELA_M, "bracos-abertos").chains.leftArm;
    const down = buildMannequin(TABELA_M, "em-pe").chains.leftArm;
    expect(open[1]!.b.x).toBeGreaterThan(down[1]!.b.x + 250);
    expect(open[1]!.b.y).toBeGreaterThan(down[1]!.b.y + 300);
  });

  it("salto de 8 cm: o corpo sobe 8 cm, a ponta do pé e o salto tocam o chão", () => {
    const flat = createMannequin(TABELA_M);
    const heels = buildMannequin(TABELA_M, "em-pe", {}, { heel: 80 });
    const a = yRange(flat.mesh.positions);
    const b = yRange(heels.body.mesh.positions);
    expect(b.max - a.max).toBeCloseTo(80, 0);
    expect(b.min).toBeGreaterThan(-1);
    expect(b.min).toBeLessThan(2);
    expect(heels.body.landmarks.waist.y - flat.landmarks.waist.y).toBeCloseTo(80, 0);
    // O salto do sapato existe: logo acima do chão, embaixo do calcanhar, é corpo.
    const heelPt = heels.chains.leftLeg[2]!.a;
    expect(heels.body.collider.query(heelPt.x, 10, heelPt.z - 0.005 * 1680).distance).toBeLessThan(0);
    // E o calcanhar subiu: sem salto ele fica a ~3 cm do chão.
    const shift = b.max - a.max;
    expect(heels.body.collider.query(heelPt.x, 0.018 * 1680 + shift, heelPt.z).distance).toBeLessThan(0);
  });

  it("salto zero é o corpo de sempre; salto acima do limite fica no limite", () => {
    expect(createMannequin(TABELA_M, "em-pe", {}, { heel: 0 }).mesh.positions).toEqual(createMannequin(TABELA_M).mesh.positions);
    const max = yRange(createMannequin(TABELA_M, "em-pe", {}, { heel: 9999 }).mesh.positions).max;
    expect(max - 1680).toBeCloseTo(HEEL_RANGE[1], 0);
  });

  it("sem a perna esquerda e de salto: o salto fica só no pé que existe", () => {
    const b = buildMannequin(TABELA_M, "em-pe", {}, { heel: 80, limbs: { leftLeg: 1 } });
    const r = yRange(b.body.mesh.positions);
    expect(r.min).toBeLessThan(2);
    const leftHeel = b.chains.leftLeg[2]!.a;
    expect(b.body.collider.query(leftHeel.x, 10, leftHeel.z).distance).toBeGreaterThan(20);
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
    let worst = -1;
    for (let i = 0; i < sim.vertexCount; i++) {
      const [x, y, z] = [sim.positions[i * 3]!, sim.positions[i * 3 + 1]!, sim.positions[i * 3 + 2]!];
      const d = body.collider.query(x, y, z).distance;
      if (d < closest) {
        closest = d;
        worst = i;
      }
      lowest = Math.min(lowest, y);
    }
    // Na falha, onde e com que corpo: somas das posições do corpo e da roupa
    // (o mesmo número em toda máquina que calcula igual) e o vértice mais perto.
    const sum = (a: ArrayLike<number>) => Array.from(a).reduce((s, v) => s + v, 0);
    const at = [0, 1, 2].map((c) => sim.positions[worst * 3 + c]!.toFixed(2)).join(", ");
    const trace =
      `corpo Σ=${sum(body.mesh.positions).toFixed(6)}, ombro y=${body.landmarks.shoulder.y.toFixed(6)}, ` +
      `malha ${sim.vertexCount} vértices, roupa Σ=${sum(sim.positions).toFixed(6)}, vértice ${worst} em (${at})`;
    expect(closest, trace).toBeGreaterThan(FABRICS.malha.thickness - 0.05);
    // E ficou pendurado no corpo, não caiu até o chão.
    expect(lowest).toBeGreaterThan(body.landmarks.waist.y);
    // Simulação de 1,5 s: uns 2 s sozinho, mais com o check inteiro rodando junto (o padrão é 5 s).
  }, 30_000);

  it("a mesma tabela dá sempre o mesmo corpo", () => {
    const a = createMannequin(TABELA_M, "passo");
    const b = createMannequin(TABELA_M, "passo");
    expect(Array.from(a.mesh.positions)).toEqual(Array.from(b.mesh.positions));
  });

  it("perto da pele a distância cumpre o contrato do Collider (o simulador pula perguntas com ela)", () => {
    // Até a espessura do tecido mais grosso + TRUSTED_CLEARANCE_MM, a distância
    // não cai mais que MAX_OVERESTIMATE × o que o ponto anda: é o que garante
    // que a folga do simulador (safeClearance) nunca passa da real.
    const band = Math.max(FABRIC_MAX_THICKNESS, ...Object.values(FABRICS).map((f) => f.thickness)) + TRUSTED_CLEARANCE_MM;
    const h = 0.5;
    const steps = [
      [h, 0, 0], [-h, 0, 0], [0, h, 0], [0, -h, 0], [0, 0, h], [0, 0, -h],
    ] as const;
    for (const pose of ["em-pe", "passo"] as const) {
      const body = createMannequin(TABELA_M, pose);
      const P = body.mesh.positions;
      let worst = 0;
      let where = "";
      let checked = 0;
      // Pontos que saem da pele pela normal do colisor, a cada 0,5 mm até a faixa.
      for (let v = 0; v < P.length / 3; v += 5) {
        const s = { x: P[v * 3]!, y: P[v * 3 + 1]!, z: P[v * 3 + 2]! };
        const n = body.collider.query(s.x, s.y, s.z).normal;
        for (let t = 0.5; t <= band; t += 0.5) {
          const p = { x: s.x + n.x * t, y: s.y + n.y * t, z: s.z + n.z * t };
          const d = body.collider.query(p.x, p.y, p.z).distance;
          if (d <= 0 || d > band) continue;
          checked++;
          for (const [ex, ey, ez] of steps) {
            const rate = (d - body.collider.query(p.x + ex, p.y + ey, p.z + ez).distance) / h;
            if (rate > worst) {
              worst = rate;
              where = `${pose} (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}) d=${d.toFixed(2)}`;
            }
          }
        }
      }
      expect(checked).toBeGreaterThan(1000);
      expect(worst, where).toBeLessThanOrEqual(MAX_OVERESTIMATE);
    }
  }, 60_000);
});
