import { garmentAtSize } from "@alinhavo/geometry";
import { meshPiece } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import { samplePattern } from "../sample-pattern";
import { buildProvaEdges, frontmostLine, nearestLine } from "./edges";

describe("bordas da Prova", () => {
  it("cada borda das peças abertas aponta um segmento do molde; a dobra não vira borda", () => {
    const garment = garmentAtSize(samplePattern(), "M");
    const meshes = garment.pieces.map((p) => meshPiece(p, { spacing: 30 }));
    const offsets = new Map<string, number>();
    let n = 0;
    for (const m of meshes) {
      offsets.set(m.pieceId, n);
      n += m.positions.length / 2;
    }
    const edges = buildProvaEdges(meshes, offsets, garment.origin);
    // Saia aberta: cintura, lateral e barra de cada peça (o centro é a dobra, some ao abrir).
    const keys = edges.list.map((e) => `${e.piece}#${e.segment}`).sort();
    expect(keys).toEqual(["costas#0", "costas#1", "costas#2", "frente#0", "frente#1", "frente#2"]);
    // Uma linha por vértice de borda, e todas com dono.
    const boundary = meshes.reduce((s, m) => s + m.boundaryCount, 0);
    expect(edges.lines.length).toBe(boundary * 2);
    expect(edges.owner.length).toBe(boundary);
    expect(Math.min(...edges.owner)).toBeGreaterThanOrEqual(0);
    // As duas metades da barra da frente são o mesmo segmento do molde.
    const barra = edges.list.findIndex((e) => e.piece === "frente" && e.segment === 2);
    const linhasDaBarra = [...edges.owner].filter((o) => o === barra).length;
    expect(linhasDaBarra).toBeGreaterThan(10);
  });

  it("acha a linha mais perto dentro da distância máxima", () => {
    // Dois segmentos: (0,0,0)–(100,0,0) e (0,100,0)–(100,100,0).
    const coords = [0, 0, 0, 100, 0, 0, 0, 100, 0, 100, 100, 0];
    const lines = [0, 1, 2, 3];
    expect(nearestLine(coords, lines, { x: 50, y: 10, z: 0 }, 40)).toBe(0);
    expect(nearestLine(coords, lines, { x: 50, y: 80, z: 5 }, 40)).toBe(1);
    expect(nearestLine(coords, lines, { x: 50, y: 50, z: 0 }, 40)).toBe(-1);
    expect(nearestLine(coords, lines, { x: 130, y: 0, z: 0 }, 40)).toBe(0); // além da ponta, mede até a ponta
  });

  it("na tela, entre as bordas perto do clique fica a mais próxima da câmera", () => {
    // Duas linhas quase sobrepostas na tela: a 1 está mais perto do clique, mas atrás.
    const screen = [0, 0, 0, 100, 0, 0, 0, 4, 0, 100, 4, 0];
    const lines = [0, 1, 2, 3];
    const depth = [1, 1, 3, 3]; // a linha 0 está na frente
    expect(frontmostLine(screen, depth, lines, { x: 50, y: 3 }, 10)).toBe(0);
    expect(frontmostLine(screen, [3, 3, 1, 1], lines, { x: 50, y: 3 }, 10)).toBe(1);
    expect(frontmostLine(screen, depth, lines, { x: 50, y: 40 }, 10)).toBe(-1);
  });
});
