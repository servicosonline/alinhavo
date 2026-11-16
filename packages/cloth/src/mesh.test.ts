import { describe, expect, it } from "vitest";
import { flattenOutline, polygonArea, stepGrading, unfoldPiece, type Piece, type Point } from "@alinhavo/geometry";
import { insidePolygon, meshPiece, type PieceMesh } from "./mesh";

/** Frente reta 200×600 com fio vertical, graduada em P/M/G (+10 mm de largura por tamanho). */
function frente(): Piece {
  const g = (x: number, y: number) => stepGrading(["P", "M", "G"], "M", { x, y });
  return {
    id: "frente",
    name: "Frente",
    points: { A: { x: 0, y: 0 }, B: { x: 200, y: 0 }, C: { x: 200, y: 600 }, D: { x: 0, y: 600 } },
    start: "A",
    outline: [
      { kind: "line", to: "B" },
      { kind: "line", to: "C" },
      { kind: "line", to: "D" },
      { kind: "line", to: "A" },
    ],
    grading: { B: g(10, 0), C: g(10, 0) },
    seamAllowance: 10,
    grainline: { from: { x: 100, y: 100 }, to: { x: 100, y: 500 } },
  };
}

/** Costas com lateral curva (convexa). */
function costas(): Piece {
  return {
    id: "costas",
    name: "Costas",
    points: { A: { x: 0, y: 0 }, B: { x: 200, y: 0 }, C: { x: 220, y: 600 }, D: { x: 0, y: 600 } },
    start: "A",
    outline: [
      { kind: "line", to: "B" },
      { kind: "cubic", c1: { x: 230, y: 100 }, c2: { x: 230, y: 300 }, to: "C" },
      { kind: "line", to: "D" },
      { kind: "line", to: "A" },
    ],
    seamAllowance: 10,
  };
}

/** Peça côncava em L, com fio a 45°. */
function emL(): Piece {
  return {
    id: "l",
    name: "Peça em L",
    points: {
      A: { x: 0, y: 0 },
      B: { x: 300, y: 0 },
      C: { x: 300, y: 100 },
      D: { x: 100, y: 100 },
      E: { x: 100, y: 300 },
      F: { x: 0, y: 300 },
    },
    start: "A",
    outline: ["B", "C", "D", "E", "F", "A"].map((to) => ({ kind: "line" as const, to })),
    seamAllowance: 0,
    grainline: { from: { x: 0, y: 0 }, to: { x: 100, y: 100 } },
  };
}

const vertex = (m: PieceMesh, i: number): Point => ({ x: m.positions[i * 2]!, y: m.positions[i * 2 + 1]! });

function triangleList(m: PieceMesh): Point[][] {
  const out: Point[][] = [];
  for (let k = 0; k < m.triangles.length; k += 3) {
    out.push([vertex(m, m.triangles[k]!), vertex(m, m.triangles[k + 1]!), vertex(m, m.triangles[k + 2]!)]);
  }
  return out;
}

function minAngleDeg([a, b, c]: Point[]): number {
  const ang = (p: Point, q: Point, r: Point) => {
    const u = { x: q.x - p.x, y: q.y - p.y };
    const v = { x: r.x - p.x, y: r.y - p.y };
    return Math.acos((u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)));
  };
  return (Math.min(ang(a!, b!, c!), ang(b!, c!, a!), ang(c!, a!, b!)) * 180) / Math.PI;
}

const sum = (arr: Float64Array) => arr.reduce((s, x) => s + x, 0);

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const u = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - a.x - dx * u, p.y - a.y - dy * u);
}

