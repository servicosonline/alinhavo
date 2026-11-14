import { segmentStart, type Piece, type Point } from "@alinhavo/geometry";

const n = (v: number) => Math.round(v * 100) / 100;
const pt = (p: Point) => `${n(p.x)} ${n(p.y)}`;

/** Contorno da parte como caminho SVG exato (retas e curvas cúbicas). */
export function piecePath(piece: Piece): string {
  const start = piece.points[piece.start];
  if (!start) return "";
  let d = `M${pt(start)}`;
  for (const seg of piece.outline) {
    const to = piece.points[seg.to];
    if (!to) return "";
    d += seg.kind === "line" ? `L${pt(to)}` : `C${pt(seg.c1)} ${pt(seg.c2)} ${pt(to)}`;
  }
  return `${d}Z`;
}

/** Um segmento sozinho, para selecionar e destacar. */
export function segmentPath(piece: Piece, index: number): string {
  const seg = piece.outline[index];
  const a = piece.points[segmentStart(piece, index)];
  const b = seg && piece.points[seg.to];
  if (!seg || !a || !b) return "";
  return seg.kind === "line" ? `M${pt(a)}L${pt(b)}` : `M${pt(a)}C${pt(seg.c1)} ${pt(seg.c2)} ${pt(b)}`;
}

export function polygonPath(points: Point[]): string {
  if (points.length === 0) return "";
  return `M${points.map(pt).join("L")}Z`;
}
