import { flattenOutline, offsetPolygonDetailed, type Piece, type Point } from "@alinhavo/geometry";

/** Contorno pronto para exportar: pontos e quais deles são quinas (os pontos do molde). */
export type Outline = { points: Point[]; turn: boolean[] };

export type PieceOutlines = {
  /** Linha de costura (o molde sem margem). */
  sew: Outline;
  /** Linha de corte (com margem). Igual à de costura quando a margem é zero. */
  cut: Outline;
  hasAllowance: boolean;
};

/** Linhas de costura e de corte de uma parte (já no tamanho desejado). */
export function pieceOutlines(piece: Piece, tolerance = 0.1): PieceOutlines {
  const { polygon, edgeSegment } = flattenOutline(piece, tolerance);
  const n = polygon.length;
  // O vértice i é quina quando começa um segmento diferente do que chega nele.
  const sewTurn = polygon.map((_, i) => edgeSegment[(i - 1 + n) % n] !== edgeSegment[i]);
  const distances = edgeSegment.map((seg) => piece.seamAllowanceByEdge?.[seg] ?? piece.seamAllowance);
  const hasAllowance = distances.some((d) => d > 0);
  if (!hasAllowance) {
    const sew = { points: polygon, turn: sewTurn };
    return { sew, cut: sew, hasAllowance };
  }
  const { points, source } = offsetPolygonDetailed(polygon, distances);
  return {
    sew: { points: polygon, turn: sewTurn },
    cut: { points, turn: source.map((i) => sewTurn[i] ?? false) },
    hasAllowance,
  };
}

/** Texto só com caracteres ASCII (DXF R12 e leitores antigos não lidam bem com acentos). */
export function ascii(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "?");
}

export function bounds(points: Point[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}
