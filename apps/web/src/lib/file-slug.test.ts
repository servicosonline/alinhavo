import { describe, expect, it } from "vitest";
import { fileSlug } from "./file-slug";

describe("fileSlug", () => {
  it("tira acentos, espaços e símbolos", () => {
    expect(fileSlug("Saia lápis base")).toBe("saia-lapis-base");
    expect(fileSlug("  Calça / Coleção 2027! ")).toBe("calca-colecao-2027");
    expect(fileSlug("M")).toBe("m");
  });
  it("nunca devolve vazio", () => {
    expect(fileSlug("???")).toBe("molde");
  });
});
