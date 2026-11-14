import { stepGrading, type PatternDocument, type Piece, type Segment } from "./pattern";
import type { Point } from "./polygon";

/**
 * Edição da gradação. Lembrete do modelo: as coordenadas de cada ponto são as
 * do tamanho base; `grading[ponto][tamanho]` é o deslocamento em relação a ele.
 */

const round = (v: number) => Math.round(v * 10) / 10 + 0; // décimo de mm, sem -0
const ZERO: Point = { x: 0, y: 0 };
const TOLERANCE = 0.05; // mm

function mapPieces(doc: PatternDocument, fn: (p: Piece) => Piece): PatternDocument {
  return { ...doc, pieces: doc.pieces.map(fn) };
}

function withGrading(piece: Piece, grading: Record<string, Record<string, Point>>): Piece {
  const clean: Record<string, Record<string, Point>> = {};
  for (const [id, bySize] of Object.entries(grading)) {
    const kept = Object.fromEntries(Object.entries(bySize).filter(([, d]) => d.x !== 0 || d.y !== 0));
    if (Object.keys(kept).length) clean[id] = kept;
  }
  const next: Piece = { ...piece };
  if (Object.keys(clean).length) next.grading = clean;
  else delete next.grading;
  return next;
}

/**
 * Se o ponto anda o mesmo tanto a cada tamanho, devolve esse passo.
 * Sem gradação = passo zero. Gradação irregular = null.
 */
export function linearStep(piece: Piece, pointId: string, sizes: string[], baseSize: string): Point | null {
  const g = piece.grading?.[pointId];
  if (!g) return { ...ZERO };
  const base = sizes.indexOf(baseSize);
  if (base < 0) return null;
  const ref = sizes[base + 1] ? g[sizes[base + 1]!] ?? ZERO : sizes[base - 1] ? neg(g[sizes[base - 1]!] ?? ZERO) : ZERO;
  const expected = stepGrading(sizes, baseSize, ref);
  for (const size of sizes) {
    if (size === baseSize) continue;
    const d = g[size] ?? ZERO;
    const e = expected[size] ?? ZERO;
    if (Math.abs(d.x - e.x) > TOLERANCE || Math.abs(d.y - e.y) > TOLERANCE) return null;
  }
  return { x: round(ref.x), y: round(ref.y) };
}

const neg = (p: Point): Point => ({ x: -p.x + 0, y: -p.y + 0 });

/** O ponto anda `perStep` mm por tamanho (zero apaga a gradação do ponto). */
export function setPointStepGrading(doc: PatternDocument, pieceId: string, pointId: string, perStep: Point): PatternDocument {
  if (!Number.isFinite(perStep.x) || !Number.isFinite(perStep.y)) return doc;
  if (!doc.sizes.includes(doc.baseSize)) return doc;
  const step = { x: round(perStep.x), y: round(perStep.y) };
  return mapPieces(doc, (p) => {
    if (p.id !== pieceId || !(pointId in p.points)) return p;
    const grading = { ...(p.grading ?? {}) };
    grading[pointId] = stepGrading(doc.sizes, doc.baseSize, step);
    return withGrading(p, grading);
  });
}

/** Deslocamento de um ponto num tamanho específico (null = não se move nesse tamanho). */
export function setPointGrading(
  doc: PatternDocument,
  pieceId: string,
  pointId: string,
  size: string,
  delta: Point | null,
): PatternDocument {
  if (size === doc.baseSize || !doc.sizes.includes(size)) return doc;
  if (delta && (!Number.isFinite(delta.x) || !Number.isFinite(delta.y))) return doc;
  return mapPieces(doc, (p) => {
    if (p.id !== pieceId || !(pointId in p.points)) return p;
    const grading = { ...(p.grading ?? {}) };
    const bySize = { ...(grading[pointId] ?? {}) };
    if (delta) bySize[size] = { x: round(delta.x), y: round(delta.y) };
    else delete bySize[size];
    grading[pointId] = bySize;
    return withGrading(p, grading);
  });
}

/**
 * Troca a lista de tamanhos (incluir, tirar, reordenar). O tamanho base precisa
 * continuar na lista; para trocar o base use `setBaseSize`.
 * Pontos com passo regular continuam regulares na grade nova (um tamanho novo
 * ganha o passo); os irregulares mantêm os valores dos tamanhos que ficaram.
 */
