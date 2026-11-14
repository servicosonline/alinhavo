import { emptyDocument, stepGrading, type PatternDocument, type Piece, type Seam } from "@alinhavo/geometry";
import { samplePattern } from "./sample-pattern";

/**
 * Moldes de exemplo, para começar um molde novo e para a demonstração.
 * Medidas em mm, grade P, M, G (base M). No M vestem a tabela de
 * demonstração (busto 88, cintura 72, quadril 90 cm) e o corpo padrão da
 * Prova; cada tamanho anda 1 cm por quarto (4 cm na volta), como a tabela.
 *
 * Desenho visto pelo lado de fora: na frente esquerda da calça o centro fica
 * à esquerda; nas costas esquerda, à direita (de trás, a esquerda do corpo
 * fica à esquerda de quem olha). Ver packages/cloth/src/test-garments.ts.
 */

export type ExampleId = "saia" | "calca" | "conjunto";

export const EXAMPLES: { id: ExampleId; name: string; description: string }[] = [
  { id: "saia", name: "Saia-base", description: "Frente e costas na dobra, laterais costuradas." },
  { id: "calca", name: "Calça", description: "Frente e costas em par, gancho, entrepernas e laterais." },
  { id: "conjunto", name: "Conjunto calça + top", description: "A calça e um top de alças, para provar juntos." },
];

const SIZES = ["P", "M", "G"];
const g = (x: number, y = 0) => stepGrading(SIZES, "M", { x, y });
const line = (to: string) => ({ kind: "line" as const, to });

function calcaFrente(): Piece {
  return {
    id: "calca-frente",
    name: "Calça frente",
    points: {
      A: { x: 0, y: 0 }, // centro da frente na cintura
      B: { x: 190, y: 0 }, // lateral na cintura
      C: { x: 245, y: 197 }, // lateral no quadril
      F: { x: 200, y: 980 }, // lateral na barra
      G: { x: 5, y: 980 }, // entrepernas na barra
      E: { x: -42, y: 281 }, // ponta do gancho
    },
    start: "A",
    outline: [
      line("B"), // 0 cintura
      { kind: "cubic", c1: { x: 222, y: 40 }, c2: { x: 245, y: 120 }, to: "C" }, // 1 lateral do quadril
      line("F"), // 2 lateral da perna
      line("G"), // 3 barra
      line("E"), // 4 entrepernas
      { kind: "cubic", c1: { x: -5, y: 270 }, c2: { x: 0, y: 220 }, to: "A" }, // 5 gancho
    ],
    grading: { B: g(10), C: g(10), F: g(5), G: g(-5), E: g(-3) },
    seamAllowance: 10,
    seamAllowanceByEdge: { 3: 30 },
    grainline: { from: { x: 100, y: 330 }, to: { x: 100, y: 900 } },
    cutPair: true,
    placement: { side: "frente", anchor: "cintura", offset: 0, leg: "esquerda" },
  };
}

function calcaCostas(): Piece {
  return {
    id: "calca-costas",
    name: "Calça costas",
    points: {
      P: { x: 0, y: 0 }, // lateral na cintura
      Q: { x: 205, y: -15 }, // centro das costas na cintura
      S: { x: 312, y: 282 }, // ponta do gancho
      V: { x: 252, y: 980 }, // entrepernas na barra
      U: { x: 37, y: 980 }, // lateral na barra
      T: { x: -40, y: 200 }, // lateral no quadril
    },
    start: "P",
    outline: [
      line("Q"), // 0 cintura
      { kind: "cubic", c1: { x: 220, y: 150 }, c2: { x: 245, y: 280 }, to: "S" }, // 1 gancho
      line("V"), // 2 entrepernas
      line("U"), // 3 barra
      line("T"), // 4 lateral da perna
      { kind: "cubic", c1: { x: -40, y: 120 }, c2: { x: -25, y: 40 }, to: "P" }, // 5 lateral do quadril
    ],
    grading: { P: g(-10), T: g(-10), U: g(-5), V: g(5), S: g(3) },
    seamAllowance: 10,
    seamAllowanceByEdge: { 3: 30 },
    grainline: { from: { x: 145, y: 340 }, to: { x: 145, y: 900 } },
    cutPair: true,
    placement: { side: "costas", anchor: "cintura", offset: 0, leg: "esquerda" },
  };
}

