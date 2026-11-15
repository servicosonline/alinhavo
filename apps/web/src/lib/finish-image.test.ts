import { describe, expect, it } from "vitest";
import { ENCODINGS, fitWithin } from "./finish-image";

describe("fitWithin", () => {
  it("reduz pelo maior lado e mantém a proporção", () => {
    expect(fitWithin(2048, 1024, 512)).toEqual({ width: 512, height: 256 });
    expect(fitWithin(300, 900, 512)).toEqual({ width: 171, height: 512 });
  });
  it("nunca aumenta nem dá zero", () => {
    expect(fitWithin(100, 50, 512)).toEqual({ width: 100, height: 50 });
    expect(fitWithin(5000, 1, 512)).toEqual({ width: 512, height: 1 });
  });
});

describe("ENCODINGS", () => {
  it("tenta PNG primeiro (transparência) e só formatos que a estampa aceita", () => {
    expect(ENCODINGS[0]!.type).toBe("image/png");
    expect(ENCODINGS.every((e) => /^image\/(png|webp|jpeg)$/.test(e.type))).toBe(true);
  });
});