describe("meshPiece", () => {
  it("cobre exatamente a linha de costura (sem a margem)", () => {
    for (const piece of [frente(), costas(), emL()]) {
      const m = meshPiece(piece);
      const sewArea = polygonArea(flattenOutline(piece).polygon);
      // A borda reamostrada corta as curvas por cordas de ~1 cm: diferença pequena só na peça curva.
      expect(sum(m.restArea) / sewArea).toBeCloseTo(1, 2);
    }
    expect(sum(meshPiece(frente()).restArea)).toBeCloseTo(200 * 600, 6);
  });

  it("todos os triângulos com área positiva e dentro da peça", () => {
    for (const piece of [frente(), costas(), emL()]) {
      const m = meshPiece(piece);
      const border = Array.from({ length: m.boundaryCount }, (_, i) => vertex(m, i));
      for (let k = 0; k < m.restArea.length; k++) expect(m.restArea[k]).toBeGreaterThan(0);
      for (const [a, b, c] of triangleList(m)) {
        const centroid = { x: (a!.x + b!.x + c!.x) / 3, y: (a!.y + b!.y + c!.y) / 3 };
        expect(insidePolygon(centroid, border)).toBe(true);
      }
    }
  });

  it("a peça côncava não ganha triângulos no recorte do L", () => {
    const m = meshPiece(emL());
    for (const [a, b, c] of triangleList(m)) {
      const centroid = { x: (a!.x + b!.x + c!.x) / 3, y: (a!.y + b!.y + c!.y) / 3 };
      expect(centroid.x > 100 && centroid.y > 100).toBe(false);
    }
    expect(sum(m.restArea)).toBeCloseTo(300 * 100 + 100 * 200, 6);
  });

  it("a borda começa no ponto inicial, mantém as quinas e guarda o segmento de origem", () => {
    const m = meshPiece(frente());
    // 200/10 + 600/10 + 200/10 + 600/10 pontos, um por cm.
    expect(m.boundaryCount).toBe(160);
    expect(vertex(m, 0)).toEqual({ x: 0, y: 0 });
    const corners = [0, 20, 80, 100].map((i) => vertex(m, i));
    expect(corners).toEqual([
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 600 },
      { x: 0, y: 600 },
    ]);
    expect(Array.from(m.boundarySegment.slice(18, 22))).toEqual([0, 0, 1, 1]);
    expect(m.boundaryT[20]).toBe(0);
    expect(m.boundaryT[30]).toBeCloseTo(10 / 60, 12);
  });

  it("cada aresta da borda é uma aresta da malha", () => {
    const m = meshPiece(costas());
    const edges = new Set<string>();
    for (let k = 0; k < m.edges.length; k += 2) edges.add(`${m.edges[k]}-${m.edges[k + 1]}`);
    for (let i = 0; i < m.boundaryCount; i++) {
      const j = (i + 1) % m.boundaryCount;
      expect(edges.has(`${Math.min(i, j)}-${Math.max(i, j)}`)).toBe(true);
    }
  });

  it("triângulos regulares: sem lascas e sem arestas compridas", () => {
    for (const piece of [frente(), costas(), emL()]) {
      const m = meshPiece(piece, { spacing: 10 });
      const tris = triangleList(m);
      const worst = Math.min(...tris.map(minAngleDeg));
      expect(worst).toBeGreaterThan(25);
      for (let k = 0; k < m.edges.length; k += 2) {
        const len = Math.hypot(
          m.positions[m.edges[k]! * 2]! - m.positions[m.edges[k + 1]! * 2]!,
          m.positions[m.edges[k]! * 2 + 1]! - m.positions[m.edges[k + 1]! * 2 + 1]!,
        );
        expect(len).toBeLessThan(10 * 1.6);
      }
    }
  });

  it("a grade interna segue o fio", () => {
    const m = meshPiece(emL());
    expect(m.grain.x).toBeCloseTo(Math.SQRT1_2, 12);
    expect(m.grain.y).toBeCloseTo(Math.SQRT1_2, 12);
    // Coordenadas no fio = projeção nos eixos urdume/trama.
    const i = m.boundaryCount + 5;
    const p = vertex(m, i);
    expect(m.grainCoords[i * 2]).toBeCloseTo((p.x + p.y) * Math.SQRT1_2, 9);
    expect(m.grainCoords[i * 2 + 1]).toBeCloseTo((p.y - p.x) * Math.SQRT1_2, 9);
  });

  it("o miolo fica na grade do fio: vizinhos a exatamente um espaçamento ao longo do urdume", () => {
    for (const piece of [frente(), emL()]) {
      const m = meshPiece(piece, { spacing: 10 });
      const border = Array.from({ length: m.boundaryCount }, (_, i) => vertex(m, i));
      const farFromBorder = (i: number) => {
        const p = vertex(m, i);
        // Além da faixa suavizada (1,6 espaçamento) mais um espaçamento para o vizinho.
        return border.every((_, k) => distToSegment(p, border[k]!, border[(k + 1) % border.length]!) > 10 * 3);
      };
      const interior = Array.from({ length: m.positions.length / 2 - m.boundaryCount }, (_, k) => k + m.boundaryCount);
      const core = interior.filter(farFromBorder);
      expect(core.length).toBeGreaterThan(50);
      const hasNeighbor = (a: number, step: number) =>
        interior.some(
          (b) =>
            Math.abs(m.grainCoords[b * 2]! - m.grainCoords[a * 2]! - step) < 1e-6 &&
            Math.abs(m.grainCoords[b * 2 + 1]! - m.grainCoords[a * 2 + 1]!) < 1e-6,
        );
      for (const a of core) {
        expect(hasNeighbor(a, 10)).toBe(true);
        expect(hasNeighbor(a, -10)).toBe(true);
      }
    }
  });

  it("sem fio marcado, usa o fio vertical", () => {
    expect(meshPiece(costas()).grain).toEqual({ x: 0, y: 1 });
  });

  it("gera a parte no tamanho pedido", () => {
    expect(sum(meshPiece(frente(), { size: "G" }).restArea)).toBeCloseTo(210 * 600, 6);
    expect(sum(meshPiece(frente(), { size: "P" }).restArea)).toBeCloseTo(190 * 600, 6);
  });

  it("o mesmo molde gera sempre a mesma malha", () => {
    const a = meshPiece(costas());
    const b = meshPiece(costas());
    expect(Array.from(a.triangles)).toEqual(Array.from(b.triangles));
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
  });

  it("espaçamento menor gera malha mais fina", () => {
    const fina = meshPiece(frente(), { spacing: 5 });
    const grossa = meshPiece(frente(), { spacing: 20 });
    expect(fina.restArea.length).toBeGreaterThan(grossa.restArea.length * 10);
  });

  it("recusa peça pequena demais e espaçamento fora da faixa", () => {
    const mini: Piece = {
      ...frente(),
      points: { A: { x: 0, y: 0 }, B: { x: 3, y: 0 }, C: { x: 3, y: 3 }, D: { x: 0, y: 3 } },
      grading: undefined,
    };
    expect(() => meshPiece(mini)).toThrow(/pequena demais/);
    expect(() => meshPiece(frente(), { spacing: 0.5 })).toThrow(/espaçamento/);
    expect(() => meshPiece(frente(), { spacing: 500 })).toThrow(/espaçamento/);
  });
});

