import { describe, expect, it } from "vitest";
import { emptyDocument, garmentAtSize, stepGrading, type PatternDocument, type Piece } from "@alinhavo/geometry";
import { createMannequin } from "./body/mannequin";
import { floorCollider } from "./collider";
import { FABRICS } from "./fabrics";
import { meshPiece } from "./mesh";
import { angleAtArc, anchorHeight, bodyEllipse, legAt, pieceHalf, placeGarment, PLACEMENT_CLEARANCE } from "./place";
import { createSimulation } from "./simulation";

const BODY = { busto: 880, cintura: 720, quadril: 900, altura: 1650 };

/** A saia de exemplo do app: meia frente e meias costas na dobra, laterais costuradas. */
function saia(): PatternDocument {
  const sizes = ["P", "M", "G"];
  const doc = emptyDocument(sizes, "M");
  const g = (x: number, y: number) => stepGrading(sizes, "M", { x, y });
  doc.pieces = [
    {
      id: "frente",
      name: "Frente",
      points: { A: { x: 0, y: 0 }, B: { x: 180, y: 0 }, C: { x: 230, y: 600 }, D: { x: 0, y: 600 } },
      start: "A",
      outline: [
        { kind: "line", to: "B" },
        { kind: "cubic", c1: { x: 215, y: 80 }, c2: { x: 235, y: 200 }, to: "C" },
        { kind: "line", to: "D" },
        { kind: "line", to: "A" },
      ],
      grading: { B: g(10, 0), C: g(12, 15), D: g(0, 15) },
      seamAllowance: 10,
      seamAllowanceByEdge: { 2: 30, 3: 0 },
      grainline: { from: { x: 80, y: 120 }, to: { x: 80, y: 480 } },
      fold: 3,
      placement: { side: "frente", anchor: "cintura", offset: 0 },
    },
    {
      id: "costas",
      name: "Costas",
      points: { A: { x: 320, y: 0 }, B: { x: 510, y: 10 }, C: { x: 560, y: 600 }, D: { x: 320, y: 600 } },
      start: "A",
      outline: [
        { kind: "line", to: "B" },
        { kind: "cubic", c1: { x: 545, y: 90 }, c2: { x: 565, y: 210 }, to: "C" },
        { kind: "line", to: "D" },
        { kind: "line", to: "A" },
      ],
      grading: { B: g(10, 0), C: g(12, 15), D: g(0, 15) },
      seamAllowance: 10,
      seamAllowanceByEdge: { 2: 30, 3: 0 },
      fold: 3,
      placement: { side: "costas", anchor: "cintura", offset: 0 },
    },
  ];
  doc.seams = [{ id: "costura1", a: { piece: "frente", segment: 1 }, b: { piece: "costas", segment: 1 }, direction: "same" }];
  return doc;
}

function rect(id: string, w: number, h: number): Piece {
  return {
    id,
    name: id,
    start: "A",
    points: { A: { x: 0, y: 0 }, B: { x: w, y: 0 }, C: { x: w, y: h }, D: { x: 0, y: h } },
    outline: ["B", "C", "D", "A"].map((to) => ({ kind: "line" as const, to })),
    seamAllowance: 0,
  };
}

describe("angleAtArc", () => {
  it("num círculo, andar s mm muda o ângulo em s/r (positivo anda para trás)", () => {
    expect(angleAtArc(100, 100, 1, 50)).toBeCloseTo(1 - 0.5, 3);
    expect(angleAtArc(100, 100, 1, -50)).toBeCloseTo(1 + 0.5, 3);
    expect(angleAtArc(100, 100, 1, 0)).toBe(1);
  });
});

