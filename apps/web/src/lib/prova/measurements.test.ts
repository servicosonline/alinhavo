import { describe, expect, it } from "vitest";
import { measurementsBySize } from "./measurements";

const SIZES = [
  { id: "s-p", label: "P" },
  { id: "s-m", label: " m " },
  { id: "s-gg", label: "GG" },
];

describe("measurementsBySize", () => {
  it("organiza as medidas pelos tamanhos da grade do molde (rótulo sem caixa nem espaços)", () => {
    const r = measurementsBySize(
      ["P", "M", "G"],
      SIZES,
      [
        { size_id: "s-p", name: "Busto", value_mm: 880 },
        { size_id: "s-m", name: "busto", value_mm: "920.0" },
        { size_id: "s-m", name: "cintura ", value_mm: 740 },
        { size_id: "s-gg", name: "busto", value_mm: 1000 },
      ],
    );
    expect(r.bySize).toEqual({ P: { busto: 880 }, M: { busto: 920, cintura: 740 }, G: {} });
    expect(r.missing).toEqual(["G"]);
  });

  it("ignora valor inválido e medida de tamanho que não existe", () => {
    const r = measurementsBySize(["P"], SIZES, [
      { size_id: "s-p", name: "busto", value_mm: "abc" },
      { size_id: "s-p", name: "cintura", value_mm: -5 },
      { size_id: "outro", name: "busto", value_mm: 900 },
    ]);
    expect(r.bySize).toEqual({ P: {} });
    expect(r.missing).toEqual(["P"]);
  });

  it("sem tabela ligada, todos os tamanhos ficam para o corpo estimar", () => {
    expect(measurementsBySize(["P", "M"], [], [])).toEqual({ bySize: { P: {}, M: {} }, missing: ["P", "M"] });
  });
});
