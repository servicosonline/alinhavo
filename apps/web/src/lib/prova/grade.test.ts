import { describe, expect, it } from "vitest";
import type { MapSummary } from "@alinhavo/cloth";
import { gradeCameraDistance, gradeConcurrency, gradeOffsets, nextToStart, tightestSize, type GradeSlotState } from "./grade";

const summary = (highStretch: number): MapSummary => ({
  maxStretch: highStretch * 2,
  highStretch,
  areaNearLimit: 0,
  minClearance: 0,
  maxClearance: 50,
});

describe("gradeOffsets", () => {
  it("centra em 0, do primeiro à esquerda ao último à direita, com o espaçamento", () => {
    expect(gradeOffsets(1)).toEqual([0]);
    expect(gradeOffsets(3, 700)).toEqual([-700, 0, 700]);
    const four = gradeOffsets(4, 100);
    expect(four).toEqual([-150, -50, 50, 150]);
    expect(four.reduce((a, b) => a + b, 0)).toBe(0);
  });
  it("grade vazia não tem posição", () => {
    expect(gradeOffsets(0)).toEqual([]);
  });
});

describe("gradeConcurrency", () => {
  it("deixa um núcleo para a tela e nunca passa do número de tamanhos", () => {
    expect(gradeConcurrency(8, 5)).toBe(5);
    expect(gradeConcurrency(4, 5)).toBe(3);
    expect(gradeConcurrency(16, 2)).toBe(2);
  });
  it("roda ao menos um, mesmo com um núcleo só ou sem informação", () => {
    expect(gradeConcurrency(1, 5)).toBe(1);
    expect(gradeConcurrency(undefined, 5)).toBe(2);
    expect(gradeConcurrency(Number.NaN, 5)).toBe(2);
  });
});

describe("nextToStart", () => {
  it("preenche as vagas livres pela ordem da grade", () => {
    const s: GradeSlotState[] = ["fila", "fila", "fila", "fila"];
    expect(nextToStart(s, 2)).toEqual([0, 1]);
  });
  it("conta quem está montando ou simulando; pronto e erro liberam a vaga", () => {
    const s: GradeSlotState[] = ["pronto", "simulando", "erro", "montando", "fila", "fila"];
    expect(nextToStart(s, 3)).toEqual([4]);
    expect(nextToStart(s, 2)).toEqual([]);
  });
  it("sem fila, ninguém começa", () => {
    expect(nextToStart(["pronto", "pronto"], 4)).toEqual([]);
  });
});

describe("gradeCameraDistance", () => {
  it("um tamanho fica na distância da Prova de um tamanho", () => {
    expect(gradeCameraDistance(1, 1.5)).toBeCloseTo(3.1);
  });
  it("mais tamanhos ou tela mais estreita afastam a câmera", () => {
    expect(gradeCameraDistance(5, 1.5)).toBeGreaterThan(gradeCameraDistance(3, 1.5));
    expect(gradeCameraDistance(5, 0.6)).toBeGreaterThan(gradeCameraDistance(5, 1.5));
  });
  it("a fileira cabe na largura da tela", () => {
    const count = 5;
    const aspect = 1.6;
    const d = gradeCameraDistance(count, aspect);
    const halfH = Math.atan(Math.tan((16 * Math.PI) / 180) * aspect);
    const visibleHalfWidth = d * Math.tan(halfH);
    expect(visibleHalfWidth).toBeGreaterThan(((count - 1) * 0.75) / 2 + 0.3);
  });
});

describe("tightestSize", () => {
  it("é o de maior pressão alta entre os que têm mapa", () => {
    expect(
      tightestSize([
        { size: "P", summary: summary(0.03) },
        { size: "M", summary: null },
        { size: "G", summary: summary(0.01) },
      ]),
    ).toBe("P");
  });
  it("sem mapa nenhum, não há", () => {
    expect(tightestSize([{ size: "P", summary: null }])).toBeNull();
  });
});
