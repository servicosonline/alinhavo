import { garmentAtSize, seamAllowanceOutline, validatePattern } from "@alinhavo/geometry";
import { describe, expect, it } from "vitest";
import { samplePattern } from "./sample-pattern";

describe("molde de exemplo", () => {
  it("é um documento válido", () => {
    expect(validatePattern(samplePattern())).toEqual([]);
  });

  it("a barra tem 3 cm de margem e o resto 1 cm", () => {
    const frente = samplePattern().pieces[0]!;
    const ys = seamAllowanceOutline(frente).map((p) => p.y);
    expect(Math.min(...ys)).toBeCloseTo(-10, 6);
    expect(Math.max(...ys)).toBeCloseTo(630, 6);
  });

  it("vem pronto para a Prova: dobra nos centros, posição e laterais costuradas", () => {
    const doc = samplePattern();
    expect(doc.pieces.map((p) => [p.fold, p.placement?.side])).toEqual([
      [3, "frente"],
      [3, "costas"],
    ]);
    const { pieces, seams } = garmentAtSize(doc, "M");
    // Abertas pela dobra, frente e costas inteiras com as duas laterais costuradas.
    expect(pieces.map((p) => p.outline.length)).toEqual([6, 6]);
    expect(seams.map((s) => s.id)).toEqual(["costura1", "costura1~espelho"]);
  });

  it("cada chamada devolve um documento novo (o editor pode alterar sem afetar o próximo)", () => {
    expect(samplePattern()).not.toBe(samplePattern());
    expect(samplePattern()).toEqual(samplePattern());
  });
});