export function setSizes(doc: PatternDocument, sizes: string[]): PatternDocument {
  const clean = sizes.map((s) => s.trim()).filter(Boolean);
  if (clean.length === 0 || new Set(clean).size !== clean.length || !clean.includes(doc.baseSize)) return doc;
  if (clean.length === doc.sizes.length && clean.every((s, i) => s === doc.sizes[i])) return doc;

  const next = { ...doc, sizes: clean };
  return mapPieces(next, (p) => {
    if (!p.grading) return p;
    const grading: Record<string, Record<string, Point>> = {};
    for (const [id, bySize] of Object.entries(p.grading)) {
      const step = linearStep(p, id, doc.sizes, doc.baseSize);
      if (step) {
        grading[id] = stepGrading(clean, doc.baseSize, step);
      } else {
        grading[id] = Object.fromEntries(Object.entries(bySize).filter(([s]) => clean.includes(s)));
      }
    }
    return withGrading(p, grading);
  });
}

/**
 * Troca o tamanho base sem mudar nenhum tamanho: os pontos passam a ter as
 * coordenadas do novo base e todos os deslocamentos são recalculados a partir dele.
 */
export function setBaseSize(doc: PatternDocument, newBase: string): PatternDocument {
  if (newBase === doc.baseSize || !doc.sizes.includes(newBase)) return doc;
  const old = doc.baseSize;
  return {
    ...mapPieces(doc, (p) => {
      const at = (id: string): Point => p.grading?.[id]?.[newBase] ?? ZERO;
      const points: Record<string, Point> = {};
      for (const [id, q] of Object.entries(p.points)) {
        const d = at(id);
        points[id] = { x: round(q.x + d.x), y: round(q.y + d.y) };
      }
      let from = p.start;
      const outline = p.outline.map((seg): Segment => {
        const out: Segment =
          seg.kind === "line"
            ? seg
            : {
                ...seg,
                c1: { x: round(seg.c1.x + at(from).x), y: round(seg.c1.y + at(from).y) },
                c2: { x: round(seg.c2.x + at(seg.to).x), y: round(seg.c2.y + at(seg.to).y) },
              };
        from = seg.to;
        return out;
      });
      const grading: Record<string, Record<string, Point>> = {};
      for (const id of Object.keys(p.points)) {
        const shift = at(id);
        const bySize: Record<string, Point> = {};
        for (const size of doc.sizes) {
          if (size === newBase) continue;
          const d = size === old ? ZERO : p.grading?.[id]?.[size] ?? ZERO;
          bySize[size] = { x: round(d.x - shift.x), y: round(d.y - shift.y) };
        }
        grading[id] = bySize;
      }
      return withGrading({ ...p, points, outline }, grading);
    }),
    baseSize: newBase,
  };
}

/**
 * Adota a grade de uma tabela de medidas (lista e tamanho base).
 * Só dá para trocar o base para um tamanho que o molde já tem (senão não há
 * como saber onde ficam os pontos nele); nesse caso devolve o motivo.
 */
export function applyGrade(
  doc: PatternDocument,
  sizes: string[],
  baseSize: string,
): { doc: PatternDocument } | { error: string } {
  const clean = sizes.map((s) => s.trim()).filter(Boolean);
  if (clean.length === 0 || new Set(clean).size !== clean.length) return { error: "A tabela não tem uma grade válida." };
  if (!clean.includes(baseSize)) return { error: `O tamanho base ${baseSize} não está na grade da tabela.` };
  if (!doc.sizes.includes(baseSize)) {
    return {
      error: `O molde não tem o tamanho ${baseSize}. Acrescente ${baseSize} à grade do molde e gradue os pontos antes de adotar esta tabela.`,
    };
  }
  const rebased = setBaseSize(doc, baseSize);
  const next = setSizes(rebased, clean);
  if (next === rebased && (clean.length !== rebased.sizes.length || clean.some((s, i) => s !== rebased.sizes[i]))) {
    return { error: "Não foi possível aplicar a grade." };
  }
  return { doc: next };
}
