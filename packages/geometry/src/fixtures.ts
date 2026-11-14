import { stepGrading, type PatternDocument, type Piece } from "./pattern";

/** Peças de exemplo para os testes. Medidas em mm. */

export const SIZES = ["P", "M", "G"];

/** Retângulo 200 × 600 (meia frente de saia reta), cantos A B C D no sentido horário da tela. */
export function saiaReta(): Piece {
  return {
    id: "frente",
    name: "Frente",
    points: {
      A: { x: 0, y: 0 },
      B: { x: 200, y: 0 },
      C: { x: 200, y: 600 },
      D: { x: 0, y: 600 },
    },
    start: "A",
    outline: [
      { kind: "line", to: "B" }, // 0: cintura
      { kind: "line", to: "C" }, // 1: lateral
      { kind: "line", to: "D" }, // 2: barra
      { kind: "line", to: "A" }, // 3: centro da frente
    ],
    grading: {
      B: stepGrading(SIZES, "M", { x: 10, y: 0 }),
      C: stepGrading(SIZES, "M", { x: 10, y: 15 }),
      D: stepGrading(SIZES, "M", { x: 0, y: 15 }),
    },
    seamAllowance: 10,
    seamAllowanceByEdge: { 2: 30 }, // barra com 3 cm
  };
}

/** Mesma saia com a lateral curva (quadril). */
export function saiaCurva(): Piece {
  const p = saiaReta();
  p.outline[1] = { kind: "cubic", c1: { x: 230, y: 120 }, c2: { x: 230, y: 300 }, to: "C" };
  return p;
}

export function documento(pieces: Piece[] = [saiaReta()]): PatternDocument {
  return { schema: 5, unit: "mm", sizes: [...SIZES], baseSize: "M", pieces, seams: [] };
}
