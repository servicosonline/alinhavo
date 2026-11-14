import { describe, expect, it } from "vitest";
import { jobStatusText, PROGRESS_EVERY_MS } from "./queue";

describe("fila de encaixes", () => {
  it("descreve o pedido em português", () => {
    expect(jobStatusText({ status: "fila", progress: 0 })).toBe("Na fila");
    expect(jobStatusText({ status: "rodando", progress: 0.404 })).toBe("Encaixando · 40%");
    expect(jobStatusText({ status: "pronto", progress: 1, markerNumber: 3 })).toBe("Pronto · risco nº 3");
    expect(jobStatusText({ status: "erro", progress: 0.2 })).toBe("Erro");
  });

  it("avisa progresso bem antes do prazo de 2 minutos do banco vencer", () => {
    expect(PROGRESS_EVERY_MS * 6).toBeLessThan(120_000);
  });
});
