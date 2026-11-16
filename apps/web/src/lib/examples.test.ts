import { garmentAtSize, segmentLengths, validatePattern, type PatternDocument } from "@alinhavo/geometry";
import { createMannequin, createSimulation, FABRICS, floorCollider, meshPiece, pieceHalf, placeGarment, type BodyPose } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import {
  exampleBlouse,
  exampleDocument,
  exampleDress,
  exampleLongSleeveBlouse,
  examplePants,
  EXAMPLES,
  exampleShorts,
  exampleTee,
  exampleWideSkirt,
  lookExamples,
} from "./examples";
import { demoMeasurements } from "./prova/demo-measurements";
import { PROVA_ITERATIONS, PROVA_MESH_SPACING, PROVA_SEWING_TIME } from "./prova/protocol";

describe("moldes de exemplo", () => {
  it.each(EXAMPLES.map((e) => e.id))("%s é válido em todos os tamanhos e as costuras fecham sem sobra", (id) => {
    const doc = exampleDocument(id);
    expect(validatePattern(doc)).toEqual([]);
    for (const size of doc.sizes) {
      const g = garmentAtSize(doc, size);
      for (const s of g.seams) {
        const len = (e: { piece: string; segment: number }) => segmentLengths(g.pieces.find((p) => p.id === e.piece)!)[e.segment]!;
        // Diferença pequena entre os lados (até 1,5%): o franzido fica por conta do tecido.
        expect(Math.abs(len(s.a) - len(s.b)) / Math.max(len(s.a), len(s.b))).toBeLessThan(0.015);
      }
    }
  });

  it.each(lookExamples().map((e) => [e.id, e.doc] as const))("roupa do look %s é válida e as costuras fecham sem sobra", (_id, doc) => {
    expect(validatePattern(doc)).toEqual([]);
    for (const size of doc.sizes) {
      const g = garmentAtSize(doc, size);
      for (const s of g.seams) {
        const len = (e: { piece: string; segment: number }) => segmentLengths(g.pieces.find((p) => p.id === e.piece)!)[e.segment]!;
        expect(Math.abs(len(s.a) - len(s.b)) / Math.max(len(s.a), len(s.b))).toBeLessThan(0.015);
      }
    }
  });

  it("a saia ampla tem a cintura maior que a da calça (para vestir por cima)", () => {
    // No molde (base M), segmento 0 = cintura. Saia: meia frente e meias costas na dobra (× 4 no total
    // de 2 partes × 2 metades); calça: frente e costas de cortar par (× 2).
    const cintura = (doc: ReturnType<typeof exampleWideSkirt>) => doc.pieces.reduce((sum, p) => sum + segmentLengths(p)[0]!, 0);
    const saia = cintura(exampleWideSkirt()) * 2;
    const calca = cintura(examplePants()) * 2;
    expect(saia).toBeGreaterThan(calca + 30);
  });

  it("cada chamada devolve um documento novo", () => {
    expect(exampleDocument("conjunto")).not.toBe(exampleDocument("conjunto"));
    expect(exampleDocument("conjunto")).toEqual(exampleDocument("conjunto"));
  });

  it("o conjunto veste o corpo da demonstração: calça na cintura, top nos ombros", () => {
    const doc = exampleDocument("conjunto");
    const body = createMannequin(demoMeasurements(doc).M!);
    const { pieces, seams, foldLine } = garmentAtSize(doc, "M");
    // Como no Worker: malha simétrica pela linha da dobra.
    const meshes = pieces.map((p) => meshPiece(p, { spacing: PROVA_MESH_SPACING, mirror: foldLine[p.id] }));
    const initial = placeGarment(
      meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement!, half: pieceHalf(pieces[i]!) })),
      body.landmarks,
    );
    const sim = createSimulation(
      meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
      { fabric: FABRICS.planoLeve, seams, colliders: [body.collider, floorCollider(0)], iterations: PROVA_ITERATIONS, sewingTime: PROVA_SEWING_TIME },
    );
    for (let f = 0; f < 240; f++) sim.step();
    expect(sim.positions.every(Number.isFinite)).toBe(true);
    expect(sim.seamGap()).toBeLessThan(2);

    const topOf = (prefix: string) => {
      let top = -Infinity;
      for (const [id, off] of sim.pieceOffset) {
        if (!id.startsWith(prefix)) continue;
        const count = meshes[pieces.findIndex((p) => p.id === id)]!.positions.length / 2;
        for (let i = off; i < off + count; i++) top = Math.max(top, sim.positions[i * 3 + 1]!);
      }
      return top;
    };
    const L = body.landmarks;
    expect(topOf("calca")).toBeGreaterThan(L.waist.y - 100); // não escorregou
    expect(topOf("calca")).toBeLessThan(L.waist.y + 40);
    expect(topOf("top")).toBeGreaterThan(L.shoulder.y - 20); // preso pelas alças
  }, 180_000);

  /** Veste o molde no corpo da demonstração (M), como o Worker, e simula `frames` quadros. */
  function vestir(doc: PatternDocument, frames = 240, pose: BodyPose = "em-pe") {
    const body = createMannequin(demoMeasurements(doc).M!, pose);
    const { pieces, seams, foldLine } = garmentAtSize(doc, "M");
    const meshes = pieces.map((p) => meshPiece(p, { spacing: PROVA_MESH_SPACING, mirror: foldLine[p.id] }));
    const initial = placeGarment(
      meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement!, half: pieceHalf(pieces[i]!) })),
      body.landmarks,
    );
    const sim = createSimulation(
      meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
      { fabric: FABRICS.planoLeve, seams, colliders: [body.collider, floorCollider(0)], iterations: PROVA_ITERATIONS, sewingTime: PROVA_SEWING_TIME },
    );
    for (let f = 0; f < frames; f++) sim.step();
    let top = -Infinity;
    let bottom = Infinity;
    for (let i = 1; i < sim.positions.length; i += 3) {
      top = Math.max(top, sim.positions[i]!);
      bottom = Math.min(bottom, sim.positions[i]!);
    }
    return { sim, L: body.landmarks, top, bottom, pieces, collider: body.collider };
  }

  it.each([
    ["blusa", exampleBlouse],
    ["vestido", exampleDress],
  ] as const)("%s sem manga fica presa nos ombros e as costuras fecham", (_id, make) => {
    const { sim, L, top, bottom } = vestir(make());
    expect(sim.positions.every(Number.isFinite)).toBe(true);
    expect(sim.seamGap()).toBeLessThan(2);
    expect(top).toBeGreaterThan(L.shoulder.y - 20); // não escorregou dos ombros
    expect(top).toBeLessThan(L.neck.y + 40);
    expect(bottom).toBeLessThan(L.hip.y); // passa do quadril
    expect(bottom).toBeGreaterThan(0); // não chega ao chão
  }, 180_000);

  it("o short fica na cintura e termina acima do joelho", () => {
    const { sim, L, top, bottom } = vestir(exampleShorts());
    expect(sim.positions.every(Number.isFinite)).toBe(true);
    expect(sim.seamGap()).toBeLessThan(2);
    expect(top).toBeGreaterThan(L.waist.y - 100);
    expect(top).toBeLessThan(L.waist.y + 40);
    expect(bottom).toBeLessThan(L.crotch.y);
    expect(bottom).toBeGreaterThan(L.crotch.y - 350);
  }, 180_000);

  // Em pé, o braço do manequim entra no tronco na axila (uns 15 mm; ver o top em
  // packages/cloth): ali não cabe a costura da cava num tecido plano, que quase
  // não estica, e sobram uns milímetros (medido: 3,7 a 5,1 mm). De braços abertos
  // o braço sai do tronco e a mesma roupa fecha como as outras (1,1 mm).
  // Braços abertos (70°): a manga longa desce menos, porque o braço quase não aponta para baixo.
  it.each([
    { id: "camiseta", make: exampleTee, sleeveDrop: 150, pose: "em-pe", maxGap: 6 },
    { id: "camiseta", make: exampleTee, sleeveDrop: 100, pose: "bracos-abertos", maxGap: 2 },
    { id: "blusa com manga longa", make: exampleLongSleeveBlouse, sleeveDrop: 450, pose: "em-pe", maxGap: 6 },
    { id: "blusa com manga longa", make: exampleLongSleeveBlouse, sleeveDrop: 120, pose: "bracos-abertos", maxGap: 2 },
  ] as const)("$id na pose $pose: costura, fica nos ombros e cada manga no seu braço", ({ make, sleeveDrop, pose, maxGap }) => {
    const { sim, L, top, pieces, collider } = vestir(make(), 240, pose);
    expect(sim.positions.every(Number.isFinite)).toBe(true);
    expect(sim.seamGap()).toBeLessThan(maxGap);
    expect(top).toBeGreaterThan(L.shoulder.y - 20);
    expect(top).toBeLessThan(L.neck.y + 60);
    const offsets = [...sim.pieceOffset.entries()].sort((a, b) => a[1] - b[1]);
    let sleeves = 0;
    for (const [k, [id, from]] of offsets.entries()) {
      const arm = pieces.find((p) => p.id === id)!.placement?.arm;
      if (!arm) continue;
      sleeves++;
      const to = offsets[k + 1]?.[1] ?? sim.vertexCount;
      let cx = 0;
      let low = Infinity;
      for (let v = from; v < to; v++) {
        const [x, y, z] = [sim.positions[v * 3]!, sim.positions[v * 3 + 1]!, sim.positions[v * 3 + 2]!];
        cx += x;
        low = Math.min(low, y);
        // Fora do braço, menos na axila (o braço do manequim entra no tronco ali).
        const axila = y > L.bust.y - 60 && Math.abs(x) < L.shoulder.halfWidth + 20;
        if (!axila) expect(collider.query(x, y, z).distance).toBeGreaterThan(-3);
      }
      expect(Math.sign(cx / (to - from))).toBe(arm === "esquerda" ? 1 : -1);
      // A manga desce pelo braço (curta até perto do bíceps, longa até perto do punho).
      expect(low).toBeLessThan(L.shoulder.y - sleeveDrop);
    }
    expect(sleeves).toBe(2);
  }, 180_000);
});
