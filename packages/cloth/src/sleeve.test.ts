import { describe, expect, it } from "vitest";
import { garmentAtSize, segmentLengths, validatePattern } from "@alinhavo/geometry";
import { createMannequin } from "./body/mannequin";
import type { BodyPose } from "./body/types";
import { floorCollider } from "./collider";
import { FABRICS } from "./fabrics";
import { meshPiece } from "./mesh";
import { armAt, pieceHalf, placeGarment } from "./place";
import { createSimulation } from "./simulation";
import { camiseta } from "./test-garments";

const BODY = { busto: 880, cintura: 720, quadril: 900, altura: 1650 };

function provar(pose: BodyPose, seconds: number) {
  const body = createMannequin(BODY, pose);
  const doc = camiseta();
  const { pieces, seams, foldLine } = garmentAtSize(doc, "M");
  const meshes = pieces.map((p) => meshPiece(p, { spacing: 30, mirror: foldLine[p.id] }));
  const initial = placeGarment(
    meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement!, half: pieceHalf(pieces[i]!) })),
    body.landmarks,
  );
  const sim = createSimulation(
    meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
    { fabric: FABRICS.malha, seams, colliders: [body.collider, floorCollider(0)], iterations: 2, sewingTime: 2 },
  );
  const gap0 = sim.seamGap();
  for (let f = 0; f < seconds * 60; f++) sim.step();
  return { sim, body, gap0, pieces, meshes, initial };
}

describe("manga (parte que veste o braço)", () => {
  it("a camiseta de teste é válida e a cabeça da manga mede o mesmo que a cava", () => {
    const doc = camiseta();
    expect(validatePattern(doc)).toEqual([]);
    const g = garmentAtSize(doc, "M");
    for (const s of g.seams) {
      const len = (e: { piece: string; segment: number }) => segmentLengths(g.pieces.find((p) => p.id === e.piece)!)[e.segment]!;
      expect(Math.abs(len(s.a) - len(s.b)) / Math.max(len(s.a), len(s.b))).toBeLessThan(0.015);
    }
    // Duas mangas, cada uma com as duas metades da cabeça e a lateral: 2 × 3 costuras, mais ombro e lateral nas duas metades.
    expect(g.seams).toHaveLength(10);
  });

  it("o eixo do braço desce do ombro ao punho, do lado de cada braço", () => {
    const L = createMannequin(BODY).landmarks;
    for (const [arm, sign] of [["esquerda", 1], ["direita", -1]] as const) {
      const top = armAt(L, arm, 0);
      const low = armAt(L, arm, 400);
      expect(Math.sign(top.p.x)).toBe(sign);
      expect(top.p.y).toBeGreaterThan(L.bust.y);
      expect(top.p.y).toBeLessThan(L.neck.y);
      expect(low.p.y).toBeLessThan(top.p.y - 300);
      expect(top.r).toBeGreaterThan(low.r);
    }
  });

  it("a manga começa enrolada no braço do seu lado, fora dele", () => {
    const { body, pieces, initial } = provar("em-pe", 0);
    for (const [i, p] of pieces.entries()) {
      if (!p.placement?.arm) continue;
      const pos = initial[i]!;
      const sign = p.placement.arm === "esquerda" ? 1 : -1;
      let inside = 0;
      for (let k = 0; k < pos.length; k += 3) {
        expect(Math.sign(pos[k]!)).toBe(sign);
        if (body.collider.query(pos[k]!, pos[k + 1]!, pos[k + 2]!).distance < 0) inside++;
      }
      // Na axila o braço do manequim entra no tronco; só ali a manga pode começar dentro.
      expect(inside / (pos.length / 3)).toBeLessThan(0.15);
    }
  });

  it.each(["em-pe", "bracos-abertos"] as const)("camiseta na pose %s: costura, fica nos ombros e as mangas nos braços", (pose) => {
    const { sim, body, gap0, pieces } = provar(pose, 4);
    expect(sim.positions.every(Number.isFinite)).toBe(true);
    console.info("camiseta", pose, { gap0: Math.round(gap0), gap: sim.seamGap() });
    expect(sim.seamGap()).toBeLessThan(2);
    const L = body.landmarks;
    let top = -Infinity;
    for (let i = 1; i < sim.positions.length; i += 3) top = Math.max(top, sim.positions[i]!);
    expect(top).toBeGreaterThan(L.shoulder.y - 20);
    expect(top).toBeLessThan(L.neck.y + 60);
    // Cada manga fica em volta do seu braço (o meio dela do lado certo, além do tronco)
    // e fora dele, menos na axila, onde o braço do manequim entra no tronco.
    const offsets = [...sim.pieceOffset.entries()].sort((a, b) => a[1] - b[1]);
    for (const [k, [id, from]] of offsets.entries()) {
      const piece = pieces.find((p) => p.id === id)!;
      if (!piece.placement?.arm) continue;
      const to = offsets[k + 1]?.[1] ?? sim.vertexCount;
      const sign = piece.placement.arm === "esquerda" ? 1 : -1;
      let cx = 0;
      for (let v = from; v < to; v++) {
        const [x, y, z] = [sim.positions[v * 3]!, sim.positions[v * 3 + 1]!, sim.positions[v * 3 + 2]!];
        cx += x;
        const axila = y > L.bust.y - 60 && Math.abs(x) < L.shoulder.halfWidth + 20;
        if (!axila) expect(body.collider.query(x, y, z).distance).toBeGreaterThan(-3);
      }
      expect(Math.sign(cx / (to - from))).toBe(sign);
      expect(Math.abs(cx / (to - from))).toBeGreaterThan(L.bust.halfWidth);
    }
  }, 180_000);
});
