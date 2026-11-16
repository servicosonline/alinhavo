import type { Piece } from "./pattern";
import type { Point } from "./polygon";

/**
 * Presets do editor: margens por tipo de costura e passos de gradação prontos.
 * Não mudam o formato do molde: só preenchem os campos que já existem
 * (`seamAllowance`, `seamAllowanceByEdge` e a gradação por ponto). Medidas em mm.
 *
 * Os valores são os mais comuns em confecção, não uma norma: a modelista
 * ajusta depois, no próprio campo.
 */

export type SeamPreset = { id: string; name: string; mm: number; hint: string };

export const SEAM_PRESETS: readonly SeamPreset[] = [
  { id: "overloque", name: "Overloque", mm: 10, hint: "Costura fechada e chuleada junto" },
  { id: "aberta", name: "Costura aberta", mm: 15, hint: "Costura reta passada a ferro aberta" },
  { id: "cos", name: "Cós", mm: 10, hint: "Cintura que recebe o cós" },
  { id: "ziper", name: "Zíper", mm: 20, hint: "Onde vai o zíper" },
  { id: "barra", name: "Barra", mm: 30, hint: "Barra dobrada duas vezes" },
];

export type GradeStepPreset = { id: string; name: string; hint: string; axis: "x" | "y"; mm: number };

export const GRADE_STEP_PRESETS: readonly GradeStepPreset[] = [
  {
    id: "largura-05",
    name: "Largura ½ cm",
    hint: "O ponto anda ½ cm para fora por tamanho (na parte na dobra, 2 cm na volta)",
    axis: "x",
    mm: 5,
  },
  {
    id: "largura-1",
    name: "Largura 1 cm",
    hint: "O ponto anda 1 cm para fora por tamanho (na parte na dobra, 4 cm na volta)",
    axis: "x",
    mm: 10,
  },
  {
    id: "comprimento-1",
    name: "Comprimento 1 cm",
    hint: "A parte cresce 1 cm por tamanho: o alto fica, a barra desce 1 cm e o meio acompanha",
    axis: "y",
    mm: 10,
  },
];

/** Distância até onde um ponto conta como "sobre" a linha de referência (fica parado). */
const ON_LINE_MM = 1;

const round = (v: number) => Math.round(v * 10) / 10 + 0;

/** Reta da dobra, se ela for vertical (x constante) ou horizontal (y constante). */
function foldLine(piece: Piece): { axis: "x" | "y"; at: number } | null {
  if (piece.fold === undefined) return null;
  const seg = piece.outline[piece.fold];
  if (!seg) return null;
  const fromId = piece.fold === 0 ? piece.start : piece.outline[piece.fold - 1]!.to;
  const a = piece.points[fromId];
  const b = piece.points[seg.to];
  if (!a || !b) return null;
  if (Math.abs(a.x - b.x) <= ON_LINE_MM) return { axis: "x", at: (a.x + b.x) / 2 };
  if (Math.abs(a.y - b.y) <= ON_LINE_MM) return { axis: "y", at: (a.y + b.y) / 2 };
  return null;
}

/**
 * Passo por tamanho do ponto com o preset aplicado. Troca só o eixo do preset
 * e mantém o outro como está em `current`.
 *
 * - Largura (X): o ponto anda para fora da linha de referência, que é a dobra
 *   quando ela é vertical, senão o meio da parte. Ponto sobre essa linha fica.
 * - Comprimento (Y): proporcional à altura, do alto da parte (parado) até o
 *   ponto mais baixo (o passo inteiro). Y cresce para baixo, como no editor.
 *   Uma dobra horizontal vira o alto: os pontos andam para longe dela.
 *
 * Ponto que não existe na parte: devolve `current`.
 */
export function presetStep(piece: Piece, pointId: string, preset: GradeStepPreset, current: Point): Point {
  const p = piece.points[pointId];
  if (!p) return { ...current };
  const ps = Object.values(piece.points);
  const fold = foldLine(piece);

  if (preset.axis === "x") {
    const ref = fold?.axis === "x" ? fold.at : (Math.min(...ps.map((q) => q.x)) + Math.max(...ps.map((q) => q.x))) / 2;
    const d = p.x - ref;
    const x = Math.abs(d) <= ON_LINE_MM ? 0 : Math.sign(d) * preset.mm;
    return { x: round(x), y: current.y };
  }

  let top: number;
  let far: number;
  if (fold?.axis === "y") {
    top = fold.at;
    const ys = ps.map((q) => q.y);
    far = Math.abs(Math.max(...ys) - top) >= Math.abs(Math.min(...ys) - top) ? Math.max(...ys) : Math.min(...ys);
  } else {
    top = Math.min(...ps.map((q) => q.y));
    far = Math.max(...ps.map((q) => q.y));
  }
  const span = far - top;
  const y = Math.abs(span) < 1e-9 ? 0 : ((p.y - top) / span) * preset.mm * Math.sign(span);
  return { x: current.x, y: round(Math.abs(p.y - top) <= ON_LINE_MM ? 0 : y) };
}
