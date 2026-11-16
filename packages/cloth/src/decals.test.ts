import { describe, expect, it } from "vitest";
import { addFinish, emptyDocument, garmentAtSize, type PatternDocument, type Piece } from "@alinhavo/geometry";
import { decalPositions, DECAL_GRID, DECAL_STEP, embedPoints, garmentDecals, resampleLine } from "./decals";
import { meshPiece } from "./mesh";

/** Retângulo 200 × 400 (u para a direita, v para baixo), segmentos 0 alto, 1 direita, 2 baixo, 3 esquerda. */
function retangulo(): Piece {
  return {
    id: "r",
    name: "Retângulo",
    points: { A: { x: 0, y: 0 }, B: { x: 200, y: 0 }, C: { x: 200, y: 400 }, D: { x: 0, y: 400 } },
    start: "A",
    outline: [
      { kind: "line", to: "B" },
      { kind: "line", to: "C" },
      { kind: "line", to: "D" },
      { kind: "line", to: "A" },
    ],
    seamAllowance: 10,
  };
}
function doc(piece: Piece): PatternDocument {
  const d = emptyDocument(["M"], "M");
  d.pieces = [piece];
  return d;
}

/** A malha "vestida" plana: a posição 3D de cada vértice é (u, v, 0). */
function flat3d(positions: Float64Array): Float64Array {
  const out = new Float64Array((positions.length / 2) * 3);
  for (let i = 0; i < positions.length / 2; i++) {
    out[i * 3] = positions[i * 2]!;
    out[i * 3 + 1] = positions[i * 2 + 1]!;
  }
  return out;
}

describe("resampleLine", () => {
  it("põe pontos a no máximo o passo, mantendo as pontas", () => {
    const out = resampleLine([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out.at(-1)).toEqual({ x: 100, y: 0 });
    for (let i = 1; i < out.length; i++) expect(out[i]!.x - out[i - 1]!.x).toBeLessThanOrEqual(DECAL_STEP + 1e-9);
  });
});

describe("embedPoints", () => {
  const mesh = meshPiece(retangulo(), { spacing: 30 });
  const x3 = flat3d(mesh.positions);

  it("um ponto dentro da malha volta ao mesmo lugar (pesos que somam 1)", () => {
    const pts = [
      { x: 37, y: 121 },
      { x: 150, y: 333 },
      { x: 0, y: 0 },
    ];
    const e = embedPoints(mesh, pts, 0);
    const back = decalPositions(e, x3);
    pts.forEach((p, k) => {
      expect(back[k * 3]).toBeCloseTo(p.x, 3);
      expect(back[k * 3 + 1]).toBeCloseTo(p.y, 3);
      expect(e.weights[k * 3]! + e.weights[k * 3 + 1]! + e.weights[k * 3 + 2]!).toBeCloseTo(1, 5);
    });
  });

  it("ponto fora vai para a borda mais perto; o deslocamento da peça entra nos índices", () => {
    const e = embedPoints(mesh, [{ x: -20, y: 200 }], 1000);
    const back = decalPositions({ vertices: e.vertices.map((v) => v - 1000), weights: e.weights }, x3);
    expect(back[0]).toBeCloseTo(0, 3);
    expect(back[1]).toBeCloseTo(200, 3);
    expect(Math.min(...e.vertices)).toBeGreaterThanOrEqual(1000);
  });
});

describe("garmentDecals", () => {
  it("cada acabamento vira o seu decalque, seguindo a malha", () => {
    let d = doc(retangulo());
    d = addFinish(d, "r", { kind: "pesponto", segment: 2, distance: 10, rows: 2 }).doc;
    d = addFinish(d, "r", { kind: "ziper", segment: 3, from: 0, to: 0.5 }).doc;
    d = addFinish(d, "r", { kind: "etiqueta", anchor: "A", offset: { x: 100, y: 60 }, width: 60, height: 30, rotation: 0, text: "M" }).doc;
    const g = garmentAtSize(d, "M");
    const mesh = meshPiece(g.pieces[0]!, { spacing: 30 });
    const decals = garmentDecals(g.finishes, [mesh], new Map([["r", 0]]));
    expect(decals.map((x) => x.kind)).toEqual(["pesponto", "pesponto", "ziper", "ziper-dentes", "etiqueta"]);

    const x3 = flat3d(mesh.positions);
    // Pesponto a 1 cm da barra (y = 400): todos os pontos em y = 390.
    const pesp = decalPositions(decals[0]!, x3);
    for (let k = 1; k < pesp.length; k += 3) expect(pesp[k]).toBeCloseTo(390, 3);

    const label = decals[4]!;
    expect(label.mode).toBe("mesh");
    expect(label.weights.length / 3).toBe((DECAL_GRID + 1) ** 2);
    expect(label.indices!.length).toBe(DECAL_GRID * DECAL_GRID * 6);
    expect(label.text).toBe("M");
    expect(label.aspect).toBe(2);
    // O canto 0 da grade é o alto à esquerda da etiqueta, com v = 1 no alto da imagem.
    const lp = decalPositions(label, x3);
    expect([lp[0], lp[1]]).toEqual([70, 45]);
    expect([label.uv![0], label.uv![1]]).toEqual([0, 1]);

    const ziper = decals[2]!;
    expect(ziper.indices!.length % 6).toBe(0);
  });

  it("peça fora da simulação fica de fora", () => {
    const d = addFinish(doc(retangulo()), "r", { kind: "pesponto", segment: 0, distance: 5, rows: 1 }).doc;
    const g = garmentAtSize(d, "M");
    expect(garmentDecals(g.finishes, [], new Map())).toEqual([]);
  });
});

describe("bordado e pedraria", () => {
  const PNG = "data:image/png;base64,iVBORw0KGgo=";

  it("bordado vira malha com a imagem; pedraria, um ponto por pedra no lugar dela, com cor e tamanho", () => {
    let d = doc(retangulo());
    d = addFinish(d, "r", { kind: "bordado", anchor: "A", offset: { x: 100, y: 100 }, width: 60, height: 40, rotation: 0, image: PNG }).doc;
    d = addFinish(d, "r", { kind: "pedraria", segment: 2, distance: 10, from: 0, to: 1, stone: 5, spacing: 20, color: "#ddeeff" }).doc;
    const g = garmentAtSize(d, "M");
    const mesh = meshPiece(g.pieces[0]!, { spacing: 30 });
    const decals = garmentDecals(g.finishes, [mesh], new Map([["r", 0]]));
    const bordado = decals.find((x) => x.kind === "bordado")!;
    expect(bordado.mode).toBe("mesh");
    expect(bordado.image).toBe(PNG);
    const pedras = decals.find((x) => x.kind === "pedraria")!;
    expect(pedras.mode).toBe("points");
    expect(pedras.color).toBe("#ddeeff");
    expect(pedras.size).toBe(5);
    const pos = decalPositions(pedras, flat3d(mesh.positions));
    expect(pos.length / 3).toBe(11); // 200 mm ÷ 20 + 1
    for (let k = 0; k < pos.length; k += 3) expect(pos[k + 1]!).toBeCloseTo(390, 3);
  });
});
