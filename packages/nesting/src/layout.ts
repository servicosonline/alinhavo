import { polygonArea, type Point } from "@alinhavo/geometry";
import { applyAffine, type Affine } from "./nest";
import type { PatternNestPiece, SizeDemand } from "./pattern";

/**
 * Layout do risco salvo (formato 1, o que fica em markers.layout): as peças
 * com o contorno de corte e a posição de cada cópia. É um retrato completo:
 * desenhar e exportar o risco não dependem de recalcular o molde.
 *
 * `buildMarkerLayout` confere as posições que vieram do encaixe (calculado
 * no navegador) contra as peças do molde e calcula ela mesma o comprimento e
 * o aproveitamento. Não refaz o teste de sobreposição (pesado; fica no
 * motor e nos testes dele).
 */

export type MarkerSettings = {
  widthMm: number;
  gapMm: number;
  oneWay: boolean;
  demand: SizeDemand;
};

export type MarkerPiece = {
  id: string;
  patternPieceId: string;
  name: string;
  size: string;
  pairCopy: boolean;
  /** Contorno de corte nas coordenadas do molde, mm (0,01 mm). */
  outline: [number, number][];
};

export type MarkerPlacement = {
  pieceId: string;
  copy: number;
  rotation: 0 | 180;
  mirrored: boolean;
  /** [a, b, c, d, tx, ty] da transformação afim (ver `Affine`). */
  transform: [number, number, number, number, number, number];
};

export type MarkerLayout = MarkerSettings & {
  schema: 1;
  pieces: MarkerPiece[];
  placements: MarkerPlacement[];
  lengthMm: number;
  piecesAreaMm2: number;
  efficiency: number;
};

/** Folga numérica aceita na conferência, mm. */
const EDGE_TOLERANCE = 0.01;

const round2 = (v: number) => Math.round(v * 100) / 100;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export class MarkerLayoutError extends Error {}

function fail(message: string): never {
  throw new MarkerLayoutError(message);
}

function toAffine(t: unknown): Affine {
  if (typeof t !== "object" || t === null) fail("Posição sem transformação.");
  const { a, b, c, d, tx, ty } = t as Record<string, unknown>;
  if (![a, b, c, d, tx, ty].every(isNum)) fail("Transformação inválida.");
  return { a, b, c, d, tx, ty } as Affine;
}

/**
 * Monta o layout a partir das peças do molde (`patternNestPieces`) e das
 * posições do encaixe, que podem vir de fora (são conferidas): toda cópia
 * exatamente uma vez, giro rígido, espelho só na cópia do par, fio no
 * comprimento (e sem 180° em tecido com sentido) e tudo dentro da largura.
 */
