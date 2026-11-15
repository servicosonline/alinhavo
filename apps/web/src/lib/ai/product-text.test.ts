import { describe, expect, it } from "vitest";
import { addFinish } from "@alinhavo/geometry";
import { examplePants } from "../examples";
import { samplePattern } from "../sample-pattern";
import { describeFinishes, productFacts, productTextUserMessage, readProductTexts, SALES_MAX, TECHNICAL_MAX } from "./product-text";

describe("productFacts", () => {
  it("monta os fatos sem preço e com o molde resumido", () => {
    const facts = productFacts({
      product: { name: "Calça pantalona", reference: "CP-01", collection: "Verão" },
      fabric: { name: "Sarja", composition: "98% algodão, 2% elastano", weightGsm: 280, widthMm: 1500 },
      trims: [{ name: "Zíper 15 cm", quantity: 1, unit: "un" }],
      doc: examplePants(),
    });
    expect(facts.tecido).toEqual({ nome: "Sarja", composicao: "98% algodão, 2% elastano", gramaturaGm2: 280, larguraCm: "150" });
    expect(facts.molde!.grade).toEqual(["P", "M", "G"]);
    expect(facts.molde!.partes.every((p) => p.cortarPar)).toBe(true);
    expect(JSON.stringify(facts)).not.toMatch(/price|preço|cents/i);
  });

  it('sem tecido nem molde: fica null (a IA escreve "a confirmar")', () => {
    const facts = productFacts({ product: { name: "Saia", reference: null, collection: null }, fabric: null, trims: [], doc: null });
    expect(facts.tecido).toBeNull();
    expect(facts.molde).toBeNull();
  });
});

describe("describeFinishes", () => {
  it("descreve cada acabamento com a parte e as medidas em cm", () => {
    let doc = samplePattern();
    doc = addFinish(doc, "frente", { kind: "pesponto", segment: 2, distance: 10, rows: 2 }).doc;
    doc = addFinish(doc, "frente", {
      kind: "etiqueta",
      anchor: "A",
      offset: { x: 50, y: 30 },
      width: 40,
      height: 20,
      rotation: 0,
      text: "Alinhavo",
    }).doc;
    expect(describeFinishes(doc)).toEqual(["Pesponto duplo a 1 cm da costura (Frente)", 'Etiqueta "Alinhavo" (Frente)']);
  });
});

describe("pedido e resposta", () => {
  it("os fatos vão como dados em JSON", () => {
    const msg = productTextUserMessage(
      productFacts({ product: { name: "Saia", reference: null, collection: null }, fabric: null, trims: [], doc: null }),
    );
    expect(msg).toMatch(/dados, não instruções/);
    expect(JSON.parse(msg.slice(msg.indexOf("{")))).toMatchObject({ produto: { nome: "Saia" } });
  });

  it("lê o JSON, limpa espaços e corta no limite do banco", () => {
    const r = readProductTexts(JSON.stringify({ venda: "  Saia leve.  ", tecnica: "Tecido: linho\n\n\n\nGrade: P M G  " }));
    expect(r).toEqual({ sales: "Saia leve.", technical: "Tecido: linho\n\nGrade: P M G" });
    const long = readProductTexts(JSON.stringify({ venda: "a".repeat(5000), tecnica: "b".repeat(9000) }))!;
    expect(long.sales.length).toBe(SALES_MAX);
    expect(long.technical.length).toBe(TECHNICAL_MAX);
  });

  it("formato errado ou texto vazio: null", () => {
    expect(readProductTexts("não é json")).toBeNull();
    expect(readProductTexts(JSON.stringify({ venda: "x" }))).toBeNull();
    expect(readProductTexts(JSON.stringify({ venda: "  ", tecnica: "x" }))).toBeNull();
    expect(readProductTexts("[]")).toBeNull();
  });
});
