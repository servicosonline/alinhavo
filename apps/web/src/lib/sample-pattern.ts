import { emptyDocument, stepGrading, type PatternDocument } from "@alinhavo/geometry";

/** Saia-base de exemplo (frente e costas), para a demonstração e para moldes novos. Medidas em mm. */
export function samplePattern(): PatternDocument {
  const sizes = ["P", "M", "G"];
  const doc = emptyDocument(sizes, "M");
  const g = (x: number, y: number) => stepGrading(sizes, "M", { x, y });
  doc.pieces = [
    {
      id: "frente",
      name: "Frente",
      points: {
        A: { x: 0, y: 0 },
        B: { x: 180, y: 0 },
        C: { x: 230, y: 600 },
        D: { x: 0, y: 600 },
      },
      start: "A",
      outline: [
        { kind: "line", to: "B" },
        { kind: "cubic", c1: { x: 215, y: 80 }, c2: { x: 235, y: 200 }, to: "C" },
        { kind: "line", to: "D" },
        { kind: "line", to: "A" },
      ],
      grading: { B: g(10, 0), C: g(12, 15), D: g(0, 15) },
      seamAllowance: 10,
      seamAllowanceByEdge: { 2: 30 },
      grainline: { from: { x: 80, y: 120 }, to: { x: 80, y: 480 } },
    },
    {
      id: "costas",
      name: "Costas",
      points: {
        A: { x: 320, y: 0 },
        B: { x: 510, y: 10 },
        C: { x: 560, y: 600 },
        D: { x: 320, y: 600 },
      },
      start: "A",
      outline: [
        { kind: "line", to: "B" },
        { kind: "cubic", c1: { x: 545, y: 90 }, c2: { x: 565, y: 210 }, to: "C" },
        { kind: "line", to: "D" },
        { kind: "line", to: "A" },
      ],
      grading: { B: g(10, 0), C: g(12, 15), D: g(0, 15) },
      seamAllowance: 10,
      seamAllowanceByEdge: { 2: 30 },
    },
  ];
  return doc;
}
