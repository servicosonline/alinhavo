import { describe, expect, it } from "vitest";
import { formatDocument, parseDocument, validCnpj, validCpf } from "./document";

describe("CPF e CNPJ", () => {
  it("confere o dígito verificador (os mesmos casos do teste do banco)", () => {
    expect(validCpf("52998224725")).toBe(true);
    expect(validCpf("52998224724")).toBe(false);
    expect(validCpf("11111111111")).toBe(false);
    expect(validCnpj("11222333000181")).toBe(true);
    expect(validCnpj("11222333000182")).toBe(false);
    expect(validCnpj("00000000000000")).toBe(false);
  });

  it("lê com ou sem pontuação e diz o que está errado", () => {
    expect(parseDocument("529.982.247-25")).toEqual({ ok: true, value: { type: "cpf", digits: "52998224725" } });
    expect(parseDocument("11.222.333/0001-81")).toEqual({ ok: true, value: { type: "cnpj", digits: "11222333000181" } });
    expect(parseDocument("  ")).toEqual({ ok: true, value: null });
    expect(parseDocument("123")).toMatchObject({ ok: false });
    expect(parseDocument("529.982.247-24")).toMatchObject({ ok: false, error: expect.stringContaining("CPF") });
  });

  it("formata para a tela", () => {
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
    expect(formatDocument("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatDocument(null)).toBe("");
  });
});
