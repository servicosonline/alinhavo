import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { saia } from "./fixture";
import { buildTechPack, consumptionNote, consumptionSource, ESTIMATED_EFFICIENCY, meters, money, type TechPackInput } from "./tech-pack";
import { exportTechPackPdf, winAnsiSafe } from "./tech-pack-pdf";

function input(overrides: Partial<TechPackInput> = {}): TechPackInput {
  return {
    generatedAt: "2026-11-14T15:00:00.000Z",
    product: { reference: "SAI-001", name: "Saia base", status: "aprovado", collection: "Verão 2027" },
    pattern: { name: "Saia base", version: 3, document: saia() },
    fabric: { name: "Sarja", composition: "98% algodão", widthMm: 1500, weightGsm: 280, priceCents: 3990 },
    trims: [
      { name: "Zíper 18 cm", quantity: 1, unit: "un", unitPriceCents: 250 },
      { name: "Botão", quantity: 2, unit: "un", unitPriceCents: 35 },
      { name: "Etiqueta", quantity: 1, unit: "un", unitPriceCents: null },
    ],
    ...overrides,
  };
}

describe("ficha técnica", () => {
  it("consumo = área ÷ aproveitamento ÷ largura; peso pela gramatura; custo pelo preço", () => {
    const data = buildTechPack(input());
    const m = data.consumption.bySize.M!;
    const expected = m.areaMm2 / ESTIMATED_EFFICIENCY / 1500 / 1000;
    expect(m.meters).toBeCloseTo(expected, 3);
    expect(m.weightG).toBeCloseTo(expected * 1.5 * 280, 0);
    expect(m.fabricCents).toBe(Math.round(expected * 3990));
    // Aviamentos: 250 + 2 × 35; a etiqueta sem preço não soma.
    expect(data.trimsCents).toBe(320);
    expect(data.trims[2]!.totalCents).toBeNull();
    expect(data.materialCentsBySize.M).toBe(m.fabricCents! + 320);
  });

  it("todos os tamanhos da grade, maiores gastam mais; peças com quantidade e dobra", () => {
    const data = buildTechPack(input());
    expect(Object.keys(data.consumption.bySize)).toEqual(data.pattern.sizes);
    const [p, , g] = data.pattern.sizes.map((s) => data.consumption.bySize[s]!.areaMm2);
    expect(g!).toBeGreaterThan(p!);
    expect(data.pieces.length).toBe(saia().pieces.length);
    expect(data.pieces[0]!.bySize.M!.cutAreaMm2).toBeGreaterThan(0);
  });

  it("sem tecido (ou sem largura/preço): consumo em área, o resto fica em branco", () => {
    const sem = buildTechPack(input({ fabric: null }));
    expect(sem.consumption.bySize.M!.areaMm2).toBeGreaterThan(0);
    expect(sem.consumption.bySize.M!.meters).toBeNull();
    expect(sem.materialCentsBySize.M).toBeNull();
    const semPreco = buildTechPack(input({ fabric: { name: "Malha", composition: null, widthMm: 1600, weightGsm: null, priceCents: null } }));
    expect(semPreco.consumption.bySize.M!.meters).not.toBeNull();
    expect(semPreco.consumption.bySize.M!.weightG).toBeNull();
    expect(semPreco.consumption.bySize.M!.fabricCents).toBeNull();
  });

  it("com risco do Encaixe na largura do tecido: aproveitamento medido, marcado como do encaixe", () => {
    const marker = { number: 3, widthMm: 1500, lengthMm: 2400, efficiency: 0.86 };
    const data = buildTechPack(input({ marker }));
    expect(data.consumption).toMatchObject({ method: "nesting", efficiency: 0.86, marker });
    const m = data.consumption.bySize.M!;
    expect(m.meters).toBeCloseTo(m.areaMm2 / 0.86 / 1500 / 1000, 3);
    // Aproveitamento maior que a estimativa de 80%: menos tecido.
    expect(m.meters!).toBeLessThan(buildTechPack(input()).consumption.bySize.M!.meters!);
    expect(consumptionSource(data.consumption)).toBe("pelo encaixe nº 3");
    expect(consumptionNote(data.consumption)).toMatch(/risco nº 3.*86,0%.*150 cm/);
  });

  it("PDF da ficha pelo encaixe também abre", async () => {
    const bytes = await exportTechPackPdf(buildTechPack(input({ marker: { number: 3, widthMm: 1500, lengthMm: 2400, efficiency: 0.86 } })), { number: 2 });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  });

  it("risco em outra largura, impossível ou sem largura no tecido: volta à estimativa", () => {
    const outra = buildTechPack(input({ marker: { number: 1, widthMm: 1600, lengthMm: 2000, efficiency: 0.9 } }));
    expect(outra.consumption.method).toBe("area");
    expect(outra.consumption.efficiency).toBe(ESTIMATED_EFFICIENCY);
    expect(outra.consumption.marker).toBeUndefined();
    expect(consumptionSource(outra.consumption)).toBe("estimativa");
    expect(consumptionNote(outra.consumption)).toMatch(/Estimativa.*80%/);
    expect(buildTechPack(input({ marker: { number: 1, widthMm: 1500, lengthMm: 2000, efficiency: 1.4 } })).consumption.method).toBe("area");
    expect(buildTechPack(input({ marker: { number: 1, widthMm: 1500, lengthMm: 0, efficiency: 0.8 } })).consumption.method).toBe("area");
    const semLargura = buildTechPack(input({ fabric: null, marker: { number: 1, widthMm: 1500, lengthMm: 2000, efficiency: 0.9 } }));
    expect(semLargura.consumption.method).toBe("area");
  });

  it("ficha antiga (sem method nesting nem marker) continua lida como estimativa", () => {
    expect(consumptionSource({ method: "area" })).toBe("estimativa");
    expect(consumptionNote({ method: "area", efficiency: 0.8 })).toMatch(/80%/);
  });

  it("formata em português", () => {
    expect(meters(1.234)).toBe("1,23 m");
    expect(meters(null)).toBe("—");
    expect(money(123456)).toMatch(/R\$\s?1\.234,56/);
  });

  it("PDF abre num leitor e tem título; texto fora da fonte vira ? em vez de quebrar", async () => {
    const data = buildTechPack(input({ product: { reference: null, name: "Saia 🌸 base", status: "ideia", collection: null } }));
    const bytes = await exportTechPackPdf(data, { number: 2 });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getTitle()).toBe("Ficha técnica - Saia ? base");
    expect(winAnsiSafe("Calça • 10% — ok ✓")).toBe("Calça • 10% — ok ?");
  });
});
