import { cutPieces, polygonArea, type Point } from "@alinhavo/geometry";
import { saia } from "./fixture";
import { FillRule, area, intersect, union, type Path64 } from "clipper2-ts";
import { describe, expect, it } from "vitest";
import { applyAffine, convexParts, nest, placedOutline, type NestOptions, type NestPiece, type NestResult } from "./nest";
import { patternNestPieces } from "./pattern";

const rect = (w: number, h: number): Point[] => [
  { x: 0, y: 0 },
  { x: w, y: 0 },
  { x: w, y: h },
  { x: 0, y: h },
];

/** Gerador pseudoaleatório fixo (testes repetíveis). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Polígono em estrela (côncavo), raio entre r/2 e r. */
function star(rand: () => number, r: number, n: number): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = r * (0.5 + 0.5 * rand());
    return { x: Math.cos(a) * k, y: Math.sin(a) * k };
  });
}

const toInt = (pts: Point[]): Path64 => pts.map((p) => ({ x: Math.round(p.x * 100), y: Math.round(p.y * 100) }));

/** Confere as regras que todo risco precisa cumprir. */
function expectValid(pieces: readonly NestPiece[], options: NestOptions, result: NestResult) {
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const outlines = result.placements.map((pl) => placedOutline(byId.get(pl.pieceId)!, pl));
  const eps = 1e-6;

  // Dentro do tecido.
  for (const o of outlines) {
    for (const p of o) {
      expect(p.x).toBeGreaterThanOrEqual(-eps);
      expect(p.y).toBeGreaterThanOrEqual(-eps);
      expect(p.y).toBeLessThanOrEqual(options.widthMm + eps);
      expect(p.x).toBeLessThanOrEqual(result.lengthMm + eps);
    }
  }

  // Ninguém sobrepõe ninguém (área de interseção nula, em 0,01 mm).
  const ints = outlines.map(toInt);
  for (let i = 0; i < ints.length; i++) {
    for (let j = i + 1; j < ints.length; j++) {
      const inter = intersect([ints[i]!], [ints[j]!], FillRule.NonZero);
      const a = inter.reduce((s, p) => s + Math.abs(area(p)), 0);
      expect(a, `peças ${i} e ${j} se sobrepõem`).toBe(0);
    }
  }

  // Cada cópia aparece uma vez (posta ou de fora).
  const seen = [...result.placements, ...result.unplaced].map((p) => `${p.pieceId}#${p.copy}`);
  const expected = pieces.flatMap((p) => Array.from({ length: p.quantity }, (_, c) => `${p.id}#${c}`));
  expect([...seen].sort()).toEqual([...expected].sort());

  // Fio paralelo ao comprimento; espelho só onde pedido; sem giro em tecido com sentido.
  for (const pl of result.placements) {
    const piece = byId.get(pl.pieceId)!;
    const t = { ...pl.transform, tx: 0, ty: 0 };
    const g = applyAffine(t, piece.grain);
    const len = Math.hypot(piece.grain.x, piece.grain.y);
    expect(Math.abs(g.y) / len).toBeLessThan(1e-9);
    expect(Math.sign(g.x)).toBe(pl.rotation === 0 ? 1 : -1);
    if (options.oneWay) expect(pl.rotation).toBe(0);
    const det = pl.transform.a * pl.transform.d - pl.transform.b * pl.transform.c;
    expect(det).toBeCloseTo(pl.mirrored ? -1 : 1, 9);
    expect(pl.mirrored).toBe(piece.mirrored === true);
  }

  // Aproveitamento coerente.
  const area0 = result.placements.reduce((s, pl) => s + polygonArea(byId.get(pl.pieceId)!.outline as Point[]), 0);
  expect(result.piecesAreaMm2).toBeCloseTo(area0, 6);
  expect(result.efficiency).toBeGreaterThan(0);
  expect(result.efficiency).toBeLessThanOrEqual(1);
}

