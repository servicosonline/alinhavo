import { describe, expect, it } from "vitest";
import { cutPieces, totalCutArea } from "./cut";
import { documento, saiaReta } from "./fixtures";

describe("cutPieces", () => {
  it("retângulo sem margem: área e caixa exatas; quantidade 1", () => {
    const p = { ...saiaReta(), seamAllowance: 0, seamAllowanceByEdge: undefined };
    const [c] = cutPieces(documento([p]));
    expect(c).toMatchObject({ pieceId: "frente", name: "Frente", quantity: 1, onFold: false, width: 200, length: 600 });
    expect(c!.cutArea).toBeCloseTo(200 * 600, 6);
    expect(c!.sewnArea).toBeCloseTo(200 * 600, 6);
  });

  it("margem entra na área de corte, não na da peça pronta", () => {
    const p = { ...saiaReta(), seamAllowance: 10, seamAllowanceByEdge: undefined };
    const [c] = cutPieces(documento([p]));
    expect(c!.cutArea).toBeCloseTo(220 * 620, 0);
    expect(c!.sewnArea).toBeCloseTo(200 * 600, 6);
    expect([c!.width, c!.length]).toEqual([220, 620]);
  });

  it("peça na dobra conta aberta; cortar par conta duas", () => {
    const naDobra = { ...saiaReta(), seamAllowance: 0, seamAllowanceByEdge: undefined, fold: 3 };
    const [d] = cutPieces(documento([naDobra]));
    expect(d!.onFold).toBe(true);
    expect(d!.sewnArea).toBeCloseTo(400 * 600, 6); // aberta pela dobra
    const par = { ...saiaReta(), seamAllowance: 0, seamAllowanceByEdge: undefined, cutPair: true as const };
    const pieces = cutPieces(documento([par]));
    expect(pieces[0]!.quantity).toBe(2);
    expect(totalCutArea(pieces)).toBeCloseTo(2 * 200 * 600, 6);
  });

  it("gradua: o G é maior que o P", () => {
    const doc = documento([saiaReta()]);
    expect(cutPieces(doc, "G")[0]!.cutArea).toBeGreaterThan(cutPieces(doc, "P")[0]!.cutArea);
  });
});
