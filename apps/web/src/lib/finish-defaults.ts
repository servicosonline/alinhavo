import { LABEL_TEXT_MAX, segmentLengths, type NewFinish, type Piece, type Point } from "@alinhavo/geometry";

/**
 * Valores iniciais de um acabamento novo no editor: pesponto e zíper no
 * primeiro segmento que não é dobra; etiqueta e estampa no meio da parte,
 * presas ao ponto inicial. Medidas em mm. A modelista ajusta depois.
 */

/** Primeiro segmento que aceita pesponto ou zíper (a dobra não aceita); null se nenhum. */
export function firstEdge(piece: Piece): number | null {
  for (let i = 0; i < piece.outline.length; i++) if (i !== piece.fold) return i;
  return null;
}

/** Centro da caixa dos pontos da parte. */
function middle(piece: Piece): Point {
  const ps = Object.values(piece.points);
  const xs = ps.map((p) => p.x);
  const ys = ps.map((p) => p.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/** Deslocamento do ponto inicial até o meio da parte, arredondado ao mm. */
function toMiddle(piece: Piece): Point {
  const a = piece.points[piece.start]!;
  const m = middle(piece);
  return { x: Math.round(m.x - a.x), y: Math.round(m.y - a.y) };
}

/** Comprimento de zíper inicial, em mm (18 cm, ou o segmento inteiro se for menor). */
export const ZIPPER_DEFAULT = 180;

export function defaultSeamFinish(piece: Piece, kind: "pesponto" | "ziper"): NewFinish | null {
  const segment = firstEdge(piece);
  if (segment === null) return null;
  if (kind === "pesponto") return { kind, segment, distance: 10, rows: 1 };
  const len = segmentLengths(piece)[segment] ?? 0;
  return { kind, segment, from: 0, to: len > 0 ? Math.min(1, Math.round((ZIPPER_DEFAULT / len) * 1000) / 1000) : 1 };
}

export function defaultLabel(piece: Piece): NewFinish {
  return { kind: "etiqueta", anchor: piece.start, offset: toMiddle(piece), width: 50, height: 25, rotation: 0, text: "" };
}

/** Estampa com a imagem; a altura segue a proporção da imagem (largura de até 15 cm). */
export function defaultPrint(piece: Piece, image: string, imageWidth: number, imageHeight: number): NewFinish {
  const width = 150;
  const height = Math.max(5, Math.min(1000, Math.round((width * imageHeight) / Math.max(1, imageWidth))));
  return { kind: "estampa", anchor: piece.start, offset: toMiddle(piece), width, height, rotation: 0, image };
}

/** Acabamentos prontos: um clique põe o acabamento com os valores de uso comum (a modelista ajusta depois). */
export type FinishPresetId = "pesponto-jeans" | "ziper-invisivel" | "etiqueta-composicao";

export const FINISH_PRESETS: readonly { id: FinishPresetId; name: string; hint: string }[] = [
  { id: "pesponto-jeans", name: "Pesponto duplo de jeans", hint: "Duas carreiras: a 2 mm da costura e 6 mm depois" },
  { id: "ziper-invisivel", name: "Zíper invisível", hint: "Zíper de 20 cm e margem de 2 cm no segmento" },
  { id: "etiqueta-composicao", name: "Etiqueta de composição", hint: "Com a composição do tecido do produto" },
];

/** Comprimento do zíper invisível pronto, em mm. */
export const INVISIBLE_ZIPPER = 200;
/** Margem do segmento do zíper invisível, em mm (o zíper pede mais que a costura comum). */
export const INVISIBLE_ZIPPER_ALLOWANCE = 20;

/** Texto da etiqueta a partir da composição do tecido: sem espaços sobrando, até LABEL_TEXT_MAX caracteres. */
export function compositionLabel(composition: string | null | undefined): string | null {
  const t = (composition ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length <= LABEL_TEXT_MAX ? t : `${t.slice(0, LABEL_TEXT_MAX - 1).trimEnd()}…`;
}

export type PresetFinish = { finish: NewFinish; edgeAllowanceMm?: number };

/**
 * O acabamento pronto na parte. null quando não cabe: sem segmento que aceite
 * pesponto ou zíper, ou etiqueta de composição sem a composição do tecido.
 */
export function presetFinish(piece: Piece, id: FinishPresetId, composition?: string | null): PresetFinish | null {
  if (id === "etiqueta-composicao") {
    const text = compositionLabel(composition);
    if (!text) return null;
    const label = defaultLabel(piece);
    if (label.kind !== "etiqueta") return null;
    return { finish: { ...label, width: 40, height: 20, text } };
  }
  const segment = firstEdge(piece);
  if (segment === null) return null;
  if (id === "pesponto-jeans") return { finish: { kind: "pesponto", segment, distance: 2, rows: 2 } };
  const len = segmentLengths(piece)[segment] ?? 0;
  const to = len > 0 ? Math.min(1, Math.round((INVISIBLE_ZIPPER / len) * 1000) / 1000) : 1;
  return { finish: { kind: "ziper", segment, from: 0, to }, edgeAllowanceMm: INVISIBLE_ZIPPER_ALLOWANCE };
}

/** Bordado com a imagem: como a estampa, menor (largura de até 8 cm), a altura na proporção da imagem. */
export function defaultEmbroidery(piece: Piece, image: string, imageWidth: number, imageHeight: number): NewFinish {
  const width = 80;
  const height = Math.max(5, Math.min(1000, Math.round((width * imageHeight) / Math.max(1, imageWidth))));
  return { kind: "bordado", anchor: piece.start, offset: toMiddle(piece), width, height, rotation: 0, image };
}

/** Cor inicial da pedra (cristal). */
export const STONE_DEFAULT_COLOR = "#e8e8f0";

/**
 * Pedraria inicial: na borda (primeiro segmento que não é dobra, o trecho
 * todo, 5 mm para dentro) ou num retângulo de 6 × 4 cm no meio da parte.
 * Pedras de 4 mm a cada 8 mm na borda; 3 mm a cada 8 mm na área.
 */
export function defaultStones(piece: Piece, where: "borda" | "area"): NewFinish | null {
  if (where === "area") {
    return { kind: "pedraria", anchor: piece.start, offset: toMiddle(piece), width: 60, height: 40, rotation: 0, stone: 3, spacing: 8, color: STONE_DEFAULT_COLOR };
  }
  const segment = firstEdge(piece);
  if (segment === null) return null;
  return { kind: "pedraria", segment, distance: 5, from: 0, to: 1, stone: 4, spacing: 8, color: STONE_DEFAULT_COLOR };
}
