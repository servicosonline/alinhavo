import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("aceita caminhos internos", () => {
    expect(safeNext("/painel")).toBe("/painel");
    expect(safeNext("/convite/abc?x=1#y")).toBe("/convite/abc?x=1#y");
  });

  it("usa o padrão quando não há destino", () => {
    expect(safeNext(undefined)).toBe("/painel");
    expect(safeNext("")).toBe("/painel");
    expect(safeNext(null, "/")).toBe("/");
  });

  it("recusa qualquer coisa que saia do site", () => {
    for (const ruim of [
      "https://mal.com",
      "//mal.com",
      "/\\mal.com",
      "\\\\mal.com",
      "javascript:alert(1)",
      "painel",
      "/\tmal",
      `/${"a".repeat(600)}`,
    ]) {
      expect(safeNext(ruim), ruim).toBe("/painel");
    }
  });
});
