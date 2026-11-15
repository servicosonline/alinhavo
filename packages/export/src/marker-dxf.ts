import { layoutOutline, type MarkerLayout } from "@alinhavo/nesting";
import { DxfWriter, dxfBegin, dxfPolyline, dxfText, flipY } from "./dxf-writer";
import { bounds } from "./outlines";

/**
 * Risco em DXF (R12 ASCII), com as peças já posicionadas, para plotter,
 * cortadora ou CAD. Não é o DXF-AAMA de peças (`dxf.ts`): cada cópia é uma
 * polilinha no lugar em que vai ser cortada.
 *
 * Camadas:
 *   1       linha de corte de cada peça
 *   15      textos (peça e tamanho no meio de cada uma; dados do risco acima)
 *   TECIDO  retângulo do tecido (largura × comprimento do risco)
 * Medidas em mm. X no comprimento do tecido; Y invertido como no DXF-AAMA
 * (a borda de cima do risco fica em Y = 0 e a largura desce até −largura).
 */

export type MarkerDxfOptions = {
  /** Ex.: "Saia base - risco 3" (texto em ASCII: acentos saem, outros símbolos viram "?"). */
  title: string;
  date?: Date;
};

const LAYERS = ["0", "1", "15", "TECIDO"] as const;

export function exportMarkerDxf(layout: MarkerLayout, options: MarkerDxfOptions): string {
  if (layout.placements.length === 0) throw new Error("Risco sem peças.");
  const W = layout.widthMm;
  const L = layout.lengthMm;
  const textHeight = Math.max(5, Math.min(20, W / 60));
  const w = new DxfWriter();
  dxfBegin(w, LAYERS);

  w.pair(0, "SECTION");
  w.pair(2, "ENTITIES");

  dxfPolyline(w, "TECIDO", [
    { x: 0, y: 0 },
    { x: L, y: 0 },
    { x: L, y: -W },
    { x: 0, y: -W },
  ]);

  for (const pl of layout.placements) {
    const pts = layoutOutline(layout, pl).map(flipY);
    const piece = layout.pieces.find((p) => p.id === pl.pieceId);
    if (pts.length === 0 || !piece) continue;
    dxfPolyline(w, "1", pts);
    const b = bounds(pts);
    dxfText(w, "15", { x: (b.minX + b.maxX) / 2 - textHeight * 2, y: (b.minY + b.maxY) / 2 }, `${piece.name} ${piece.size}`, textHeight);
  }

  const date = options.date ?? new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const demand = Object.entries(layout.demand)
    .map(([s, q]) => `${s}=${q}`)
    .join(" ");
  [
    options.title,
    `Largura: ${W} mm  Comprimento: ${L} mm  Aproveitamento: ${(layout.efficiency * 100).toFixed(1)}%`,
    `Demanda: ${demand}`,
    `Data: ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  ].forEach((t, i) => dxfText(w, "15", { x: 0, y: textHeight * 1.6 * (4 - i) }, t, textHeight));

  w.pair(0, "ENDSEC");
  w.pair(0, "EOF");
  return w.toString();
}