describe("placeGarment", () => {
  const body = createMannequin(BODY);
  const L = body.landmarks;

  it("a borda de cima fica na altura escolhida e o centro da parte no lado escolhido", () => {
    const mesh = meshPiece(rect("p", 300, 400), { spacing: 25 });
    const [front] = placeGarment([{ mesh, placement: { side: "frente", anchor: "cintura", offset: 10 } }], L);
    const [back] = placeGarment([{ mesh, placement: { side: "costas", anchor: "quadril", offset: 0 } }], L);
    let topFront = -Infinity;
    let topBack = -Infinity;
    for (let i = 0; i < mesh.positions.length / 2; i++) {
      topFront = Math.max(topFront, front![i * 3 + 1]!);
      topBack = Math.max(topBack, back![i * 3 + 1]!);
    }
    expect(topFront).toBeCloseTo(anchorHeight(L, "cintura") + 10, 6);
    expect(topBack).toBeCloseTo(L.hip.y, 6);
    // O vértice no meio da largura fica na frente (z > 0, x ≈ 0) e, nas costas, atrás.
    const mid = Array.from({ length: mesh.positions.length / 2 }, (_, i) => i).find(
      (i) => mesh.positions[i * 2] === 150 && mesh.positions[i * 2 + 1] === 0,
    )!;
    expect(Math.abs(front![mid * 3]!)).toBeLessThan(1);
    expect(front![mid * 3 + 2]!).toBeGreaterThan(L.waist.halfDepth);
    expect(back![mid * 3 + 2]!).toBeLessThan(-L.hip.halfDepth);
    // Quem olha a frente vê a direita do molde no lado esquerdo do corpo (+X).
    const right = Array.from({ length: mesh.positions.length / 2 }, (_, i) => i).find(
      (i) => mesh.positions[i * 2] === 300 && mesh.positions[i * 2 + 1] === 0,
    )!;
    expect(front![right * 3]!).toBeGreaterThan(0);
    expect(back![right * 3]!).toBeLessThan(0);
  });

  it("a parte começa sem esticar na horizontal e fora do corpo", () => {
    const mesh = meshPiece(rect("p", 300, 400), { spacing: 20 });
    const [pos] = placeGarment([{ mesh, placement: { side: "frente", anchor: "busto", offset: 0 } }], L);
    // Borda de cima (v = 0): soma dos trechos em 3D = comprimento no molde.
    const top = Array.from({ length: mesh.boundaryCount }, (_, i) => i)
      .filter((i) => mesh.positions[i * 2 + 1] === 0)
      .sort((a, b) => mesh.positions[a * 2]! - mesh.positions[b * 2]!);
    let length3d = 0;
    for (let k = 1; k < top.length; k++) {
      const [a, b] = [top[k - 1]!, top[k]!];
      length3d += Math.hypot(pos![a * 3]! - pos![b * 3]!, pos![a * 3 + 2]! - pos![b * 3 + 2]!);
    }
    expect(length3d / 300).toBeGreaterThan(0.99);
    expect(length3d / 300).toBeLessThanOrEqual(1);
    for (let i = 0; i < mesh.positions.length / 2; i++) {
      expect(body.collider.query(pos![i * 3]!, pos![i * 3 + 1]!, pos![i * 3 + 2]!).distance).toBeGreaterThan(PLACEMENT_CLEARANCE / 2);
    }
  });
});

