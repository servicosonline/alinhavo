import { describe, expect, it } from "vitest";
import { garmentAtSize, validatePattern, type PatternDocument } from "@alinhavo/geometry";
import { createMannequin } from "./body/mannequin";
import { floorCollider, sphereCollider } from "./collider";
import { FABRICS, type Fabric } from "./fabrics";
import { closestOnTriangle, outwardSigns } from "./layers";
import { meshPiece } from "./mesh";
import { pieceHalf, placeGarment } from "./place";
import { createSimulation } from "./simulation";
import { calca, saia } from "./test-garments";

const BODY = { busto: 880, cintura: 720, quadril: 900, altura: 1650 };

describe("closestOnTriangle", () => {
  const x = new Float64Array([0, 0, 0, 100, 0, 0, 0, 100, 0]);
  const q = new Float64Array(3);

  it("acima do miolo: o pé da perpendicular", () => {
    expect(closestOnTriangle(20, 30, 7, x, 0, 1, 2, q)).toBeCloseTo(49);
    expect([...q]).toEqual([20, 30, 0]);
  });
  it("fora: o vértice ou o ponto da aresta mais perto", () => {
    closestOnTriangle(-10, -10, 0, x, 0, 1, 2, q);
    expect([...q]).toEqual([0, 0, 0]);
    closestOnTriangle(50, -20, 0, x, 0, 1, 2, q);
    expect([...q]).toEqual([50, 0, 0]);
    closestOnTriangle(80, 80, 0, x, 0, 1, 2, q);
    expect(q[0]).toBeCloseTo(50);
    expect(q[1]).toBeCloseTo(50);
  });
  it("bate com a busca por amostras no triângulo", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 200 - 50;
    for (let k = 0; k < 50; k++) {
      const p = [rnd(), rnd(), rnd() / 4];
      const d2 = closestOnTriangle(p[0]!, p[1]!, p[2]!, x, 0, 1, 2, q);
      let best = Infinity;
      for (let u = 0; u <= 100; u += 1) for (let v = 0; u + v <= 100; v += 1) best = Math.min(best, (p[0]! - u) ** 2 + (p[1]! - v) ** 2 + p[2]! ** 2);
      expect(d2).toBeLessThanOrEqual(best + 1e-9);
      expect(d2).toBeGreaterThan(best - 1.5); // a amostra é de 1 mm
    }
  });
});

describe("outwardSigns", () => {
  it("diz para que lado fica o fora, pela ordem dos vértices", () => {
    // Triângulo tangente à esfera em (0, 0, 100): a normal (0, 0, +1) aponta para fora.
    const x = new Float64Array([0, 0, 100, 10, 0, 100, 0, 10, 100]);
    const ball = [sphereCollider({ x: 0, y: 0, z: 0 }, 90)];
    expect([...outwardSigns(x, [0, 1, 2], ball)]).toEqual([1]);
    expect([...outwardSigns(x, [0, 2, 1], ball)]).toEqual([-1]);
    expect([...outwardSigns(x, [0, 1, 2], [])]).toEqual([1]);
  });
});

type Wear = { doc: PatternDocument; layer?: number; fabric?: Fabric };

/** Veste as roupas no manequim e simula `seconds` s. */
function look(wear: Wear[], seconds: number) {
  const body = createMannequin(BODY);
  const parts = wear.flatMap(({ doc, layer, fabric }) => {
    const { pieces, seams } = garmentAtSize(doc, "M");
    return pieces.map((piece, k) => ({ piece, layer, fabric, seams: k === 0 ? seams : [] }));
  });
  // Malha de 40 mm (a Prova usa 30): a camada não depende da resolução, e o teste fica com metade do custo.
  const meshes = parts.map((p) => meshPiece(p.piece, { spacing: 40 }));
  const initial = placeGarment(
    meshes.map((mesh, i) => ({ mesh, placement: parts[i]!.piece.placement!, half: pieceHalf(parts[i]!.piece), layer: parts[i]!.layer })),
    body.landmarks,
  );
  const sim = createSimulation(
    meshes.map((mesh, i) => ({ mesh, initial: initial[i], layer: parts[i]!.layer, fabric: parts[i]!.fabric })),
    {
      fabric: FABRICS.planoLeve,
      seams: parts.flatMap((p) => p.seams),
      colliders: [body.collider, floorCollider(0)],
      iterations: 2,
      sewingTime: 2,
    },
  );
  // Posição inicial: o lado de fora de cada triângulo é medido nela, como na simulação.
  const start = Float64Array.from(sim.positions);
  const t0 = performance.now();
  const frames = Math.round(seconds * 60);
  for (let f = 0; f < frames; f++) sim.step();
  const msPerFrame = (performance.now() - t0) / frames;
  return { sim, body, meshes, msPerFrame, start };
}

/**
 * Quanto cada vértice das partes `outerIds` entrou na superfície das partes
 * `innerIds` (mm, positivo = dentro), pelo triângulo mais perto e o lado de
 * fora medido pelo corpo na posição inicial (no fim, entre as pernas, o corpo
 * mais perto pode ser a outra perna). Busca exaustiva: só para teste.
 */
