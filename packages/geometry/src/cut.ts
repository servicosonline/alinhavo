import { flattenOutline, pieceAtSize, type PatternDocument } from "./pattern";
import { polygonArea } from "./polygon";
import { seamAllowanceOutline } from "./seam-allowance";
import { unfoldPiece } from "./unfold";

/** Uma parte como vai para o corte, num tamanho. */
export type CutPiece = {
  pieceId: string;
  name: string;
  /** Quantas vezes é cortada (cortar par = 2, a segunda espelhada). */
  quantity: number;
  /** Cortada no tecido dobrado. */
  onFold: boolean;
  /** Área de corte de UMA peça aberta (com margem), em mm². */
  cutArea: number;
  /** Área da peça pronta (linha de costura) aberta, em mm². */
  sewnArea: number;
  /** Largura e comprimento da peça aberta, com margem (caixa), em mm. */
  width: number;
  length: number;
};

/**
 * As partes do molde como vão para o corte num tamanho: quantidade, dobra,
 * área e tamanho da peça aberta. Peça na dobra conta inteira (o tecido
 * gasto é o da peça aberta). Base da ficha técnica e do consumo estimado.
 */
export function cutPieces(doc: PatternDocument, size: string = doc.baseSize): CutPiece[] {
  return doc.pieces.map((p) => {
    const open = unfoldPiece(pieceAtSize(p, size)).piece;
    const cut = seamAllowanceOutline(open);
    const xs = cut.map((q) => q.x);
    const ys = cut.map((q) => q.y);
    return {
      pieceId: p.id,
      name: p.name,
      quantity: p.cutPair ? 2 : 1,
      onFold: p.fold !== undefined,
      cutArea: polygonArea(cut),
      sewnArea: polygonArea(flattenOutline(open).polygon),
      width: Math.max(...xs) - Math.min(...xs),
      length: Math.max(...ys) - Math.min(...ys),
    };
  });
}

/** Soma da área de corte de todas as peças (vezes a quantidade), em mm². */
export function totalCutArea(pieces: readonly CutPiece[]): number {
  return pieces.reduce((s, p) => s + p.cutArea * p.quantity, 0);
}
