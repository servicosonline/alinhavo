import { seamAllowanceOutline, validatePattern } from "@alinhavo/geometry";
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

  it("cada chamada devolve um documento novo (o editor pode alterar sem afetar o próximo)", () => {
    expect(samplePattern()).not.toBe(samplePattern());
    expect(samplePattern()).toEqual(samplePattern());
  });
});
