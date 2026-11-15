import { describe, expect, it } from "vitest";
import { unfoldPiece, type Piece } from "@alinhavo/geometry";
import { meshPiece, type PieceMesh } from "./mesh";
import { garmentUv } from "./uv";

/** Trapézio com o fio inclinado 30°. */
function peca(id: string, grainAngleDeg = 30): Piece {
  const a = (grainAngleDeg * Math.PI) / 180;
  return {
    id,
    name: id,
    points: { A: { x: 0, y: 0 }, B: { x: 240, y: 0 }, C: { x: 300, y: 500 }, D: { x: 0, y: 500 } },
    start: "A",
    outline: [
      { kind: "line", to: "B" },
      { kind: "line", to: "C" },
      { kind: "line", to: "D" },
      { kind: "line", to: "A" },
    ],
    seamAllowance: 10,
    grainline: { from: { x: 100, y: 100 }, to: { x: 100 + Math.sin(a) * 300, y: 100 + Math.cos(a) * 300 } },
  };
}

const xy = (m: PieceMesh, i: number) => ({ x: m.positions[i * 2]!, y: m.positions[i * 2 + 1]! });
const uvAt = (uv: Float32Array, i: number) => ({ x: uv[i * 2]!, y: uv[i * 2 + 1]! });
const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y);

/** Área com sinal do triângulo (fórmula do laço; o sinal depende do sentido dos eixos). */
function area(p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) {
  return ((q.x - p.x) * (r.y - p.y) - (r.x - p.x) * (q.y - p.y)) / 2;
}

function single(piece: Piece) {
  const mesh = meshPiece(piece, { spacing: 30 });
  const n = mesh.positions.length / 2;
  return { mesh, n, uv: garmentUv([mesh], new Map([[mesh.pieceId, 0]]), n) };
}

describe("garmentUv", () => {
  it("guarda as distâncias do molde (tecido no tamanho real)", () => {
    const { mesh, uv } = single(peca("frente"));
    for (let e = 0; e < mesh.edges.length; e += 2) {
      const i = mesh.edges[e]!;
      const j = mesh.edges[e + 1]!;
      expect(dist(uvAt(uv, i), uvAt(uv, j))).toBeCloseTo(dist(xy(mesh, i), xy(mesh, j)), 2);
    }
  });

  it("põe o fio ao longo de v", () => {
    const piece = peca("frente", 30);
    const { mesh, uv } = single(piece);
    // Dois vértices quaisquer: a diferença em v é a projeção no fio.
    const g = mesh.grain;
    const i = 0;
    const j = mesh.boundaryCount + 3;
    const d = { x: xy(mesh, j).x - xy(mesh, i).x, y: xy(mesh, j).y - xy(mesh, i).y };
    expect(uvAt(uv, j).y - uvAt(uv, i).y).toBeCloseTo(d.x * g.x + d.y * g.y, 2);
    expect(g.x).toBeCloseTo(Math.sin(Math.PI / 6), 6);
  });

  it("não espelha a peça vista como imagem (v para cima, molde com Y para baixo)", () => {
    for (const angle of [0, 30, 90, 145]) {
      const { mesh, uv } = single(peca("frente", angle));
      for (let t = 0; t < mesh.triangles.length; t += 3) {
        const [a, b, c] = [mesh.triangles[t]!, mesh.triangles[t + 1]!, mesh.triangles[t + 2]!];
        const flat = area(xy(mesh, a), xy(mesh, b), xy(mesh, c));
        const img = (k: number) => ({ x: uvAt(uv, k).x, y: -uvAt(uv, k).y });
        expect(Math.sign(area(img(a), img(b), img(c)))).toBe(Math.sign(flat));
      }
    }
  });

  it("segue a ordem da simulação (pieceOffset) com várias partes", () => {
    const a = meshPiece(peca("a"), { spacing: 40 });
    const b = meshPiece(peca("b", 0), { spacing: 40 });
    const na = a.positions.length / 2;
    const nb = b.positions.length / 2;
    const uv = garmentUv([a, b], new Map([["b", 0], ["a", nb]]), na + nb);
    expect(uvAt(uv, 0).y).toBeCloseTo(b.grainCoords[0]!, 3);
    expect(uvAt(uv, nb).y).toBeCloseTo(a.grainCoords[0]!, 3);
    expect(uvAt(uv, nb).x).toBeCloseTo(a.grainCoords[1]!, 3);
  });

  it("peça aberta pela dobra: UV contínuo e simétrico pela dobra", () => {
    const half: Piece = {
      ...peca("meia", 0),
      points: { A: { x: 0, y: 0 }, B: { x: 200, y: 0 }, C: { x: 240, y: 500 }, D: { x: 0, y: 500 } },
      fold: 3,
      grainline: { from: { x: 0, y: 50 }, to: { x: 0, y: 450 } },
    };
    const open = unfoldPiece(half);
    const mesh = meshPiece(open.piece, { spacing: 30, mirror: open.fold });
    const n = mesh.positions.length / 2;
    const uv = garmentUv([mesh], new Map([[mesh.pieceId, 0]]), n);
    // Com o fio sobre a dobra, cada vértice tem o espelho em u (−u) com o mesmo v.
    const key = (u: number, v: number) => `${Math.round(u)}:${Math.round(v)}`;
    const seen = new Set<string>();
    for (let i = 0; i < n; i++) seen.add(key(uv[i * 2]!, uv[i * 2 + 1]!));
    for (let i = 0; i < n; i++) expect(seen.has(key(-uv[i * 2]!, uv[i * 2 + 1]!))).toBe(true);
  });

  it("recusa parte fora da simulação", () => {
    const { mesh, n } = single(peca("frente"));
    expect(() => garmentUv([mesh], new Map(), n)).toThrow(/não está na simulação/);
    expect(() => garmentUv([mesh], new Map([[mesh.pieceId, 1]]), n)).toThrow(/passa do fim/);
  });
});
