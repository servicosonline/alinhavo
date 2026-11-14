import { continuationSegments, segmentLengths, validatePattern } from "@alinhavo/geometry";
import { describe, expect, it } from "vitest";
import { samplePattern } from "../sample-pattern";
import { applyProvaAdjustment, describeAdjustment } from "./adjustment";

describe("ajuste na Prova", () => {
  it("+4 cm na barra da frente, com a continuação sugerida, alonga as duas laterais por igual", () => {
    const doc = samplePattern();
    const barra = { piece: "frente", segment: 2 };
    const sugestao = continuationSegments(doc, barra);
    expect(sugestao).toEqual([{ piece: "costas", segment: 2 }]);

    const r = applyProvaAdjustment(doc, { edges: [barra, ...sugestao], mm: 40 });
    expect(r.skipped).toEqual([]);
    expect(validatePattern(r.doc)).toEqual([]);
    expect(r.message).toBe("Prova: +4 cm em Frente (segmento 3) e Costas (segmento 3)");
    const lateral = (d: typeof doc, i: number) => segmentLengths(d.pieces[i]!)[1]!;
    const crescFrente = lateral(r.doc, 0) - lateral(doc, 0);
    const crescCostas = lateral(r.doc, 1) - lateral(doc, 1);
    expect(crescFrente).toBeGreaterThan(39);
    expect(crescFrente).toBeCloseTo(crescCostas, 0); // a costura lateral continua fechando
    expect(doc).toEqual(samplePattern()); // o original não muda
  });

  it("separa o que não pôde ser movido e não repete segmento", () => {
    const doc = samplePattern();
    const r = applyProvaAdjustment(doc, {
      edges: [
        { piece: "frente", segment: 3 }, // dobra
        { piece: "frente", segment: 2 },
        { piece: "frente", segment: 2 },
      ],
      mm: -15,
    });
    expect(r.applied).toEqual([{ piece: "frente", segment: 2 }]);
    expect(r.skipped).toEqual([{ piece: "frente", segment: 3 }]);
    expect(r.message).toBe("Prova: −1,5 cm em Frente (segmento 3)");
  });

  it("nada aplicado: documento igual e sem descrição", () => {
    const doc = samplePattern();
    const r = applyProvaAdjustment(doc, { edges: [{ piece: "frente", segment: 3 }], mm: 30 });
    expect(r.doc).toBe(doc);
    expect(r.message).toBe("");
    expect(describeAdjustment(doc, [], 10)).toBe("");
  });
});
