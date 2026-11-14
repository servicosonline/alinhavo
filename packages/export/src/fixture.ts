import { emptyDocument, stepGrading, type PatternDocument } from "@alinhavo/geometry";

/** Saia de teste: frente reta 200×600 com barra de 3 cm e lateral curva nas costas. */
export function saia(): PatternDocument {
  const sizes = ["P", "M", "G"];
  const g = (x: number, y: number) => stepGrading(sizes, "M", { x, y });
  const doc = emptyDocument(sizes, "M");
  doc.pieces = [
    {
      id: "frente",
      name: "Frente",
      points: { A: { x: 0, y: 0 }, B: { x: 200, y: 0 }, C: { x: 200, y: 600 }, D: { x: 0, y: 600 } },
      start: "A",
      outline: [
        { kind: "line", to: "B" },
        { kind: "line", to: "C" },
        { kind: "line", to: "D" },
        { kind: "line", to: "A" },
      ],
      grading: { B: g(10, 0), C: g(10, 15), D: g(0, 15) },
      seamAllowance: 10,
      seamAllowanceByEdge: { 2: 30 },
      grainline: { from: { x: 100, y: 100 }, to: { x: 100, y: 500 } },
    },
    {
      id: "costas",
      name: "Costas da saia",
      points: { A: { x: 300, y: 0 }, B: { x: 500, y: 0 }, C: { x: 520, y: 600 }, D: { x: 300, y: 600 } },
      start: "A",
      outline: [
        { kind: "line", to: "B" },
        { kind: "cubic", c1: { x: 530, y: 100 }, c2: { x: 530, y: 300 }, to: "C" },
        { kind: "line", to: "D" },
        { kind: "line", to: "A" },
      ],
      seamAllowance: 10,
    },
  ];
  return doc;
}
