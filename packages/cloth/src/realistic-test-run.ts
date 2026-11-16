import { garmentAtSize, type PatternDocument } from "@alinhavo/geometry";
import { MAKEHUMAN_DATA } from "./body/makehuman-data";
import { decodeMakeHuman } from "./body/makehuman";
import { clipBodyOptionsWith, motionClip, motionPose, posedWith, type MotionId } from "./body/motion";
import { buildRealistic, realisticBuilder, realisticModel } from "./body/realistic";
import type { Body } from "./body/types";
import { floorCollider } from "./collider";
import type { Fabric } from "./fabrics";
import { meshPiece } from "./mesh";
import { createMotionRun } from "./motion-run";
import { pieceHalf, placeGarment } from "./place";
import { createSimulation } from "./simulation";

/**
 * Só para os testes: veste uma roupa de teste no corpo realista, assenta 3 s
 * em pé (como a Prova) e roda o movimento até `until` s, medindo o pior de
 * cada quadro como em `motion-run.test.ts`: quanto o tecido entra no corpo, a
 * fração de vértices mais de 3 mm dentro, o maior vão de costura e quanto o
 * alto da roupa desce em relação ao quadril.
 */
export const REALISTIC_BODY = { busto: 880, cintura: 720, quadril: 900, altura: 1650 };

const asset = decodeMakeHuman(MAKEHUMAN_DATA);
const model = realisticModel(asset, REALISTIC_BODY);
const builder = realisticBuilder(model);

type Worst = { inside: number; insideShare: number; gap: number; drop: number; frames: number; seatedFrames: number };

function depth(body: Body, positions: ArrayLike<number>, count: number) {
  let inside = 0;
  let deep = 0;
  let top = -Infinity;
  const hip = body.landmarks.legs.left[0]!.y;
  for (let i = 0; i < count; i++) {
    const d = body.collider.query(positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!).distance;
    if (d < -3) deep++;
    inside = Math.max(inside, -d);
    top = Math.max(top, positions[i * 3 + 1]! - hip);
  }
  return { inside, share: deep / count, top };
}

export function dressRealistic(doc: PatternDocument, fabric: Fabric) {
  const body = buildRealistic(model, "em-pe").body;
  const { pieces, seams, foldLine } = garmentAtSize(doc, "M");
  const meshes = pieces.map((p) => meshPiece(p, { spacing: 30, mirror: foldLine[p.id] }));
  const initial = placeGarment(meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement!, half: pieceHalf(pieces[i]!) })), body.landmarks);
  const floor = floorCollider(0);
  const sim = createSimulation(meshes.map((mesh, i) => ({ mesh, initial: initial[i] })), { fabric, seams, colliders: [body.collider, floor], iterations: 2, sewingTime: 2 });
  for (let f = 0; f < 180; f++) sim.step();
  const standing = depth(body, sim.positions, sim.vertexCount);
  return { sim, floor, standing: { inside: standing.inside, insideShare: standing.share, gap: sim.seamGap() } };
}

export function movingRealistic(doc: PatternDocument, fabric: Fabric, id: MotionId, until = Infinity) {
  const { sim, floor } = dressRealistic(doc, fabric);
  const clip = motionClip(id);
  const run = createMotionRun(sim, { clip, table: REALISTIC_BODY, builder, fixed: [floor] });
  const options = clipBodyOptionsWith(clip, builder);
  const worst: Worst = { inside: 0, insideShare: 0, gap: 0, drop: 0, frames: 0, seatedFrames: 0 };
  let top0: number | null = null;
  for (let fr = run.next(); fr && fr.t <= until; fr = run.next()) {
    const b = posedWith(builder, motionPose(clip, fr.t), { ...options, mesh: false }).body;
    const m = depth(b, fr.positions, sim.vertexCount);
    top0 ??= m.top;
    worst.drop = Math.max(worst.drop, top0 - m.top);
    worst.inside = Math.max(worst.inside, m.inside);
    worst.insideShare = Math.max(worst.insideShare, m.share);
    worst.gap = Math.max(worst.gap, sim.seamGap());
    worst.frames++;
    if (fr.seated) worst.seatedFrames++;
    if (fr.body.positions.length === 0) throw new Error("quadro sem o corpo");
  }
  return { worst, run };
}
