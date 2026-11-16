import { describe, expect, it } from "vitest";
import { garmentAtSize, type PatternDocument } from "@alinhavo/geometry";
import { createMannequin } from "./body/mannequin";
import { clipBodyOptions, motionClip, motionPose, posedMotion, type MotionId } from "./body/motion";
import { floorCollider } from "./collider";
import { FABRICS, type Fabric } from "./fabrics";
import { meshPiece } from "./mesh";
import { createMotionRun } from "./motion-run";
import { pieceHalf, placeGarment } from "./place";
import { createSimulation } from "./simulation";
import { calca, camiseta } from "./test-garments";

const BODY = { busto: 880, cintura: 720, quadril: 900, altura: 1650 };

/**
 * Veste, assenta 3 s em pé (como a Prova) e roda o movimento até `until` s.
 * Devolve o pior de cada quadro: quanto o tecido entra no corpo, a fração de
 * vértices mais de 3 mm dentro, o maior vão de costura e quanto o alto da
 * roupa desce em relação ao quadril.
 */
function moving(doc: PatternDocument, fabric: Fabric, id: MotionId, until = Infinity) {
  const clip = motionClip(id);
  const body = createMannequin(BODY, "em-pe");
  const { pieces, seams, foldLine } = garmentAtSize(doc, "M");
  const meshes = pieces.map((p) => meshPiece(p, { spacing: 30, mirror: foldLine[p.id] }));
  const initial = placeGarment(meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement!, half: pieceHalf(pieces[i]!) })), body.landmarks);
  const floor = floorCollider(0);
  const sim = createSimulation(meshes.map((mesh, i) => ({ mesh, initial: initial[i] })), { fabric, seams, colliders: [body.collider, floor], iterations: 2, sewingTime: 2 });
  for (let f = 0; f < 180; f++) sim.step();
  const run = createMotionRun(sim, { clip, table: BODY, fixed: [floor] });
  const options = clipBodyOptions(clip, BODY);
  const worst = { inside: 0, insideShare: 0, gap: 0, drop: 0, frames: 0, seatedFrames: 0 };
  let top0: number | null = null;
  for (let fr = run.next(); fr && fr.t <= until; fr = run.next()) {
    const b = posedMotion(BODY, motionPose(clip, fr.t), {}, {}, { ...options, mesh: false }).body;
    let deep = 0;
    let top = -Infinity;
    const hip = b.landmarks.legs.left[0]!.y;
    for (let i = 0; i < sim.vertexCount; i++) {
      const d = b.collider.query(fr.positions[i * 3]!, fr.positions[i * 3 + 1]!, fr.positions[i * 3 + 2]!).distance;
      if (d < -3) deep++;
      worst.inside = Math.max(worst.inside, -d);
      top = Math.max(top, fr.positions[i * 3 + 1]! - hip);
    }
    top0 ??= top;
    worst.drop = Math.max(worst.drop, top0 - top);
    worst.insideShare = Math.max(worst.insideShare, deep / sim.vertexCount);
    worst.gap = Math.max(worst.gap, sim.seamGap());
    worst.frames++;
    if (fr.seated) worst.seatedFrames++;
    expect(fr.body.positions.length).toBeGreaterThan(0);
  }
  return { worst, run };
}

describe("roupa em movimento", () => {
  it("calça andando: fica na cintura, não entra no corpo e as costuras não abrem", () => {
    const { worst } = moving(calca(), FABRICS.jeans, "andar", 2.5);
    expect(worst.frames).toBe(76);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.insideShare).toBeLessThan(0.02);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(50);
  }, 120_000);

  it("calça correndo: o atrito contra a pele que anda segura a calça (sem ele, caía)", () => {
    const { worst } = moving(calca(), FABRICS.jeans, "correr", 2);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(50);
  }, 180_000);

  it("calça sentando no banco: o banco aparece, o jeans não é espremido para dentro do corpo", () => {
    const { worst, run } = moving(calca(), FABRICS.jeans, "sentar");
    expect(run.seat).not.toBeNull();
    expect(worst.seatedFrames).toBeGreaterThan(20);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.insideShare).toBeLessThan(0.02);
    expect(worst.gap).toBeLessThan(5);
  }, 180_000);

  it("camiseta acenando: a manga acompanha o braço para cima", () => {
    const { worst } = moving(camiseta(), FABRICS.malha, "acenar", 2);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(30);
  }, 120_000);
});
