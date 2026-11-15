import { describe, expect, it } from "vitest";
import { activeModule } from "./modules";

const org = "00000000-0000-4000-8000-000000000001";

describe("activeModule", () => {
  it("acha o módulo pela primeira parte da rota", () => {
    expect(activeModule(`/painel/${org}`, org)).toBe("");
    expect(activeModule(`/painel/${org}/moldes`, org)).toBe("moldes");
    expect(activeModule(`/painel/${org}/moldes/abc/prova`, org)).toBe("moldes");
    expect(activeModule(`/painel/${org}/encaixes`, org)).toBe("encaixes");
  });

  it("o produto e o encaixe dele ficam em Coleções", () => {
    expect(activeModule(`/painel/${org}/produtos/abc`, org)).toBe("colecoes");
    expect(activeModule(`/painel/${org}/produtos/abc/encaixe`, org)).toBe("colecoes");
  });

  it("rota de outra organização ou desconhecida cai no início", () => {
    expect(activeModule(`/painel/outra/moldes`, org)).toBe("");
    expect(activeModule(`/painel/${org}x/moldes`, org)).toBe("");
    expect(activeModule(`/painel/${org}/nada`, org)).toBe("");
  });
});