describe("nest", () => {
  it("encaixa retângulos em fileiras sem desperdício além da tolerância", () => {
    const pieces: NestPiece[] = [{ id: "r", outline: rect(400, 100), grain: { x: 1, y: 0 }, quantity: 4 }];
    const options = { widthMm: 210 };
    const r = nest(pieces, options);
    expectValid(pieces, options, r);
    expect(r.unplaced).toEqual([]);
    // Duas fileiras de duas: 800 mm mais a folga da tolerância.
    expect(r.lengthMm).toBeGreaterThanOrEqual(800);
    expect(r.lengthMm).toBeLessThan(805);
  });

  it("alinha o fio da peça ao comprimento do tecido", () => {
    // Fio na diagonal: a peça entra girada 45°.
    const pieces: NestPiece[] = [{ id: "d", outline: rect(300, 100), grain: { x: 1, y: 1 }, quantity: 2 }];
    const options = { widthMm: 1000 };
    const r = nest(pieces, options);
    expectValid(pieces, options, r);
  });

  it("formas côncavas: nada sobrepõe, nada sai do tecido, a conta fecha", () => {
    const rand = rng(7);
    const pieces: NestPiece[] = Array.from({ length: 6 }, (_, i) => ({
      id: `s${i}`,
      outline: star(rand, 60 + 60 * rand(), 9 + i),
      grain: { x: rand() - 0.5, y: 1 },
      mirrored: i % 2 === 1,
      quantity: 1 + (i % 3),
    }));
    for (const options of [{ widthMm: 500 }, { widthMm: 400, gapMm: 3, oneWay: true }] satisfies NestOptions[]) {
      const r = nest(pieces, options);
      expectValid(pieces, options, r);
      expect(r.unplaced).toEqual([]);
    }
  });

  it("respeita a folga entre peças e na borda", () => {
    const pieces: NestPiece[] = [{ id: "r", outline: rect(200, 100), grain: { x: 1, y: 0 }, quantity: 2 }];
    const r = nest(pieces, { widthMm: 300, gapMm: 10 });
    const [a, b] = r.placements.map((pl) => placedOutline(pieces[0]!, pl));
    const ys = (o: Point[]) => o.map((p) => p.y);
    // Uma sobre a outra: pelo menos 10 mm entre elas e 5 mm da borda.
    const lower = Math.min(...ys(a!)) < Math.min(...ys(b!)) ? a! : b!;
    const upper = lower === a ? b! : a!;
    expect(Math.min(...ys(upper)) - Math.max(...ys(lower))).toBeGreaterThanOrEqual(10);
    expect(Math.min(...ys(lower))).toBeGreaterThanOrEqual(5);
  });

  it("girar 180° deixa triângulos se completarem (tecido sem sentido rende mais)", () => {
    const tri: Point[] = [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 0, y: 200 },
    ];
    const pieces: NestPiece[] = [{ id: "t", outline: tri, grain: { x: 1, y: 0 }, quantity: 6 }];
    const twoWay = nest(pieces, { widthMm: 205 });
    const oneWay = nest(pieces, { widthMm: 205, oneWay: true });
    expectValid(pieces, { widthMm: 205 }, twoWay);
    expectValid(pieces, { widthMm: 205, oneWay: true }, oneWay);
    expect(twoWay.efficiency).toBeGreaterThan(oneWay.efficiency);
    expect(twoWay.placements.some((p) => p.rotation === 180)).toBe(true);
  });

  it("peça mais larga que o tecido fica de fora, sem travar as outras", () => {
    const pieces: NestPiece[] = [
      { id: "larga", outline: rect(100, 500), grain: { x: 1, y: 0 }, quantity: 1 },
      { id: "ok", outline: rect(100, 100), grain: { x: 1, y: 0 }, quantity: 1 },
    ];
    const r = nest(pieces, { widthMm: 300 });
    expect(r.unplaced).toEqual([{ pieceId: "larga", copy: 0 }]);
    expect(r.placements.map((p) => p.pieceId)).toEqual(["ok"]);
  });

  it("é determinístico", () => {
    const rand = rng(3);
    const pieces: NestPiece[] = Array.from({ length: 4 }, (_, i) => ({ id: `s${i}`, outline: star(rand, 80, 8), grain: { x: 0, y: 1 }, quantity: 2 }));
    expect(nest(pieces, { widthMm: 400 })).toEqual(nest(pieces, { widthMm: 400 }));
  });

  it("recusa largura e quantidade inválidas", () => {
    const piece: NestPiece = { id: "r", outline: rect(10, 10), grain: { x: 1, y: 0 }, quantity: 1 };
    expect(() => nest([piece], { widthMm: 0 })).toThrow();
    expect(() => nest([{ ...piece, quantity: 1.5 }], { widthMm: 100 })).toThrow();
    expect(() => nest([{ ...piece, grain: { x: 0, y: 0 } }], { widthMm: 100 })).toThrow();
  });
});