const CALCA_SEAMS: Seam[] = [
  { id: "costura1", a: { piece: "calca-frente", segment: 1 }, b: { piece: "calca-costas", segment: 5 }, direction: "opposite" },
  { id: "costura2", a: { piece: "calca-frente", segment: 2 }, b: { piece: "calca-costas", segment: 4 }, direction: "opposite" },
  { id: "costura3", a: { piece: "calca-frente", segment: 4 }, b: { piece: "calca-costas", segment: 2 }, direction: "opposite" },
  { id: "costura4", a: { piece: "calca-frente", segment: 5 }, b: { piece: "calca-frente", segment: 5 }, direction: "same" },
  { id: "costura5", a: { piece: "calca-costas", segment: 1 }, b: { piece: "calca-costas", segment: 1 }, direction: "same" },
];

/** Top de alças, frente e costas na dobra (centro em u = 0, metade à direita). */
function topPart(front: boolean): Piece {
  const neck = front ? 150 : 60; // profundidade do decote
  const dx = front ? 0 : 380; // costas ao lado da frente na mesa
  const p = (x: number, y: number) => ({ x: x + dx, y });
  return {
    id: front ? "top-frente" : "top-costas",
    name: front ? "Top frente" : "Top costas",
    points: { N: p(0, neck), S1: p(85, 0), S2: p(125, 0), A: p(235, 175), H: p(225, 400), C: p(0, 400) },
    start: "N",
    outline: [
      { kind: "cubic", c1: p(50, neck), c2: p(85, neck * 0.4), to: "S1" }, // 0 decote
      line("S2"), // 1 ponta da alça
      { kind: "cubic", c1: p(130, 110), c2: p(200, 175), to: "A" }, // 2 cava
      line("H"), // 3 lateral
      line("C"), // 4 barra
      line("N"), // 5 dobra
    ],
    grading: { A: g(10), H: g(10) },
    seamAllowance: 10,
    seamAllowanceByEdge: { 4: 20, 5: 0 },
    grainline: { from: p(60, 200), to: p(60, 360) },
    fold: 5,
    placement: { side: front ? "frente" : "costas", anchor: "ombro", offset: 0 },
  };
}

const TOP_SEAMS: Seam[] = [
  { id: "costura6", a: { piece: "top-frente", segment: 1 }, b: { piece: "top-costas", segment: 1 }, direction: "same" },
  { id: "costura7", a: { piece: "top-frente", segment: 3 }, b: { piece: "top-costas", segment: 3 }, direction: "same" },
];

/** Desloca a parte na mesa (pontos, alças e fio), sem mudar a forma. */
function shiftPiece(piece: Piece, dx: number, dy: number): Piece {
  const mv = (p: { x: number; y: number }) => ({ x: p.x + dx, y: p.y + dy });
  return {
    ...piece,
    points: Object.fromEntries(Object.entries(piece.points).map(([id, p]) => [id, mv(p)])),
    outline: piece.outline.map((seg) => (seg.kind === "cubic" ? { ...seg, c1: mv(seg.c1), c2: mv(seg.c2) } : seg)),
    ...(piece.grainline ? { grainline: { from: mv(piece.grainline.from), to: mv(piece.grainline.to) } } : {}),
  };
}

