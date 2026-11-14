import { describe, expect, it } from "vitest";
import { polygonArea, polygonPerimeter, signedArea } from "./index";

const square100 = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe("polygonArea", () => {
  it("mede um quadrado de 10 cm como 10.000 mm²", () => {
    expect(polygonArea(square100)).toBe(10_000);
  });

  it("dá a mesma área nos dois sentidos de giro", () => {
    expect(polygonArea([...square100].reverse())).toBe(10_000);
    expect(signedArea(square100)).toBeGreaterThan(0);
    expect(signedArea([...square100].reverse())).toBeLessThan(0);
  });

  it("devolve zero para menos de três pontos", () => {
    expect(polygonArea([{ x: 0, y: 0 }, { x: 5, y: 5 }])).toBe(0);
  });
});

describe("polygonPerimeter", () => {
  it("mede o contorno fechado", () => {
    expect(polygonPerimeter(square100)).toBe(400);
  });

  it("mede um triângulo 3-4-5", () => {
    expect(
      polygonPerimeter([
        { x: 0, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 40 },
      ]),
    ).toBe(120);
  });
});