export function buildMarkerLayout(pieces: readonly PatternNestPiece[], placements: unknown, settings: MarkerSettings): MarkerLayout {
  const { widthMm } = settings;
  if (!(widthMm > 0)) fail("Largura do tecido inválida.");
  if (!Array.isArray(placements)) fail("Posições inválidas.");
  const byId = new Map(pieces.map((p) => [p.id, p]));
  const expected = pieces.reduce((s, p) => s + p.quantity, 0);
  if (expected === 0) fail("Nenhuma peça a encaixar.");
  if (placements.length !== expected) fail(`O risco tem ${placements.length} peças, mas a demanda pede ${expected}.`);

  const seen = new Set<string>();
  const out: MarkerPlacement[] = [];
  let lengthMm = 0;
  let area = 0;

  for (const raw of placements as unknown[]) {
    if (typeof raw !== "object" || raw === null) fail("Posição inválida.");
    const pl = raw as Record<string, unknown>;
    const piece = typeof pl.pieceId === "string" ? byId.get(pl.pieceId) : undefined;
    if (!piece) fail("Peça do risco não existe no molde.");
    const copy = pl.copy;
    if (!Number.isInteger(copy) || (copy as number) < 0 || (copy as number) >= piece.quantity) fail(`Cópia inválida de "${piece.name}".`);
    const key = `${piece.id}#${copy}`;
    if (seen.has(key)) fail(`"${piece.name}" aparece duas vezes.`);
    seen.add(key);

    const rotation = pl.rotation;
    if (rotation !== 0 && rotation !== 180) fail("Giro inválido.");
    if (settings.oneWay && rotation !== 0) fail("Tecido com sentido não aceita peça girada.");
    const mirrored = piece.mirrored === true;
    if (pl.mirrored !== mirrored) fail(`Espelho errado em "${piece.name}".`);

    const t = toAffine(pl.transform);
    const rigid =
      Math.abs(t.a * t.a + t.b * t.b - 1) < 1e-6 && Math.abs(t.c * t.c + t.d * t.d - 1) < 1e-6 && Math.abs(t.a * t.c + t.b * t.d) < 1e-6;
    if (!rigid) fail(`"${piece.name}" foi deformada.`);
    const det = t.a * t.d - t.b * t.c;
    if (Math.sign(det) !== (mirrored ? -1 : 1)) fail(`Espelho errado em "${piece.name}".`);
    const len = Math.hypot(piece.grain.x, piece.grain.y);
    const gx = (t.a * piece.grain.x + t.c * piece.grain.y) / len;
    const gy = (t.b * piece.grain.x + t.d * piece.grain.y) / len;
    if (Math.abs(gy) > 1e-6 || Math.sign(gx) !== (rotation === 0 ? 1 : -1)) fail(`"${piece.name}" está fora do fio.`);

    for (const p of piece.outline) {
      const q = applyAffine(t, p);
      if (q.x < -EDGE_TOLERANCE || q.y < -EDGE_TOLERANCE || q.y > widthMm + EDGE_TOLERANCE) fail(`"${piece.name}" sai do tecido.`);
      lengthMm = Math.max(lengthMm, q.x);
    }
    area += polygonArea(piece.outline as Point[]);
    out.push({ pieceId: piece.id, copy: copy as number, rotation, mirrored, transform: [t.a, t.b, t.c, t.d, t.tx, t.ty] });
  }

  const efficiency = area / (lengthMm * widthMm);
  if (!(efficiency > 0 && efficiency <= 1 + 1e-9)) fail("Aproveitamento impossível: confira as peças.");

  return {
    schema: 1,
    widthMm,
    gapMm: settings.gapMm,
    oneWay: settings.oneWay,
    demand: { ...settings.demand },
    pieces: pieces
      .filter((p) => p.quantity > 0)
      .map((p) => ({
        id: p.id,
        patternPieceId: p.patternPieceId,
        name: p.name,
        size: p.size,
        pairCopy: p.pairCopy,
        outline: p.outline.map((q) => [round2(q.x), round2(q.y)] as [number, number]),
      })),
    placements: out,
    lengthMm: Math.round(lengthMm * 10) / 10,
    piecesAreaMm2: Math.round(area),
    efficiency: Math.min(1, Math.round(efficiency * 1e5) / 1e5),
  };
}

/** Contorno de uma cópia no risco salvo, em mm (coordenadas do risco). */
export function layoutOutline(layout: Pick<MarkerLayout, "pieces">, placement: MarkerPlacement): Point[] {
  const piece = layout.pieces.find((p) => p.id === placement.pieceId);
  if (!piece) return [];
  const [a, b, c, d, tx, ty] = placement.transform;
  return piece.outline.map(([x, y]) => ({ x: a * x + c * y + tx, y: b * x + d * y + ty }));
}

/** Lê um layout salvo (jsonb do banco); null se não estiver no formato 1. */
export function readMarkerLayout(json: unknown): MarkerLayout | null {
  if (typeof json !== "object" || json === null) return null;
  const l = json as Partial<MarkerLayout>;
  if (l.schema !== 1 || !Array.isArray(l.pieces) || !Array.isArray(l.placements) || !isNum(l.widthMm) || !isNum(l.lengthMm)) return null;
  return l as MarkerLayout;
}
