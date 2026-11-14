import { segmentLengths, type NewFinish, type Piece, type Point } from "@alinhavo/geometry";

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
