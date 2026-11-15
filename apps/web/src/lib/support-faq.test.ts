import { describe, expect, it } from "vitest";
import { searchFaq, SUPPORT_FAQ } from "./support-faq";

describe("perguntas frequentes", () => {
  it("vazio mostra todas", () => {
    expect(searchFaq("")).toHaveLength(SUPPORT_FAQ.length);
  });

  it("acha sem acento e pelas palavras extras", () => {
    expect(searchFaq("aprovacao")[0]!.q).toMatch(/aprovação/);
    expect(searchFaq("PLOTTER")[0]!.q).toMatch(/plotter/);
    expect(searchFaq("lento").map((i) => i.q)).toEqual(["A Prova está lenta ou travando."]);
  });

  it("todas as palavras precisam combinar", () => {
    expect(searchFaq("senha plotter")).toHaveLength(0);
  });
});