/** Meio top de alças na dobra (segmento 5, de C a N, em x = 0), com o fio dado. */
function meioTop(grainline: Piece["grainline"]): Piece {
  return {
    id: "top",
    name: "Top",
    points: { N: { x: 0, y: 150 }, S1: { x: 85, y: 0 }, S2: { x: 125, y: 0 }, A: { x: 235, y: 175 }, H: { x: 225, y: 400 }, C: { x: 0, y: 400 } },
    start: "N",
    outline: [
      { kind: "cubic", c1: { x: 50, y: 150 }, c2: { x: 85, y: 60 }, to: "S1" },
      { kind: "line", to: "S2" },
      { kind: "cubic", c1: { x: 130, y: 110 }, c2: { x: 200, y: 175 }, to: "A" },
      { kind: "line", to: "H" },
      { kind: "line", to: "C" },
      { kind: "line", to: "N" },
    ],
    seamAllowance: 10,
    fold: 5,
    grainline,
  };
}

/** Quantos vértices e triângulos da malha não têm o espelho pela linha `from`–`to`. */
function mirrorMismatch(m: PieceMesh, from: Point, to: Point) {
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const u = { x: (to.x - from.x) / len, y: (to.y - from.y) / len };
  const reflect = (p: Point) => {
    const t = (p.x - from.x) * u.x + (p.y - from.y) * u.y;
    return { x: 2 * (from.x + t * u.x) - p.x, y: 2 * (from.y + t * u.y) - p.y };
  };
  const n = m.positions.length / 2;
  const twin = new Int32Array(n).fill(-1);
  let vertices = 0;
  for (let i = 0; i < n; i++) {
    const r = reflect(vertex(m, i));
    for (let j = 0; j < n; j++) if (Math.hypot(r.x - m.positions[j * 2]!, r.y - m.positions[j * 2 + 1]!) < 1e-6) twin[i] = j;
    if (twin[i]! < 0) vertices++;
  }
  const key = (a: number, b: number, c: number) => [a, b, c].sort((p, q) => p - q).join(",");
  const tris = new Set<string>();
  for (let k = 0; k < m.triangles.length; k += 3) tris.add(key(m.triangles[k]!, m.triangles[k + 1]!, m.triangles[k + 2]!));
  let triangles = 0;
  for (let k = 0; k < m.triangles.length; k += 3) {
    const [a, b, c] = [twin[m.triangles[k]!]!, twin[m.triangles[k + 1]!]!, twin[m.triangles[k + 2]!]!];
    if (a < 0 || b < 0 || c < 0 || !tris.has(key(a, b, c))) triangles++;
  }
  return { vertices, triangles };
}

