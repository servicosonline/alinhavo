import { moveSegment, type PatternDocument, type SeamEdge } from "@alinhavo/geometry";
import { formatCm } from "../units";

/**
 * Ajuste feito na Prova: deslocar segmentos do molde para fora (mm positivo)
 * ou para dentro (negativo). A geometria é a de `moveSegment`; aqui só se
 * aplica a lista e se escreve a descrição da versão nova.
 */
export type ProvaAdjustment = { edges: SeamEdge[]; mm: number };

export type AppliedAdjustment = {
  doc: PatternDocument;
  /** Descrição da versão, ex.: "Prova: +4 cm em Frente (segmento 3) e Costas (segmento 3)". */
  message: string;
  applied: SeamEdge[];
  /** Segmentos que não puderam ser movidos (dobra, ou encurtar mais do que a peça mede). */
  skipped: SeamEdge[];
};

export function applyProvaAdjustment(doc: PatternDocument, adj: ProvaAdjustment): AppliedAdjustment {
  let next = doc;
  const applied: SeamEdge[] = [];
  const skipped: SeamEdge[] = [];
  const seen = new Set<string>();
  for (const edge of adj.edges) {
    const key = `${edge.piece}#${edge.segment}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const moved = moveSegment(next, edge.piece, edge.segment, adj.mm);
    if (moved === next) skipped.push(edge);
    else {
      applied.push(edge);
      next = moved;
    }
  }
  return { doc: next, message: describeAdjustment(doc, applied, adj.mm), applied, skipped };
}

/** Descrição em português, com cm e vírgula. Vazia se nada foi aplicado. */
export function describeAdjustment(doc: PatternDocument, edges: SeamEdge[], mm: number): string {
  if (edges.length === 0) return "";
  const names = edges.map((e) => {
    const piece = doc.pieces.find((p) => p.id === e.piece);
    return `${piece?.name ?? e.piece} (segmento ${e.segment + 1})`;
  });
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
  return `Prova: ${mm > 0 ? "+" : "−"}${formatCm(Math.abs(mm))} cm em ${list}`;
}
