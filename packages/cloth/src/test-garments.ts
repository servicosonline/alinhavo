import { emptyDocument, type PatternDocument, type Piece, type Seam } from "@alinhavo/geometry";

/**
 * Calça e top de teste para o manequim padrão dos testes (busto 88, cintura
 * 72, quadril 90, altura 165 cm). Medidas em mm. Só para testes; os moldes
 * de exemplo do app ficam no app.
 *
 * Convenção do desenho: cada parte vista pelo lado de fora. Na frente
 * esquerda da calça o centro fica à esquerda e a lateral à direita; nas
 * costas esquerda, ao contrário (de trás, a esquerda do corpo fica à
 * esquerda de quem olha).
 */

const line = (to: string) => ({ kind: "line" as const, to });

/** Frente esquerda (cortar par): 0 cintura, 1 lateral do quadril, 2 lateral da perna, 3 barra, 4 entrepernas, 5 gancho. */
export function calcaFrente(): Piece {
  return {
    id: "frente",
    name: "Frente",
    points: {
      A: { x: 0, y: 0 }, // centro da frente na cintura
      B: { x: 185, y: 0 }, // lateral na cintura
      C: { x: 235, y: 200 }, // lateral no quadril
      F: { x: 195, y: 980 }, // lateral na barra
      G: { x: 5, y: 980 }, // entrepernas na barra
      E: { x: -40, y: 281 }, // ponta do gancho
    },
    start: "A",
    outline: [
      line("B"),
      { kind: "cubic", c1: { x: 215, y: 40 }, c2: { x: 235, y: 120 }, to: "C" },
      line("F"),
      line("G"),
      line("E"),
      { kind: "cubic", c1: { x: -5, y: 270 }, c2: { x: 0, y: 220 }, to: "A" },
    ],
    seamAllowance: 10,
    cutPair: true,
    placement: { side: "frente", anchor: "cintura", offset: 0, leg: "esquerda" },
  };
}

/** Costas esquerda (cortar par): 0 cintura, 1 gancho, 2 entrepernas, 3 barra, 4 lateral da perna, 5 lateral do quadril. */
export function calcaCostas(): Piece {
  return {
    id: "costas",
    name: "Costas",
    points: {
      P: { x: 0, y: 0 }, // lateral na cintura
      Q: { x: 200, y: -15 }, // centro das costas na cintura (um pouco mais alto)
      S: { x: 305, y: 290 }, // ponta do gancho
      V: { x: 247, y: 980 }, // entrepernas na barra
      U: { x: 37, y: 980 }, // lateral na barra
      T: { x: -30, y: 200 }, // lateral no quadril
    },
    start: "P",
    outline: [
      line("Q"),
      { kind: "cubic", c1: { x: 215, y: 150 }, c2: { x: 240, y: 280 }, to: "S" },
      line("V"),
      line("U"),
      line("T"),
      { kind: "cubic", c1: { x: -30, y: 120 }, c2: { x: -20, y: 40 }, to: "P" },
    ],
    seamAllowance: 10,
    cutPair: true,
    placement: { side: "costas", anchor: "cintura", offset: 0, leg: "esquerda" },
  };
}

export const CALCA_SEAMS: Seam[] = [
  { id: "lateral-quadril", a: { piece: "frente", segment: 1 }, b: { piece: "costas", segment: 5 }, direction: "opposite" },
  { id: "lateral-perna", a: { piece: "frente", segment: 2 }, b: { piece: "costas", segment: 4 }, direction: "opposite" },
  { id: "entrepernas", a: { piece: "frente", segment: 4 }, b: { piece: "costas", segment: 2 }, direction: "opposite" },
  { id: "gancho-frente", a: { piece: "frente", segment: 5 }, b: { piece: "frente", segment: 5 }, direction: "same" },
  { id: "gancho-costas", a: { piece: "costas", segment: 1 }, b: { piece: "costas", segment: 1 }, direction: "same" },
];

export function calca(): PatternDocument {
  const doc = emptyDocument(["M"], "M");
  doc.pieces = [calcaFrente(), calcaCostas()];
  doc.seams = CALCA_SEAMS.map((s) => ({ ...s }));
  return doc;
}

/**
 * Top de alças: frente e costas na dobra (centro em u = 0, metade à direita).
 * 0 decote, 1 ponta da alça, 2 cava, 3 lateral, 4 barra, 5 dobra.
 */
function topPart(id: "top-frente" | "top-costas", neckDepth: number): Piece {
  return {
    id,
    name: id === "top-frente" ? "Top frente" : "Top costas",
    points: {
      N: { x: 0, y: neckDepth }, // centro do decote
      S1: { x: 85, y: 0 }, // alça, lado do pescoço
      S2: { x: 125, y: 0 }, // alça, lado do ombro
      A: { x: 235, y: 175 }, // cava na lateral
      H: { x: 225, y: 400 }, // lateral na barra
      C: { x: 0, y: 400 }, // centro na barra
    },
    start: "N",
    outline: [
      { kind: "cubic", c1: { x: 50, y: neckDepth }, c2: { x: 85, y: neckDepth * 0.4 }, to: "S1" },
      line("S2"),
      { kind: "cubic", c1: { x: 130, y: 110 }, c2: { x: 200, y: 175 }, to: "A" },
      line("H"),
      line("C"),
      line("N"),
    ],
    seamAllowance: 10,
    fold: 5,
    placement: { side: id === "top-frente" ? "frente" : "costas", anchor: "ombro", offset: 0 },
  };
}

export const TOP_SEAMS: Seam[] = [
  { id: "alca", a: { piece: "top-frente", segment: 1 }, b: { piece: "top-costas", segment: 1 }, direction: "same" },
  { id: "lateral-top", a: { piece: "top-frente", segment: 3 }, b: { piece: "top-costas", segment: 3 }, direction: "same" },
];