describe("meshPiece com eixo de simetria (peça aberta pela dobra)", () => {
  it.each([
    ["fio paralelo à dobra", { from: { x: 60, y: 200 }, to: { x: 60, y: 360 } }],
    ["fio a 30°", { from: { x: 0, y: 0 }, to: { x: 50, y: 86.6 } }],
  ] as const)("a malha sai espelhada pela dobra, vértice a vértice e triângulo a triângulo (%s)", (_, grainline) => {
    const { piece, fold } = unfoldPiece(meioTop(grainline));
    const m = meshPiece(piece, { spacing: 30, mirror: fold });
    expect(mirrorMismatch(m, fold!.from, fold!.to)).toEqual({ vertices: 0, triangles: 0 });
    // Continua uma malha boa: cobre a peça e nenhum triângulo degenerado.
    expect(sum(m.restArea) / polygonArea(flattenOutline(piece).polygon)).toBeCloseTo(1, 2);
    for (const tri of triangleList(m)) expect(minAngleDeg(tri)).toBeGreaterThan(10);
  });

  it("os pontos internos também ficam a mais de meio espaçamento da borda e longe uns dos outros", () => {
    const { piece, fold } = unfoldPiece(meioTop({ from: { x: 60, y: 200 }, to: { x: 60, y: 360 } }));
    const m = meshPiece(piece, { spacing: 30, mirror: fold });
    const n = m.positions.length / 2;
    for (let i = m.boundaryCount; i < n; i++) {
      for (let j = i + 1; j < n; j++) expect(Math.hypot(m.positions[i * 2]! - m.positions[j * 2]!, m.positions[i * 2 + 1]! - m.positions[j * 2 + 1]!)).toBeGreaterThan(10);
    }
  });

  it("recusa eixo de um ponto só", () => {
    const { piece } = unfoldPiece(meioTop(undefined));
    expect(() => meshPiece(piece, { mirror: { from: { x: 0, y: 0 }, to: { x: 0, y: 0 } } })).toThrow(/eixo/);
  });
});

describe("lados retos e compridos (manga longa)", () => {
  it("gera a malha mesmo quando a borda fica exatamente em linha com uma aresta", () => {
    // A manga longa do app com a barra de 19 cm: o Constrainautor recusava
    // ("Constraining edge intersects point") antes da segunda tentativa.
    const line = (to: string) => ({ kind: "line" as const, to });
    const manga: Piece = {
      id: "manga",
      name: "Manga",
      points: { T: { x: 0, y: 0 }, B1: { x: 175, y: 95 }, C1: { x: 95, y: 580 }, C2: { x: -95, y: 580 }, B2: { x: -175, y: 95 } },
      start: "T",
      outline: [
        { kind: "cubic", c1: { x: 74, y: 0 }, c2: { x: 142, y: 46 }, to: "B1" },
        line("C1"),
        line("C2"),
        line("B2"),
        { kind: "cubic", c1: { x: -142, y: 46 }, c2: { x: -74, y: 0 }, to: "T" },
      ],
      seamAllowance: 10,
    };
    const mesh = meshPiece(manga, { spacing: 30 });
    expect(mesh.triangles.length).toBeGreaterThan(0);
    // A malha cobre a peça inteira (a área dos triângulos é a do contorno).
    const area = Array.from(mesh.restArea).reduce((a, b) => a + b, 0);
    expect(Math.abs(area - Math.abs(polygonArea(flattenOutline(manga).polygon))) / area).toBeLessThan(0.01);
  });
});
