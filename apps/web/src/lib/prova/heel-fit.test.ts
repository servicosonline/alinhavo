import { createMannequin, createSimulation, FABRICS, floorCollider, meshPiece, pieceHalf, placeGarment } from "@alinhavo/cloth";
import { garmentAtSize } from "@alinhavo/geometry";
import { describe, expect, it } from "vitest";
import { exampleDocument } from "../examples";
import { demoMeasurements } from "./demo-measurements";
import { PROVA_ITERATIONS, PROVA_MESH_SPACING, PROVA_SEWING_TIME } from "./protocol";

/**
 * A calça do conjunto de exemplo, como o Worker da Prova monta, de salto. Antes
 * de nov/2026 ela escorregava pelo quadril até o chão (o atrito só freava; ver
 * simulation.ts no cloth). Mede o alto da calça a cada segundo.
 */
function trousersTop(heel: number, seconds: number): number[] {
  const doc = exampleDocument("conjunto");
  const body = createMannequin(demoMeasurements(doc)[doc.baseSize]!, "em-pe", {}, { heel });
  const { pieces, seams, foldLine } = garmentAtSize(doc, doc.baseSize);
  const meshes = pieces.map((p) => meshPiece(p, { spacing: PROVA_MESH_SPACING, mirror: foldLine[p.id] }));
  const initial = placeGarment(
    meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement!, half: pieceHalf(pieces[i]!) })),
    body.landmarks,
  );
  const sim = createSimulation(
    meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
    { fabric: FABRICS.planoLeve, seams, colliders: [body.collider, floorCollider(0)], iterations: PROVA_ITERATIONS, sewingTime: PROVA_SEWING_TIME },
  );
  const trousers = meshes.filter((m) => m.pieceId.startsWith("calca"));
  const top = () => {
    let t = -Infinity;
    for (const m of trousers) {
      const off = sim.pieceOffset.get(m.pieceId)!;
      for (let v = 0; v < m.positions.length / 2; v++) t = Math.max(t, sim.positions[(off + v) * 3 + 1]!);
    }
    return t;
  };
  const out: number[] = [];
  for (let f = 1; f <= seconds * 60; f++) {
    sim.step();
    if (f % 60 === 0) out.push(top());
  }
  return out;
}

describe("calça do conjunto de salto", () => {
  it("fica acima do quadril e parada (não escorrega até o chão)", () => {
    const heel = 80;
    const tops = trousersTop(heel, 6);
    const doc = exampleDocument("conjunto");
    const body = createMannequin(demoMeasurements(doc)[doc.baseSize]!, "em-pe", {}, { heel });
    expect(tops.at(-1)!).toBeGreaterThan(body.landmarks.hip.y);
    // Parada: do 3º ao 6º segundo anda menos de 5 mm.
    expect(Math.abs(tops.at(-1)! - tops[2]!)).toBeLessThan(5);
  }, 300_000);
});
