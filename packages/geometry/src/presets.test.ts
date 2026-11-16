import { describe, expect, it } from "vitest";
import { saiaReta } from "./fixtures";
import { GRADE_STEP_PRESETS, SEAM_PRESETS, presetStep } from "./presets";
import type { Piece } from "./pattern";

const preset = (id: string) => GRADE_STEP_PRESETS.find((p) => p.id === id)!;
const largura = preset("largura-05");
const comprimento = preset("comprimento-1");

/** Saia reta com quadril (E, na lateral) e a dobra no centro da frente (segmento 3, x = 0). */
function saiaNaDobra(): Piece {
  const p = saiaReta();
  p.points.E = { x: 200, y: 200 };
  p.outline = [
    { kind: "line", to: "B" },
    { kind: "line", to: "E" },
    { kind: "line", to: "C" },
    { kind: "line", to: "D" },
    { kind: "line", to: "A" },
  ];
  p.fold = 4;
  delete p.seamAllowanceByEdge;
  return p;
}

describe("presets de margem", () => {
  it("têm ids únicos e margens dentro do que o editor aceita (0 a 10 cm)", () => {
    expect(new Set(SEAM_PRESETS.map((s) => s.id)).size).toBe(SEAM_PRESETS.length);
    for (const s of SEAM_PRESETS) {
      expect(s.mm).toBeGreaterThan(0);
      expect(s.mm).toBeLessThanOrEqual(100);
    }
  });
});

describe("presets de gradação", () => {
  it("têm ids únicos", () => {
    expect(new Set(GRADE_STEP_PRESETS.map((s) => s.id)).size).toBe(GRADE_STEP_PRESETS.length);
  });

  it("largura: na parte na dobra, a lateral anda para fora e a dobra fica", () => {
    const p = saiaNaDobra();
    expect(presetStep(p, "B", largura, { x: 0, y: 0 })).toEqual({ x: 5, y: 0 });
    expect(presetStep(p, "E", largura, { x: 0, y: 0 })).toEqual({ x: 5, y: 0 });
    expect(presetStep(p, "A", largura, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(presetStep(p, "D", largura, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it("largura sem dobra: anda para fora do meio da parte, dos dois lados", () => {
    const p = saiaReta();
    expect(presetStep(p, "B", largura, { x: 0, y: 0 }).x).toBe(5);
    expect(presetStep(p, "A", largura, { x: 0, y: 0 }).x).toBe(-5);
  });

  it("comprimento: o alto fica, a barra desce o passo inteiro e o meio acompanha", () => {
    const p = saiaNaDobra();
    expect(presetStep(p, "A", comprimento, { x: 0, y: 0 }).y).toBe(0);
    expect(presetStep(p, "C", comprimento, { x: 0, y: 0 }).y).toBe(10);
    expect(presetStep(p, "E", comprimento, { x: 0, y: 0 }).y).toBeCloseTo(3.3, 5);
  });

  it("troca só o eixo do preset e mantém o outro", () => {
    const p = saiaNaDobra();
    expect(presetStep(p, "C", largura, { x: 99, y: 15 })).toEqual({ x: 5, y: 15 });
    expect(presetStep(p, "C", comprimento, { x: 7, y: 99 })).toEqual({ x: 7, y: 10 });
  });

  it("dobra horizontal: o comprimento anda para longe dela", () => {
    const p = saiaReta();
    p.fold = 2; // barra (C → D, y = 600) vira a dobra
    delete p.seamAllowanceByEdge;
    expect(presetStep(p, "C", comprimento, { x: 0, y: 0 }).y).toBe(0);
    expect(presetStep(p, "A", comprimento, { x: 0, y: 0 }).y).toBe(-10);
  });

  it("ponto que não existe devolve o passo atual", () => {
    expect(presetStep(saiaReta(), "Z", largura, { x: 1, y: 2 })).toEqual({ x: 1, y: 2 });
  });
});
