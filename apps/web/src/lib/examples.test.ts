import { garmentAtSize, segmentLengths, validatePattern } from "@alinhavo/geometry";
import { createMannequin, createSimulation, FABRICS, floorCollider, meshPiece, pieceHalf, placeGarment } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import { exampleDocument, EXAMPLES } from "./examples";
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

  it("cada chamada devolve um documento novo", () => {
    expect(exampleDocument("conjunto")).not.toBe(exampleDocument("conjunto"));
    expect(exampleDocument("conjunto")).toEqual(exampleDocument("conjunto"));
  });

  it("o conjunto veste o corpo da demonstração: calça na cintura, top nos ombros", () => {
    const doc = exampleDocument("conjunto");
    const body = createMannequin(demoMeasurements(doc).M!);
    const { pieces, seams } = garmentAtSize(doc, "M");
    const meshes = pieces.map((p) => meshPiece(p, { spacing: PROVA_MESH_SPACING }));
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
});