/** Calça de exemplo (as partes ficam lado a lado na mesa). */
export function examplePants(): PatternDocument {
  const doc = emptyDocument(SIZES, "M");
  // Costas à direita da frente na mesa.
  doc.pieces = [calcaFrente(), shiftPiece(calcaCostas(), 420, 0)];
  doc.seams = CALCA_SEAMS.map((s) => ({ ...s, a: { ...s.a }, b: { ...s.b } }));
  return doc;
}

/** Calça + top num molde só (o "look" com várias peças vem na Fase 5). */
export function exampleOutfit(): PatternDocument {
  const doc = examplePants();
  // Tops acima da calça na mesa.
  const tops = [topPart(true), topPart(false)].map((p) => shiftPiece(p, 0, -520));
  doc.pieces = [...doc.pieces, ...tops];
  doc.seams = [...doc.seams, ...TOP_SEAMS.map((s) => ({ ...s, a: { ...s.a }, b: { ...s.b } }))];
  return doc;
}

/** Top de alças sozinho (o do conjunto), para vestir no look. */
export function exampleTop(): PatternDocument {
  const doc = emptyDocument(SIZES, "M");
  doc.pieces = [topPart(true), topPart(false)];
  doc.seams = TOP_SEAMS.map((s) => ({ ...s, a: { ...s.a }, b: { ...s.b } }));
  return doc;
}

/**
 * Saia ampla para vestir por cima da calça no look: cintura de 84 cm no M
 * (a da calça de exemplo tem uns 79; a saia-base, 72, não passa por cima dela).
 * Frente e costas na dobra; 0 cintura, 1 lateral do quadril, 2 lateral, 3 barra, 4 dobra.
 */
export function exampleWideSkirt(): PatternDocument {
  const doc = emptyDocument(SIZES, "M");
  const part = (front: boolean): Piece => {
    const dx = front ? 0 : 360; // costas ao lado da frente na mesa
    const p = (x: number, y: number) => ({ x: x + dx, y });
    return {
      id: front ? "saia-ampla-frente" : "saia-ampla-costas",
      name: front ? "Saia ampla frente" : "Saia ampla costas",
      points: { W: p(0, 0), L: p(210, 0), H: p(265, 190), B: p(300, 600), C: p(0, 600) },
      start: "W",
      outline: [line("L"), { kind: "cubic", c1: p(240, 50), c2: p(262, 120), to: "H" }, line("B"), line("C"), line("W")],
      grading: { L: g(10), H: g(10), B: g(12, 15), C: g(0, 15) },
      seamAllowance: 10,
      seamAllowanceByEdge: { 3: 30, 4: 0 },
      grainline: { from: p(80, 120), to: p(80, 480) },
      fold: 4,
      placement: { side: front ? "frente" : "costas", anchor: "cintura", offset: 0 },
    };
  };
  doc.pieces = [part(true), part(false)];
  doc.seams = [
    { id: "costura1", a: { piece: "saia-ampla-frente", segment: 1 }, b: { piece: "saia-ampla-costas", segment: 1 }, direction: "same" },
    { id: "costura2", a: { piece: "saia-ampla-frente", segment: 2 }, b: { piece: "saia-ampla-costas", segment: 2 }, direction: "same" },
  ];
  return doc;
}

/** Roupas de exemplo para vestir junto no look da demonstração. */
export function lookExamples(): { id: string; name: string; doc: PatternDocument }[] {
  return [
    { id: "calca", name: "Calça", doc: examplePants() },
    { id: "top", name: "Top de alças", doc: exampleTop() },
    { id: "saia-ampla", name: "Saia ampla (por cima da calça)", doc: exampleWideSkirt() },
    { id: "saia", name: "Saia-base", doc: samplePattern() },
  ];
}

/** O molde de exemplo pedido (sempre um documento novo). */
export function exampleDocument(id: ExampleId): PatternDocument {
  if (id === "calca") return examplePants();
  if (id === "conjunto") return exampleOutfit();
  return samplePattern();
}

export function isExampleId(v: unknown): v is ExampleId {
  return v === "saia" || v === "calca" || v === "conjunto";
}
