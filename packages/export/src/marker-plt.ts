import { layoutOutline, type MarkerLayout } from "@alinhavo/nesting";
import { ascii } from "./outlines";

/**
 * Risco em HPGL (.plt), a linguagem das plotters de risco e de muitas
 * cortadoras. 40 unidades por mm (0,025 mm, o padrão HPGL).
 *
 * Caneta 1: linha de corte de cada peça (PU no primeiro ponto, PD por todo
 * o contorno e de volta ao primeiro). Caneta 2: rótulo (peça e tamanho),
 * opcional. X no comprimento do tecido; Y = largura − y do risco, para o
 * desenho sair igual ao da tela (e ao do DXF) com coordenadas positivas.
 */

export const PLT_UNITS_PER_MM = 40;

export type MarkerPltOptions = {
  /** Rótulos de texto com a caneta 2 (padrão: sim). Desligue em cortadora sem caneta. */
  labels?: boolean;
};

const ETX = "\u0003";

export function exportMarkerPlt(layout: MarkerLayout, options: MarkerPltOptions = {}): string {
  if (layout.placements.length === 0) throw new Error("Risco sem peças.");
  const W = layout.widthMm;
  const u = (mm: number) => Math.round(mm * PLT_UNITS_PER_MM);
  const at = (p: { x: number; y: number }) => `${u(p.x)},${u(W - p.y)}`;
  const out: string[] = ["IN", "SP1"];
  const labels: string[] = [];

  for (const pl of layout.placements) {
    const pts = layoutOutline(layout, pl);
    const piece = layout.pieces.find((p) => p.id === pl.pieceId);
    if (pts.length === 0 || !piece) continue;
    out.push(`PU${at(pts[0]!)}`);
    out.push(`PD${[...pts.slice(1), pts[0]!].map(at).join(",")}`);
    if (options.labels !== false) {
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const c = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
      // ETX encerra o texto: tira do rótulo qualquer caractere de controle.
      const text = ascii(`${piece.name} ${piece.size}`).replace(/[\u0000-\u001f;]/g, " ");
      labels.push(`PU${at(c)}`, `LB${text}${ETX}`);
    }
  }
  if (labels.length) out.push("SP2", "SI0.3,0.4", ...labels);
  out.push("PU", "SP0");
  return `${out.join(";")};\n`;
}
