import { describe, expect, it } from "vitest";
import { approvalErrorMessage, approvalLink, formatDate, readSettings, settingsLabel } from "./approval";

describe("aprovação", () => {
  it("lê as configurações guardadas sem confiar no formato", () => {
    expect(readSettings({ size: "M", fabric: "planoLeve", pose: "em-pe", extra: 1 })).toEqual({
      size: "M",
      fabric: "planoLeve",
      pose: "em-pe",
    });
    expect(readSettings(null)).toEqual({});
    expect(readSettings([1, 2])).toEqual({});
    expect(readSettings({ size: 42, fabric: "x".repeat(41) })).toEqual({ size: undefined, fabric: undefined, pose: undefined });
  });

  it("escreve as configurações em português", () => {
    expect(settingsLabel({ size: "M", fabric: "planoLeve", pose: "em-pe" })).toBe("Tamanho M · Plano leve · Em pé");
    expect(settingsLabel({ fabric: "jeans" })).toBe("Jeans");
    expect(settingsLabel({})).toBe("");
  });

  it("monta o link sem barra dobrada", () => {
    expect(approvalLink("https://app.com/", "abc")).toBe("https://app.com/aprovar/abc");
  });

  it("mostra só as mensagens que são nossas", () => {
    expect(approvalErrorMessage({ code: "42501" })).toMatch(/permissão/);
    expect(approvalErrorMessage({ code: "P0002" })).toMatch(/não vale mais/);
    expect(approvalErrorMessage({ code: "23505" })).toMatch(/já foi respondida/);
    expect(approvalErrorMessage({ code: "22023", message: "Conte o que precisa ser ajustado." })).toBe(
      "Conte o que precisa ser ajustado.",
    );
    expect(approvalErrorMessage({ code: "XX000", message: "relation public.x does not exist" })).toMatch(/Não foi possível/);
  });

  it("formata a data no fuso de São Paulo", () => {
    expect(formatDate("2026-11-15T02:00:00Z")).toBe("14/11/2026");
    expect(formatDate("lixo")).toBe("");
  });
});