function penetration(r: ReturnType<typeof look>, innerIds: string[], outerIds: string[]) {
  const { sim, body } = r;
  const tris: number[] = [];
  const triPiece = (v: number) => {
    let best = "";
    for (const [id, off] of sim.pieceOffset) if (off <= v && (best === "" || off > sim.pieceOffset.get(best)!)) best = id;
    return best;
  };
  for (let t = 0; t < sim.triangles.length; t += 3) {
    if (innerIds.includes(triPiece(sim.triangles[t]!))) tris.push(sim.triangles[t]!, sim.triangles[t + 1]!, sim.triangles[t + 2]!);
  }
  const signs = outwardSigns(r.start, tris, [body.collider]);
  const q = new Float64Array(3);
  const depths: number[] = [];
  for (let v = 0; v < sim.vertexCount; v++) {
    if (!outerIds.includes(triPiece(v))) continue;
    const [px, py, pz] = [sim.positions[v * 3]!, sim.positions[v * 3 + 1]!, sim.positions[v * 3 + 2]!];
    let best = Infinity;
    let side = 0;
    for (let t = 0; t < tris.length / 3; t++) {
      const a = tris[t * 3]!,
        b = tris[t * 3 + 1]!,
        c = tris[t * 3 + 2]!;
      const d2 = closestOnTriangle(px, py, pz, sim.positions, a, b, c, q);
      if (d2 >= best) continue;
      best = d2;
      const x = sim.positions;
      const ab = [x[b * 3]! - x[a * 3]!, x[b * 3 + 1]! - x[a * 3 + 1]!, x[b * 3 + 2]! - x[a * 3 + 2]!];
      const ac = [x[c * 3]! - x[a * 3]!, x[c * 3 + 1]! - x[a * 3 + 1]!, x[c * 3 + 2]! - x[a * 3 + 2]!];
      const n = [ab[1]! * ac[2]! - ab[2]! * ac[1]!, ab[2]! * ac[0]! - ab[0]! * ac[2]!, ab[0]! * ac[1]! - ab[1]! * ac[0]!];
      const len = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
      side = (((px - q[0]!) * n[0]! + (py - q[1]!) * n[1]! + (pz - q[2]!) * n[2]!) / len) * signs[t]!;
    }
    // Só conta o que está perto da roupa de baixo (a barra da saia, longe da calça, não entra),
    // e só com o ponto mais perto no miolo do triângulo (distância ≈ profundidade): com ele na
    // aresta, o lado pelo plano não diz nada (entre as pernas da calça, a 4 cm do tecido, "entrava").
    const dist = Math.sqrt(best);
    if (dist < 40) depths.push(dist - Math.abs(side) < 2 ? -side : Math.min(0, -side));
  }
  depths.sort((a, b) => b - a);
  return { inside: depths.filter((d) => d > 1).length, deepest: depths[0] ?? 0, near: depths.length };
}

const CALCA = ["frente", "frente~par", "costas", "costas~par"];
const SAIA = ["saia-frente", "saia-frente~dobra", "saia-costas", "saia-costas~dobra"];

describe("look em camadas: calça por baixo, saia por cima", () => {
  it("a saia de teste é válida", () => {
    expect(validatePattern(saia())).toEqual([]);
  });

  it("com camadas, a saia fica por fora da calça; sem elas, entra", () => {
    // 3 s: costura (2 s) e um segundo com gravidade, com a saia assentada sobre a calça.
    const layered = look([{ doc: calca() }, { doc: saia(), layer: 1 }], 3);
    const ids = [...layered.sim.pieceOffset.keys()];
    const inner = ids.filter((id) => CALCA.some((c) => id === c || id.startsWith(`${c}~`)));
    const outer = ids.filter((id) => SAIA.some((c) => id === c || id.startsWith(`${c}~`)));
    expect(inner.length).toBeGreaterThan(0);
    expect(outer.length).toBeGreaterThan(0);
    const withLayers = penetration(layered, inner, outer);
    const flat = look([{ doc: calca() }, { doc: saia() }], 3);
    const without = penetration(flat, inner, outer);
    console.info("camadas", { withLayers, without, msPerFrame: layered.msPerFrame.toFixed(1), flatMs: flat.msPerFrame.toFixed(1) });
    expect(layered.sim.positions.every(Number.isFinite)).toBe(true);
    expect(layered.sim.seamGap()).toBeLessThan(2);
    expect(withLayers.near).toBeGreaterThan(20); // a saia encosta na calça (o teste mede algo)
    expect(withLayers.inside).toBe(0);
    expect(without.inside).toBeGreaterThan(0);
  }, 240_000);

  it("é determinística", () => {
    const a = look([{ doc: calca() }, { doc: saia(), layer: 1 }], 0.5);
    const b = look([{ doc: calca() }, { doc: saia(), layer: 1 }], 0.5);
    expect(Array.from(a.sim.positions)).toEqual(Array.from(b.sim.positions));
  }, 60_000);
});

describe("tecido por parte", () => {
  it("dizer o tecido das opções na parte (e a camada 0) não muda nada", () => {
    const a = look([{ doc: calca() }], 0.5);
    const b = look([{ doc: calca(), fabric: FABRICS.planoLeve, layer: 0 }], 0.5);
    expect(Array.from(b.sim.positions)).toEqual(Array.from(a.sim.positions));
  }, 60_000);

  it("cada parte usa o seu tecido: jeans pesa mais e estica menos que malha", () => {
    const jeans = look([{ doc: calca(), fabric: FABRICS.jeans }], 1);
    const malha = look([{ doc: calca(), fabric: FABRICS.malha }], 1);
    const worst = (r: ReturnType<typeof look>) => Math.max(...r.sim.triangleStretch());
    expect(worst(jeans)).toBeLessThan(worst(malha));
  }, 60_000);

  it("recusa camada inválida", () => {
    const { pieces } = garmentAtSize(saia(), "M");
    const mesh = meshPiece(pieces[0]!, { spacing: 30 });
    expect(() => createSimulation([{ mesh, layer: -1 }], { fabric: FABRICS.malha })).toThrow(/Camada inválida/);
    expect(() => createSimulation([{ mesh, layer: 0.5 }], { fabric: FABRICS.malha })).toThrow(/Camada inválida/);
  });
});
