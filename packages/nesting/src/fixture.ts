import { emptyDocument, stepGrading, type PatternDocument } from "@alinhavo/geometry";

// Só para testes.
/** Saia com frente na dobra e costas em par, grade P/M/G. */
export function saia(): PatternDocument {
  const sizes = ["P", "M", "G"];
  const g = (x: number, y: number) => stepGrading(sizes, "M", { x, y });
  const doc = emptyDocument(sizes, "M");
  doc.pieces = [
    {
      id: "frente",
      name: "Frente",
      points: { A: { x: 0, y: 0 }, B: { x: 220, y: 0 }, C: { x: 250, y: 600 }, D: { x: 0, y: 600 } },
      start: "A",
      outline: [
        { kind: "line", to: "B" },
        { kind: "cubic", c1: { x: 250, y: 120 }, c2: { x: 250, y: 300 }, to: "C" },
        { kind: "line", to: "D" },
        { kind: "line", to: "A" },
      ],
      grading: { B: g(10, 0), C: g(10, 15), D: g(0, 15) },
      seamAllowance: 10,
      grainline: { from: { x: 100, y: 100 }, to: { x: 100, y: 500 } },
      fold: 3,
    },
    {
      id: "costas",
      name: "Costas",
      points: { A: { x: 0, y: 0 }, B: { x: 230, y: 0 }, C: { x: 260, y: 610 }, D: { x: 0, y: 600 } },
      start: "A",
      outline: [
        { kind: "line", to: "B" },
        { kind: "cubic", c1: { x: 260, y: 120 }, c2: { x: 260, y: 300 }, to: "C" },
        { kind: "line", to: "D" },
        { kind: "line", to: "A" },
      ],
      grading: { B: g(10, 0), C: g(10, 15), D: g(0, 15) },
      seamAllowance: 10,
      cutPair: true,
    },
  ];
  return doc;
}
