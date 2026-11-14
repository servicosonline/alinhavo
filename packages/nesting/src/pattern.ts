import { pieceAtSize, seamAllowanceOutline, unfoldPiece, type PatternDocument, type Point } from "@alinhavo/geometry";
import type { NestPiece } from "./nest";

/** Quantas peças prontas de cada tamanho o risco corta. */
export type SizeDemand = Record<string, number>;

/** Peça do encaixe com a origem no molde. */
export type PatternNestPiece = NestPiece & {
  /** Parte do molde. */
  patternPieceId: string;
  name: string;
  size: string;
  /** Segunda peça de um cortar par (espelhada). */
  pairCopy: boolean;
};

/** Sem fio desenhado, o fio é o eixo Y do molde (a peça desenhada em pé). */
export const DEFAULT_GRAIN: Point = { x: 0, y: 1 };

/** Separa o id da peça do encaixe: parte, tamanho e, se for, a cópia do par. */
export function nestPieceId(patternPieceId: string, size: string, pairCopy: boolean): string {
  return `${patternPieceId}@${size}${pairCopy ? "~par" : ""}`;
}

/**
 * As peças de corte do molde para a demanda: cada parte, em cada tamanho
 * pedido, aberta pela dobra e com margem. Cortar par vira duas peças (a
 * segunda espelhada pelo fio), cada uma com a quantidade do tamanho.
 * Tamanho fora do molde é recusado; demanda 0 fica de fora.
 */
export function patternNestPieces(doc: PatternDocument, demand: SizeDemand): PatternNestPiece[] {
  const out: PatternNestPiece[] = [];
  for (const [size, quantity] of Object.entries(demand)) {
    if (!doc.sizes.includes(size)) throw new Error(`Tamanho "${size}" não existe no molde.`);
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error(`Demanda inválida no tamanho "${size}".`);
    if (quantity === 0) continue;
    for (const p of doc.pieces) {
      const open = unfoldPiece(pieceAtSize(p, size)).piece;
      const outline = seamAllowanceOutline(open);
      const g = open.grainline;
      const grain = g && Math.hypot(g.to.x - g.from.x, g.to.y - g.from.y) > 0 ? { x: g.to.x - g.from.x, y: g.to.y - g.from.y } : DEFAULT_GRAIN;
      const copies = p.cutPair ? [false, true] : [false];
      for (const pairCopy of copies) {
        out.push({
          id: nestPieceId(p.id, size, pairCopy),
          outline,
          grain,
          mirrored: pairCopy,
          quantity,
          patternPieceId: p.id,
          name: p.name,
          size,
          pairCopy,
        });
      }
    }
  }
  return out;
}