describe("cortar par e perna", () => {
  const body = createMannequin(BODY);
  const L = body.landmarks;

  it("a metade do par: perna da posição; sem perna, a desenhada à esquerda e a cópia à direita", () => {
    const p = rect("frente", 200, 300);
    expect(pieceHalf(p)).toBeUndefined();
    expect(pieceHalf({ ...p, cutPair: true })).toBe("esquerda");
    expect(pieceHalf({ ...p, id: "frente~par" })).toBe("direita");
    expect(pieceHalf({ ...p, cutPair: true, placement: { side: "frente", anchor: "cintura", offset: 0, leg: "direita" } })).toBe("direita");
  });

  it("parte de par fica na sua metade: frente esquerda entre o centro e a lateral esquerda", () => {
    const mesh = meshPiece(rect("p", 200, 150), { spacing: 25 });
    const [esq] = placeGarment([{ mesh, placement: { side: "frente", anchor: "cintura", offset: 0 }, half: "esquerda" }], L);
    const [dir] = placeGarment([{ mesh, placement: { side: "frente", anchor: "cintura", offset: 0 }, half: "direita" }], L);
    let xe = 0;
    let xd = 0;
    const count = mesh.positions.length / 2;
    for (let i = 0; i < count; i++) {
      xe += esq![i * 3]!;
      xd += dir![i * 3]!;
    }
    expect(xe / count).toBeGreaterThan(50); // à esquerda do corpo (+X)
    expect(xd / count).toBeLessThan(-50);
  });

  it("abaixo do gancho a parte se enrola na perna, com folga, e acima dele no quadril", () => {
    const mesh = meshPiece(rect("p", 240, 700), { spacing: 25 });
    const [pos] = placeGarment([{ mesh, placement: { side: "frente", anchor: "cintura", offset: 0, leg: "esquerda" }, half: "esquerda" }], L);
    let legChecked = 0;
    for (let i = 0; i < mesh.positions.length / 2; i++) {
      const [x, y, z] = [pos![i * 3]!, pos![i * 3 + 1]!, pos![i * 3 + 2]!];
      if (y < L.crotch.y - 10) {
        const c = legAt(L, "esquerda", y);
        expect(Math.hypot(x - c.x, z - c.z)).toBeCloseTo(c.r + PLACEMENT_CLEARANCE, 6);
        legChecked++;
      }
    }
    expect(legChecked).toBeGreaterThan(50);
  });

  it("ombro é o alto da linha do ombro, junto do pescoço", () => {
    expect(anchorHeight(L, "ombro")).toBe(L.neck.y);
    expect(L.neck.y).toBeGreaterThan(L.shoulder.y);
  });

  it("da ponta do ombro ao pescoço a elipse afina como o corpo (a alça começa junto do pescoço)", () => {
    const at = (y: number) => bodyEllipse(L, y);
    expect(at(L.shoulder.y).a).toBeCloseTo(L.shoulder.halfWidth + PLACEMENT_CLEARANCE, 9);
    expect(at(L.neck.y).a).toBeCloseTo(L.neck.halfWidth + PLACEMENT_CLEARANCE, 9);
    expect(at(L.neck.y).b).toBeCloseTo(L.neck.halfDepth + PLACEMENT_CLEARANCE, 9);
    expect(at(L.neck.y + 100)).toEqual(at(L.neck.y));
    const mid = at((L.shoulder.y + L.neck.y) / 2);
    expect(mid.a).toBeLessThan(at(L.shoulder.y).a);
    expect(mid.a).toBeGreaterThan(at(L.neck.y).a);
  });
});

describe("a saia de exemplo no manequim", () => {
  it("as laterais se costuram, a saia fica na cintura e não atravessa o corpo", () => {
    const body = createMannequin(BODY);
    const { pieces, seams } = garmentAtSize(saia(), "M");
    const meshes = pieces.map((p) => meshPiece(p, { spacing: 30 }));
    const initial = placeGarment(
      meshes.map((mesh, i) => ({ mesh, placement: pieces[i]!.placement! })),
      body.landmarks,
    );
    // As metades costuradas são as do mesmo lado do corpo: o vão inicial é só a folga da posição.
    const sim = createSimulation(
      meshes.map((mesh, i) => ({ mesh, initial: initial[i] })),
      { fabric: FABRICS.planoLeve, seams, colliders: [body.collider, floorCollider(0)], iterations: 2 },
    );
    expect(sim.seamGap()).toBeLessThan(150);
    // 4 s: a barra balança e assenta (o movimento cai abaixo de 0,5 mm por quadro por volta de 3,5 s).
    for (let f = 0; f < 240; f++) sim.step();

    expect(sim.positions.every(Number.isFinite)).toBe(true);
    expect(sim.seamGap()).toBeLessThan(1);
    let top = -Infinity;
    let closest = Infinity;
    for (let i = 0; i < sim.vertexCount; i++) {
      const [x, y, z] = [sim.positions[i * 3]!, sim.positions[i * 3 + 1]!, sim.positions[i * 3 + 2]!];
      top = Math.max(top, y);
      closest = Math.min(closest, body.collider.query(x, y, z).distance);
    }
    // Presa entre a cintura e o quadril (não escorrega para o chão).
    expect(top).toBeLessThan(body.landmarks.waist.y + 5);
    expect(top).toBeGreaterThan(body.landmarks.waist.y - 100);
    expect(closest).toBeGreaterThan(FABRICS.planoLeve.thickness - 0.05);
    // E parada: quase não se mexe no último quadro.
    const before = Float64Array.from(sim.positions);
    sim.step();
    expect(sim.positions.reduce((m, p, i) => Math.max(m, Math.abs(p - before[i]!)), 0)).toBeLessThan(0.5);
  }, 120_000); // simulação de 4 s: teste de integração mais lento (com folga para o check, que roda os pacotes juntos)
});
