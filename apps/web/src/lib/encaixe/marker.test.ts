import { describe, expect, it } from "vitest";
import { checkMarkerInput, formatDemand, formatEfficiency, formatMeters, formatPerGarment, readMarkerInput } from "./marker";

const sizes = ["P", "M", "G"];
const raw = (demand: Record<string, string>, width = "150", gap = "", oneWay = false) => ({ demand, width, gap, oneWay });

describe("readMarkerInput", () => {
  it("lê demanda, largura e folga em cm", () => {
    expect(readMarkerInput(sizes, raw({ P: "2", M: "3", G: "0" }, "152,5", "0,2", true), 3)).toEqual({
      input: { demand: { P: 2, M: 3 }, widthMm: 1525, gapMm: 2, oneWay: true },
    });
  });

  it("recusa demanda vazia, quebrada ou grande demais", () => {
    expect(readMarkerInput(sizes, raw({ P: "0" }), 3)).toEqual({ error: expect.stringMatching(/pelo menos uma/) });
    expect(readMarkerInput(sizes, raw({ P: "1,5" }), 3)).toEqual({ error: expect.stringMatching(/tamanho P/) });
    expect(readMarkerInput(sizes, raw({ P: "201" }), 3)).toEqual({ error: expect.stringMatching(/0 a 200/) });
    expect(readMarkerInput(sizes, raw({ P: "150", M: "150" }), 3)).toEqual({ error: expect.stringMatching(/grande demais/) });
  });

  it("recusa largura e folga fora da faixa", () => {
    expect(readMarkerInput(sizes, raw({ P: "1" }, "5"), 3)).toEqual({ error: expect.stringMatching(/Largura/) });
    expect(readMarkerInput(sizes, raw({ P: "1" }, "abc"), 3)).toEqual({ error: expect.stringMatching(/Largura/) });
    expect(readMarkerInput(sizes, raw({ P: "1" }, "150", "9"), 3)).toEqual({ error: expect.stringMatching(/Folga/) });
  });
});

describe("checkMarkerInput", () => {
  it("aceita só o formato que a tela manda", () => {
    const ok = { demand: { P: 2 }, widthMm: 1500, gapMm: 0, oneWay: false };
    expect(checkMarkerInput(sizes, ok)).toEqual(ok);
    expect(checkMarkerInput(sizes, { ...ok, demand: { XG: 1 } })).toBeNull();
    expect(checkMarkerInput(sizes, { ...ok, demand: { P: 0 } })).toBeNull();
    expect(checkMarkerInput(sizes, { ...ok, demand: [] })).toBeNull();
    expect(checkMarkerInput(sizes, { ...ok, widthMm: 1500.5 })).toBeNull();
    expect(checkMarkerInput(sizes, { ...ok, gapMm: -1 })).toBeNull();
    expect(checkMarkerInput(sizes, { ...ok, oneWay: "sim" })).toBeNull();
    expect(checkMarkerInput(sizes, null)).toBeNull();
  });
});

describe("formatação", () => {
  it("mostra aproveitamento, metros e demanda em português", () => {
    expect(formatEfficiency(0.81234)).toBe("81,2%");
    expect(formatMeters(3148.6)).toBe("3,15 m");
    expect(formatPerGarment(3000, { P: 2, M: 4 })).toBe("0,50 m");
    expect(formatDemand(sizes, { G: 1, P: 2 })).toBe("P 2 · G 1");
  });
});
