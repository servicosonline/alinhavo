import { validatePattern, type Piece } from "@alinhavo/geometry";
import { describe, expect, it } from "vitest";
import { photoSize, scannedDocument } from "./document";

const square = (size: number): Piece => ({
  id: "scan",
  name: "Peça escaneada",
  points: { p1: { x: 0, y: 0 }, p2: { x: size, y: 0 }, p3: { x: size, y: size }, p4: { x: 0, y: size } },
  start: "p1",
  outline: [
    { kind: "line", to: "p2" },
    { kind: "cubic", c1: { x: size + 10, y: size / 3 }, c2: { x: size + 10, y: (2 * size) / 3 }, to: "p3" },
    { kind: "line", to: "p4" },
    { kind: "line", to: "p1" },
  ],
  seamAllowance: 0,
});

describe("molde a partir do scan", () => {
  it("peças lado a lado, ids únicos, nomes e margem; documento válido", () => {
    const doc = scannedDocument(
      [
        { name: "Frente", piece: square(200) },
        { name: "  ", piece: square(100) },
      ],
      10,
    );
    expect(validatePattern(doc)).toEqual([]);
    expect(doc.pieces.map((p) => [p.id, p.name, p.seamAllowance])).toEqual([
      ["scan-1", "Frente", 10],
      ["scan-2", "Peça 2", 10],
    ]);
    // A segunda começa depois da primeira (largura + 50 mm + margens).
    expect(doc.pieces[1]!.points.p1!.x).toBe(200 + 50 + 20);
    const c = doc.pieces[1]!.outline[1]!;
    expect(c.kind === "cubic" && c.c1.x).toBe(270 + 110);
    expect(doc.sizes).toEqual(["P", "M", "G"]);
  });

  it("margem fora da faixa fica no limite; foto grande é reduzida sem aumentar a pequena", () => {
    expect(scannedDocument([{ name: "A", piece: square(10) }], 999).pieces[0]!.seamAllowance).toBe(50);
    expect(scannedDocument([{ name: "A", piece: square(10) }], -3).pieces[0]!.seamAllowance).toBe(0);
    expect(photoSize(4000, 3000)).toEqual({ width: 2400, height: 1800 });
    expect(photoSize(1200, 900)).toEqual({ width: 1200, height: 900 });
  });
});