/**
 * Saia reta para vestir por cima da calça (look em camadas): frente e costas
 * na dobra, cintura de 84 cm (a da calça tem uns 77). 0 cintura, 1 lateral do
 * quadril, 2 lateral, 3 barra, 4 dobra.
 */
function saiaPart(id: "saia-frente" | "saia-costas"): Piece {
  return {
    id,
    name: id === "saia-frente" ? "Saia frente" : "Saia costas",
    points: {
      W: { x: 0, y: 0 }, // centro na cintura
      L: { x: 210, y: 0 }, // lateral na cintura
      H: { x: 265, y: 190 }, // lateral no quadril
      B: { x: 300, y: 600 }, // lateral na barra
      C: { x: 0, y: 600 }, // centro na barra
    },
    start: "W",
    outline: [line("L"), { kind: "cubic", c1: { x: 240, y: 50 }, c2: { x: 262, y: 120 }, to: "H" }, line("B"), line("C"), line("W")],
    seamAllowance: 10,
    fold: 4,
    placement: { side: id === "saia-frente" ? "frente" : "costas", anchor: "cintura", offset: 0 },
  };
}

export const SAIA_SEAMS: Seam[] = [
  { id: "saia-lateral-quadril", a: { piece: "saia-frente", segment: 1 }, b: { piece: "saia-costas", segment: 1 }, direction: "same" },
  { id: "saia-lateral", a: { piece: "saia-frente", segment: 2 }, b: { piece: "saia-costas", segment: 2 }, direction: "same" },
];

export function saia(): PatternDocument {
  const doc = emptyDocument(["M"], "M");
  doc.pieces = [saiaPart("saia-frente"), saiaPart("saia-costas")];
  doc.seams = SAIA_SEAMS.map((s) => ({ ...s }));
  return doc;
}

export function top(): PatternDocument {
  const doc = emptyDocument(["M"], "M");
  doc.pieces = [topPart("top-frente", 150), topPart("top-costas", 60)];
  doc.seams = TOP_SEAMS.map((s) => ({ ...s }));
  return doc;
}

/**
 * Camiseta de teste: frente e costas na dobra (ombro e cava, como a blusa do
 * app) e manga curta de cortar par no braço esquerdo (a cópia veste o direito).
 * Corpo: 0 decote, 1 ombro, 2 cava, 3 lateral, 4 barra, 5 dobra.
 * Manga (centro em u = 0, vista de fora no braço esquerdo: u > 0 vai para as
 * costas): 0 cabeça de trás, 1 lateral de trás, 2 barra, 3 lateral da frente,
 * 4 cabeça da frente. Cada metade da cabeça mede o mesmo que a cava (206 mm).
 */
function camisetaCorpo(front: boolean): Piece {
  const neck = front ? 110 : 30;
  return {
    id: front ? "camiseta-frente" : "camiseta-costas",
    name: front ? "Camiseta frente" : "Camiseta costas",
    points: { N: { x: 0, y: neck }, S1: { x: 85, y: 0 }, S2: { x: 150, y: 25 }, A: { x: 232, y: 200 }, H: { x: 250, y: 600 }, C: { x: 0, y: 600 } },
    start: "N",
    outline: [
      { kind: "cubic", c1: { x: 50, y: neck }, c2: { x: 85, y: neck * 0.4 }, to: "S1" },
      line("S2"),
      { kind: "cubic", c1: { x: 150, y: 110 }, c2: { x: 190, y: 200 }, to: "A" },
      line("H"),
      line("C"),
      line("N"),
    ],
    seamAllowance: 10,
    fold: 5,
    placement: { side: front ? "frente" : "costas", anchor: "ombro", offset: 0 },
  };
}

function camisetaManga(): Piece {
  return {
    id: "camiseta-manga",
    name: "Manga",
    points: { T: { x: 0, y: 0 }, B1: { x: 158, y: 117 }, C1: { x: 150, y: 220 }, C2: { x: -150, y: 220 }, B2: { x: -158, y: 117 } },
    start: "T",
    outline: [
      { kind: "cubic", c1: { x: 66, y: 0 }, c2: { x: 128, y: 56 }, to: "B1" },
      line("C1"),
      line("C2"),
      line("B2"),
      { kind: "cubic", c1: { x: -128, y: 56 }, c2: { x: -66, y: 0 }, to: "T" },
    ],
    seamAllowance: 10,
    cutPair: true,
    placement: { side: "esquerda", anchor: "ombro", offset: 0, arm: "esquerda" },
  };
}

export function camiseta(): PatternDocument {
  const doc = emptyDocument(["M"], "M");
  doc.pieces = [camisetaCorpo(true), camisetaCorpo(false), camisetaManga()];
  doc.seams = [
    { id: "ombro", a: { piece: "camiseta-frente", segment: 1 }, b: { piece: "camiseta-costas", segment: 1 }, direction: "same" },
    { id: "lateral", a: { piece: "camiseta-frente", segment: 3 }, b: { piece: "camiseta-costas", segment: 3 }, direction: "same" },
    { id: "cava-costas", a: { piece: "camiseta-manga", segment: 0 }, b: { piece: "camiseta-costas", segment: 2 }, direction: "same" },
    { id: "cava-frente", a: { piece: "camiseta-manga", segment: 4 }, b: { piece: "camiseta-frente", segment: 2 }, direction: "opposite" },
    { id: "manga-lateral", a: { piece: "camiseta-manga", segment: 1 }, b: { piece: "camiseta-manga", segment: 3 }, direction: "opposite" },
  ];
  return doc;
}
