import { emptyDocument, stepGrading, type PatternDocument, type Piece, type Point, type Seam } from "@alinhavo/geometry";
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

export type ExampleId = "saia" | "calca" | "conjunto" | "blusa" | "vestido" | "short" | "camiseta" | "blusa-manga" | "manga";

export const EXAMPLES: { id: ExampleId; name: string; description: string }[] = [
  { id: "saia", name: "Saia-base", description: "Frente e costas na dobra, laterais costuradas." },
  { id: "calca", name: "Calça", description: "Frente e costas em par, gancho, entrepernas e laterais." },
  { id: "conjunto", name: "Conjunto calça + top", description: "A calça e um top de alças, para provar juntos." },
  { id: "blusa", name: "Blusa sem manga", description: "Frente e costas na dobra, ombro e lateral costurados, cava sem manga." },
  { id: "vestido", name: "Vestido sem manga", description: "Corpo da blusa até o joelho, marcando a cintura e abrindo no quadril." },
  { id: "short", name: "Short", description: "A calça cortada acima do joelho: frente e costas em par, gancho e entrepernas." },
  { id: "camiseta", name: "Camiseta", description: "Corpo da blusa com manga curta em par, costurada na cava (prove em malha)." },
  { id: "blusa-manga", name: "Blusa com manga longa", description: "Corpo da blusa com manga longa até o punho, em par." },
  { id: "manga", name: "Manga base", description: "Manga longa sozinha, em par, para costurar na cava de outro molde." },
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

/**
 * Corpo de cima com ombro e cava (blusa e vestido sem manga), frente e costas
 * na dobra. No M, o alto do ombro (y = 0) fica no pescoço do corpo padrão;
 * busto ~200 mm abaixo, cintura ~360, quadril ~560. Frente e costas só mudam
 * no decote, então ombro e lateral têm o mesmo comprimento.
 *
 * Contorno: 0 decote, 1 ombro, 2 cava, 3… lateral (da cava para baixo), barra, dobra.
 */
function bodicePart(opts: { front: boolean; prefix: string; name: string; side: { to: Point; c1?: Point; c2?: Point }[]; hemY: number; hemAllowance: number }): Piece {
  const { front, prefix, name, side, hemY, hemAllowance } = opts;
  const neck = front ? 110 : 30; // profundidade do decote
  const dx = front ? 0 : 380; // costas ao lado da frente na mesa
  const p = (q: Point) => ({ x: q.x + dx, y: q.y });
  const points: Record<string, Point> = { N: p({ x: 0, y: neck }), S1: p({ x: 85, y: 0 }), S2: p({ x: 150, y: 25 }), A: p({ x: 232, y: 200 }) };
  const grading: NonNullable<Piece["grading"]> = { S2: g(5), A: g(10) };
  const sideSegs: Piece["outline"] = side.map((s, i) => {
    const id = `L${i + 1}`;
    points[id] = p(s.to);
    grading[id] = g(10);
    return s.c1 && s.c2 ? { kind: "cubic" as const, c1: p(s.c1), c2: p(s.c2), to: id } : line(id);
  });
  points.C = p({ x: 0, y: hemY });
  const hem = 3 + side.length;
  return {
    id: `${prefix}-${front ? "frente" : "costas"}`,
    name: `${name} ${front ? "frente" : "costas"}`,
    points,
    start: "N",
    outline: [
      { kind: "cubic", c1: p({ x: 50, y: neck }), c2: p({ x: 85, y: neck * 0.4 }), to: "S1" }, // 0 decote
      line("S2"), // 1 ombro
      { kind: "cubic", c1: p({ x: 150, y: 110 }), c2: p({ x: 190, y: 200 }), to: "A" }, // 2 cava
      ...sideSegs, // 3… lateral
      line("C"), // barra
      line("N"), // dobra
    ],
    grading,
    seamAllowance: 10,
    seamAllowanceByEdge: { [hem]: hemAllowance, [hem + 1]: 0 },
    grainline: { from: p({ x: 70, y: 220 }), to: p({ x: 70, y: hemY - 60 }) },
    fold: hem + 1,
    placement: { side: front ? "frente" : "costas", anchor: "ombro", offset: 0 },
  };
}

/** Ombro e cada trecho da lateral, frente com costas (as duas partes na dobra). */
function bodiceSeams(prefix: string, sideCount: number): Seam[] {
  return [1, ...Array.from({ length: sideCount }, (_, i) => 3 + i)].map((segment, i) => ({
    id: `costura${i + 1}`,
    a: { piece: `${prefix}-frente`, segment },
    b: { piece: `${prefix}-costas`, segment },
    direction: "same" as const,
  }));
}

/** Blusa sem manga até o quadril, abrindo um pouco na barra. */
export function exampleBlouse(): PatternDocument {
  const doc = emptyDocument(SIZES, "M");
  const side = [{ to: { x: 252, y: 640 } }];
  doc.pieces = [true, false].map((front) => bodicePart({ front, prefix: "blusa", name: "Blusa", side, hemY: 640, hemAllowance: 20 }));
  doc.seams = bodiceSeams("blusa", side.length);
  return doc;
}

/** Vestido sem manga: o corpo da blusa marcando a cintura, abrindo no quadril, até o joelho. */
export function exampleDress(): PatternDocument {
  const doc = emptyDocument(SIZES, "M");
  const side = [
    { to: { x: 205, y: 363 } }, // cintura
    { to: { x: 245, y: 563 }, c1: { x: 215, y: 430 }, c2: { x: 240, y: 500 } }, // quadril
    { to: { x: 300, y: 950 } }, // barra
  ];
  doc.pieces = [true, false].map((front) => bodicePart({ front, prefix: "vestido", name: "Vestido", side, hemY: 950, hemAllowance: 30 }));
  doc.seams = bodiceSeams("vestido", side.length);
  return doc;
}

/**
 * Short: a calça de exemplo cortada uns 15 cm abaixo do gancho. A lateral e a
 * entreperna de frente e costas são cortadas na mesma fração do comprimento
 * (e a gradação dos pontos novos, interpolada), então as costuras continuam
 * com os dois lados iguais em todos os tamanhos.
 */
export function exampleShorts(): PatternDocument {
  const frente = calcaFrente();
  const costas = calcaCostas();
  const cut = (piece: Piece, id: string, from: string, to: string, f: number, step: number) => {
    const a = piece.points[from]!;
    const b = piece.points[to]!;
    piece.points[id] = { x: Math.round((a.x + (b.x - a.x) * f) * 10) / 10, y: Math.round((a.y + (b.y - a.y) * f) * 10) / 10 };
    piece.grading = { ...piece.grading, [id]: g(step) };
  };
  const side = 0.2976; // lateral: do quadril até a barra da calça
  const inseam = 0.2132; // entreperna: do gancho até a barra da calça
  // Frente: C → F (lateral), E → G (entreperna, percorrida de G para E).
  cut(frente, "F", "C", "F", side, 8.5);
  cut(frente, "G", "E", "G", inseam, -3.4);
  // Costas: T → U (lateral, percorrida de U para T), S → V (entreperna).
  cut(costas, "U", "T", "U", side, -8.5);
  cut(costas, "V", "S", "V", inseam, 3.4);
  for (const piece of [frente, costas]) {
    piece.id = piece.id.replace("calca", "short");
    piece.name = piece.name.replace("Calça", "Short");
    piece.grainline = { from: { x: piece.grainline!.from.x, y: 260 }, to: { x: piece.grainline!.from.x, y: 400 } };
  }
  const doc = emptyDocument(SIZES, "M");
  doc.pieces = [frente, shiftPiece(costas, 420, 0)];
  doc.seams = CALCA_SEAMS.map((s) => ({
    ...s,
    a: { ...s.a, piece: s.a.piece.replace("calca", "short") },
    b: { ...s.b, piece: s.b.piece.replace("calca", "short") },
  }));
  return doc;
}

/**
 * Manga em par no braço esquerdo (a cópia veste o direito), centro em u = 0.
 * Vista de fora, u > 0 vai para as costas. Cada metade da cabeça mede o mesmo
 * que a cava do corpo (`bodicePart`) em todos os tamanhos (a gradação do
 * ponto da axila foi achada para isso).
 * Contorno: 0 cabeça de trás, 1 lateral de trás, 2 barra, 3 lateral da frente, 4 cabeça da frente.
 */
function sleevePart(prefix: string, long: boolean, dx = 0): Piece {
  const hem = long ? { x: 96, y: 580 } : { x: 165, y: 220 };
  const p = (x: number, y: number) => ({ x: x + dx, y });
  return {
    id: `${prefix}-manga`,
    name: long ? "Manga longa" : "Manga curta",
    points: { T: p(0, 0), B1: p(175, 95), C1: p(hem.x, hem.y), C2: p(-hem.x, hem.y), B2: p(-175, 95) },
    start: "T",
    outline: [
      { kind: "cubic", c1: p(74, 0), c2: p(142, 46), to: "B1" }, // 0 cabeça de trás
      line("C1"), // 1 lateral de trás
      line("C2"), // 2 barra
      line("B2"), // 3 lateral da frente
      { kind: "cubic", c1: p(-142, 46), c2: p(-74, 0), to: "T" }, // 4 cabeça da frente
    ],
    grading: { B1: g(1.5, 2), B2: g(-1.5, 2), C1: g(3), C2: g(-3) },
    seamAllowance: 10,
    seamAllowanceByEdge: { 2: 20 },
    grainline: { from: p(0, 60), to: p(0, hem.y - 40) },
    cutPair: true,
    placement: { side: "esquerda", anchor: "ombro", offset: 0, arm: "esquerda" },
  };
}

/** Lateral da manga e, com o corpo, as duas metades da cabeça nas cavas de frente e costas. */
function sleeveSeams(prefix: string, first: number, body?: string): Seam[] {
  const manga = `${prefix}-manga`;
  const seams: Seam[] = [{ id: `costura${first}`, a: { piece: manga, segment: 1 }, b: { piece: manga, segment: 3 }, direction: "opposite" }];
  if (body) {
    seams.push(
      { id: `costura${first + 1}`, a: { piece: manga, segment: 0 }, b: { piece: `${body}-costas`, segment: 2 }, direction: "same" },
      { id: `costura${first + 2}`, a: { piece: manga, segment: 4 }, b: { piece: `${body}-frente`, segment: 2 }, direction: "opposite" },
    );
  }
  return seams;
}

/** Corpo da blusa (até o quadril) com a manga curta ou longa. */
function sleevedTop(prefix: string, name: string, long: boolean): PatternDocument {
  const doc = emptyDocument(SIZES, "M");
  const side = [{ to: { x: 252, y: 640 } }];
  doc.pieces = [
    ...[true, false].map((front) => bodicePart({ front, prefix, name, side, hemY: 640, hemAllowance: 20 })),
    sleevePart(prefix, long, 900),
  ];
  const body = bodiceSeams(prefix, side.length);
  doc.seams = [...body, ...sleeveSeams(prefix, body.length + 1, prefix)];
  return doc;
}

/** Camiseta: o corpo da blusa e a manga curta. */
export function exampleTee(): PatternDocument {
  return sleevedTop("camiseta", "Camiseta", false);
}

/** Blusa com manga longa até o punho. */
export function exampleLongSleeveBlouse(): PatternDocument {
  return sleevedTop("blusa-manga", "Blusa", true);
}

/** Manga longa sozinha (base para costurar na cava de outro molde). */
export function exampleSleeve(): PatternDocument {
  const doc = emptyDocument(SIZES, "M");
  doc.pieces = [sleevePart("base", true)];
  doc.seams = sleeveSeams("base", 1);
  return doc;
}

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
    { id: "blusa", name: "Blusa sem manga", doc: exampleBlouse() },
    { id: "short", name: "Short", doc: exampleShorts() },
    { id: "camiseta", name: "Camiseta", doc: exampleTee() },
  ];
}

/** O molde de exemplo pedido (sempre um documento novo). */
export function exampleDocument(id: ExampleId): PatternDocument {
  if (id === "calca") return examplePants();
  if (id === "conjunto") return exampleOutfit();
  if (id === "blusa") return exampleBlouse();
  if (id === "vestido") return exampleDress();
  if (id === "short") return exampleShorts();
  if (id === "camiseta") return exampleTee();
  if (id === "blusa-manga") return exampleLongSleeveBlouse();
  if (id === "manga") return exampleSleeve();
  return samplePattern();
}

export function isExampleId(v: unknown): v is ExampleId {
  return EXAMPLES.some((e) => e.id === v);
}