describe("convexParts", () => {
  it("divide uma forma côncava em partes convexas que cobrem exatamente a forma", () => {
    const rand = rng(11);
    for (let t = 0; t < 5; t++) {
      const poly = toInt(star(rand, 300, 12 + t * 5));
      const parts = convexParts(poly);
      expect(parts.length).toBeGreaterThan(1);
      expect(parts.length).toBeLessThan(poly.length);
      for (const p of parts) {
        for (let i = 0; i < p.length; i++) {
          const o = p[i]!, a = p[(i + 1) % p.length]!, b = p[(i + 2) % p.length]!;
          expect((a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)).toBeGreaterThanOrEqual(0);
        }
      }
      const sum = parts.reduce((s, p) => s + area(p), 0);
      expect(sum).toBeCloseTo(Math.abs(area(poly)), 0);
      // União das partes = a forma (sem sobra nem falta).
      const u = union(parts, FillRule.NonZero);
      expect(Math.abs(u.reduce((s, p) => s + area(p), 0))).toBeCloseTo(Math.abs(area(poly)), 0);
    }
  });
});

describe("patternNestPieces", () => {
  it("monta as peças da grade: dobra aberta, par espelhado, demanda por tamanho", () => {
    const doc = saia();
    const pieces = patternNestPieces(doc, { P: 1, M: 2, G: 0 });
    expect(pieces.map((p) => [p.id, p.quantity, p.mirrored])).toEqual([
      ["frente@P", 1, false],
      ["costas@P", 1, false],
      ["costas@P~par", 1, true],
      ["frente@M", 2, false],
      ["costas@M", 2, false],
      ["costas@M~par", 2, true],
    ]);
    // A área bate com a da ficha técnica (peça aberta, com margem).
    const cutM = cutPieces(doc, "M");
    expect(polygonArea(pieces[3]!.outline as Point[])).toBeCloseTo(cutM[0]!.cutArea, 6);
    // Frente com fio desenhado; costas sem fio = eixo Y do molde.
    expect(pieces[0]!.grain).toEqual({ x: 0, y: 400 });
    expect(pieces[1]!.grain).toEqual({ x: 0, y: 1 });
  });

  it("recusa tamanho que não existe e demanda inválida", () => {
    expect(() => patternNestPieces(saia(), { XG: 1 })).toThrow();
    expect(() => patternNestPieces(saia(), { M: -1 })).toThrow();
  });

  it("encaixa a grade da saia num tecido de 1,50 m", () => {
    const doc = saia();
    const pieces = patternNestPieces(doc, { P: 2, M: 3, G: 2 });
    const options = { widthMm: 1500 };
    const r = nest(pieces, options);
    expectValid(pieces, options, r);
    expect(r.unplaced).toEqual([]);
    expect(r.placements).toHaveLength(21);
    // A soma das áreas é a da ficha (peças × quantidade × demanda).
    const fichaArea = (["P", "M", "G"] as const).reduce(
      (s, size) => s + { P: 2, M: 3, G: 2 }[size] * cutPieces(doc, size).reduce((t, c) => t + c.cutArea * c.quantity, 0),
      0,
    );
    expect(r.piecesAreaMm2).toBeCloseTo(fichaArea, 3);
    // Peças de saia num risco largo: bem acima de metade de aproveitamento.
    expect(r.efficiency).toBeGreaterThan(0.6);
  });
});
