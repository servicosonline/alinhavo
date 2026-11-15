import { describe, expect, it } from "vitest";
import { emptyDocument, garmentAtSize, type PatternDocument } from "@alinhavo/geometry";
import { createMannequin } from "./body/mannequin";
import { floorCollider } from "./collider";
import { FABRICS } from "./fabrics";
import { meshPiece } from "./mesh";
import { pieceHalf, placeGarment } from "./place";
import { createSimulation } from "./simulation";
import { calca, top } from "./test-garments";

/**
 * Conjunto calça + top num molde só (como o exemplo do /experimentar): o top
 * de alças tem de assentar simétrico e ficar assim. Antes, a alça começava
 * longe da alça do outro lado (elipse do ombro até a altura do pescoço) e a
 * costura a fazia escorregar pela descida do ombro; com a malha das peças
 * abertas pela dobra assimétrica, um lado escorregava mais e o top ficava torto.
 */

const BODY = { busto: 880, cintura: 720, quadril: 900, altura: 1650 };
/** Segmento da barra no molde do top (0 decote, 1 alça, 2 cava, 3 lateral, 4 barra, 5 dobra). */
const BARRA = 4;
/** Diferença máxima, em mm, entre a altura média da barra à esquerda e à direita. */
const HEM_TOLERANCE = 10;
const SECONDS = 10;

function conjunto(): PatternDocument {
  const doc = emptyDocument(["M"], "M");
  doc.pieces = [...calca().pieces, ...top().pieces];
  doc.seams = [...calca().seams, ...top().seams];
  return doc;
}

describe("conjunto calça + top", () => {
  it.each(["malha", "planoLeve", "jeans"] as const)("o top fica simétrico e preso nos ombros depois de 10 s (%s)", (fabricId) => {
    const body = createMannequin(BODY);
    const garment = garmentAtSize(conjunto(), "M");
    const { pieces, seams } = garment;
    // Como no Worker da Prova: malha simétrica pela linha da dobra.
    const meshes = pieces.map((p) => meshPiece(p, { spacing: 30, mirror: garment.foldLine[p.id] }));
    const initial = placeGarment(
      meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement!, half: pieceHalf(pieces[i]!) })),
      body.landmarks,
    );
    const sim = createSimulation(
      meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
      { fabric: FABRICS[fabricId], seams, colliders: [body.collider, floorCollider(0)], iterations: 2, sewingTime: 2 },
    );
    for (let f = 0; f < SECONDS * 60; f++) sim.step();
    const P = sim.positions;
    expect(P.every(Number.isFinite)).toBe(true);
    expect(sim.seamGap()).toBeLessThan(2);

    // Barra de cada lado do corpo (esquerda em +X), frente e costas em separado.
    const hem = { frente: { left: [] as number[], right: [] as number[] }, costas: { left: [] as number[], right: [] as number[] } };
    let strapLeft = -Infinity;
    let strapRight = -Infinity;
    meshes.forEach((mesh, k) => {
      const id = pieces[k]!.id;
      if (!id.startsWith("top-")) return;
      const off = sim.pieceOffset.get(id)!;
      const part = id === "top-frente" ? hem.frente : hem.costas;
      const start = initial[k]!;
      for (let i = 0; i < mesh.positions.length / 2; i++) {
        const g = off + i;
        // Lado pela posição inicial (simétrica): o ponto pode cruzar o meio ao assentar.
        const x = start[i * 3]!;
        const y = P[g * 3 + 1]!;
        if (x > 0) strapLeft = Math.max(strapLeft, y);
        else strapRight = Math.max(strapRight, y);
        if (i >= mesh.boundaryCount || garment.origin[id]![mesh.boundarySegment[i]!]!.segment !== BARRA) continue;
        if (Math.abs(x) > 20) (x > 0 ? part.left : part.right).push(y);
      }
    });
    const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    const L = body.landmarks;
    const report = {
      frente: mean(hem.frente.left) - mean(hem.frente.right),
      costas: mean(hem.costas.left) - mean(hem.costas.right),
      strapLeft: strapLeft - L.shoulder.y,
      strapRight: strapRight - L.shoulder.y,
    };
    console.info(fabricId, report);
    for (const part of [hem.frente, hem.costas]) {
      expect(part.left.length).toBeGreaterThan(2);
      expect(part.right.length).toBeGreaterThan(2);
    }
    expect(Math.abs(report.frente)).toBeLessThan(HEM_TOLERANCE);
    expect(Math.abs(report.costas)).toBeLessThan(HEM_TOLERANCE);
    // As duas alças continuam em cima do ombro (escorregar leva a alça uns 15 cm para baixo, pelo braço).
    expect(report.strapLeft).toBeGreaterThan(0);
    expect(report.strapRight).toBeGreaterThan(0);
  }, 300_000);
});
