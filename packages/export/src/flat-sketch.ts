import {
  finishShapes,
  flattenOutline,
  unfoldPiece,
  type FinishShape,
  type PatternDocument,
  type Piece,
  type Point,
  type BodyAnchor,
} from "@alinhavo/geometry";
import { FillRule, intersect, union, type Path64 } from "clipper2-ts";

/**
 * Desenho técnico plano (Fase 6b): a peça montada, vista de frente e de
 * costas, feita das partes do molde no tamanho base. Sem IA: geometria pura.
 *
 * - As partes com posição "frente" vão para a vista de frente; "costas", para
 *   a de costas. Partes laterais (esquerda/direita) ficam de fora, avisadas.
 * - Parte na dobra: aberta pela dobra, centrada nela.
 * - Cortar par: a parte e o espelho se encontram na linha do centro, o alto do
 *   segmento costurado com o próprio par (gancho); sem esse segmento, a borda
 *   do lado do centro (à esquerda na frente, à direita nas costas, como o
 *   desenho do molde é feito). O que passa do centro (ponta do gancho) fica
 *   escondido e, nas pernas, a entreperna desce do gancho até perto do
 *   centro na barra (`pairHalf`), para as pernas ficarem separadas.
 * - Altura: pela referência da posição (ombro, busto, cintura, quadril) numa
 *   tabela de um corpo padrão, mais o ajuste da posição.
 * - Contorno de fora = união das partes; as partes ficam como costuras finas.
 *
 * Coordenadas em mm, Y para baixo (como o molde e o SVG), centro em x = 0.
 */

/** Quanto cada referência fica abaixo do alto do ombro, em mm (corpo padrão de 1,65 m). */
export const SKETCH_ANCHOR_DROP: Record<BodyAnchor, number> = { ombro: 0, busto: 220, cintura: 380, quadril: 570 };

export type SketchSide = "frente" | "costas";

export type SketchMark =
  | { kind: "pesponto"; lines: Point[][] }
  | { kind: "ziper"; band: Point[]; axis: Point[] }
  | { kind: "etiqueta" | "estampa"; corners: Point[]; label: string };

export type SketchView = {
  side: SketchSide;
  /** Contorno de fora (união das partes); pode ter mais de um pedaço. */
  outline: Point[][];
  /** Contorno de cada parte (linhas de costura internas). */
  pieces: Point[][];
  marks: SketchMark[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
};

export type FlatSketch = {
  schema: 1;
  views: SketchView[];
  /** Partes que ficaram fora do desenho (sem posição ou laterais). */
  skipped: string[];
};

const r1 = (v: number) => Math.round(v * 10) / 10 + 0;
const rp = (p: Point): Point => ({ x: r1(p.x), y: r1(p.y) });

/** Linha do centro de uma parte de cortar par: x do alto do gancho, ou a borda do lado do centro. */
function pairCenterX(doc: PatternDocument, piece: Piece, side: SketchSide): number {
  const outline = flattenOutline(piece, 0.5);
  const self = doc.seams.find((s) => s.a.piece === piece.id && s.b.piece === piece.id && s.a.segment === s.b.segment);
  if (self) {
    const pts = outline.polygon.filter(
      (_, i) =>
        outline.edgeSegment[i] === self.a.segment ||
        outline.edgeSegment[(i - 1 + outline.edgeSegment.length) % outline.edgeSegment.length] === self.a.segment,
    );
    if (pts.length > 0) return pts.reduce((best, p) => (p.y < best.y ? p : best)).x;
  }
  const xs = outline.polygon.map((p) => p.x);
  return side === "frente" ? Math.min(...xs) : Math.max(...xs);
}

/** Distância da entreperna até o centro, na barra, no desenho (cada perna), em mm. */
export const SKETCH_LEG_GAP = 15;

const toPath = (pts: readonly Point[]): Path64 => pts.map((p) => ({ x: Math.round(p.x * 10), y: Math.round(p.y * 10) }));
const fromPath = (path: Path64): Point[] => path.map((q) => ({ x: q.x / 10, y: q.y / 10 }));

/**
 * A metade de cortar par como aparece na vista plana (coordenadas já com o
 * centro em x = 0). Fica só o lado da própria parte: o que passa do centro
 * sai. Numa perna (`leg`), abaixo da ponta do gancho, a entreperna do desenho
 * desce em reta do centro, na altura do gancho, até SKETCH_LEG_GAP mm do
 * centro na barra (se a entreperna do molde já fica mais para fora, vale ela):
 * sem isso, a ponta do gancho e a entreperna do molde, que passam do centro,
 * juntariam as duas pernas numa saia.
 */
export function pairHalf(poly: readonly Point[], leg: boolean): Point[][] {
  const s = poly.reduce((sum, p) => sum + p.x, 0) >= 0 ? 1 : -1; // de que lado do centro a parte fica
  const ys = poly.map((p) => p.y);
  const y0 = Math.min(...ys) - 100;
  const y1 = Math.max(...ys) + 100;
  const far = 100_000;
  let inner: Point[];
  if (leg) {
    // Ponta do gancho: o ponto que mais avança para o lado do centro.
    const tip = poly.reduce((best, p) => (s * p.x < s * best.x ? p : best));
    const hem = Math.max(...ys);
    const span = Math.max(1, hem - tip.y);
    inner = [
      { x: 0, y: y0 },
      { x: 0, y: tip.y },
      { x: (SKETCH_LEG_GAP * (y1 - tip.y)) / span, y: y1 },
    ];
  } else {
    inner = [
      { x: 0, y: y0 },
      { x: 0, y: y1 },
    ];
  }
  // Região que fica: do lado da parte, além da linha `inner` (espelhada para o lado certo).
  const region = [...inner, { x: far, y: y1 }, { x: far, y: y0 }].map((p) => ({ x: s * p.x, y: p.y }));
  return intersect([toPath(poly)], [toPath(region)], FillRule.NonZero).map(fromPath);
}

/** Centro de uma parte na dobra: o meio do segmento da dobra (dobra vertical, como no centro da frente). */
function foldCenterX(piece: Piece): number {
  const f = piece.fold!;
  const from = piece.points[f === 0 ? piece.start : piece.outline[f - 1]!.to]!;
  const to = piece.points[piece.outline[f]!.to]!;
  return (from.x + to.x) / 2;
}

function mapShape(shape: FinishShape, fn: (p: Point) => Point, labels: Map<string, string>): SketchMark {
  const line = (l: readonly Point[]) => l.map((p) => rp(fn(p)));
  if (shape.kind === "pesponto") return { kind: "pesponto", lines: shape.lines.map(line) };
  if (shape.kind === "ziper") return { kind: "ziper", band: line(shape.band), axis: line(shape.axis) };
  return { kind: shape.kind, corners: line(shape.corners), label: labels.get(shape.id) ?? (shape.kind === "estampa" ? "Estampa" : "Etiqueta") };
}

/** O desenho plano do molde (no tamanho base). Sem parte de frente nem de costas, sem vistas. */
export function flatSketch(doc: PatternDocument): FlatSketch {
  const skipped: string[] = [];
  const bySide: Record<SketchSide, { outlines: Point[][]; marks: SketchMark[] }> = {
    frente: { outlines: [], marks: [] },
    costas: { outlines: [], marks: [] },
  };

  for (const piece of doc.pieces) {
    const side = piece.placement?.side;
    if (side !== "frente" && side !== "costas") {
      skipped.push(piece.name || piece.id);
      continue;
    }
    const top = Math.min(...Object.values(piece.points).map((p) => p.y));
    const drop = SKETCH_ANCHOR_DROP[piece.placement!.anchor] - piece.placement!.offset;
    const labels = new Map(
      (piece.finishes ?? []).flatMap((f) =>
        f.kind === "etiqueta"
          ? [[f.id, f.text ? `Etiqueta "${f.text}"` : "Etiqueta"] as const]
          : f.kind === "estampa"
            ? [[f.id, "Estampa"] as const]
            : [],
      ),
    );
    const shapes = finishShapes(piece);
    const target = bySide[side];

    if (piece.fold !== undefined) {
      // Aberta pela dobra: a peça inteira, simétrica em volta da linha da dobra.
      const cx = foldCenterX(piece);
      const at = (p: Point): Point => ({ x: p.x - cx, y: p.y - top + drop });
      const mirror = (p: Point): Point => ({ x: cx - p.x, y: p.y - top + drop });
      target.outlines.push(flattenOutline(unfoldPiece(piece).piece, 0.5).polygon.map((p) => rp(at(p))));
      for (const s of shapes) {
        target.marks.push(mapShape(s, at, labels));
        if (s.kind === "pesponto" || s.kind === "ziper") target.marks.push(mapShape(s, mirror, labels));
      }
    } else if (piece.cutPair) {
      // A parte e o espelho, encontrando-se na linha do centro. O que passa do
      // centro (a ponta do gancho) fica escondido na vista plana: a parte é
      // cortada pela linha do centro e, na perna, abaixo do gancho, pela
      // entreperna do desenho (ver pairHalf).
      const cx = pairCenterX(doc, piece, side);
      const at = (p: Point): Point => ({ x: p.x - cx, y: p.y - top + drop });
      const mirror = (p: Point): Point => ({ x: cx - p.x, y: p.y - top + drop });
      const halves = pairHalf(
        flattenOutline(piece, 0.5).polygon.map((p) => at(p)),
        piece.placement?.leg !== undefined,
      );
      for (const h of halves) target.outlines.push(h.map(rp), h.map((p) => rp({ x: -p.x, y: p.y })).reverse());
      for (const s of shapes) target.marks.push(mapShape(s, at, labels), mapShape(s, mirror, labels));
    } else {
      // Parte inteira: centrada na caixa dela.
      const xs = Object.values(piece.points).map((p) => p.x);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const at = (p: Point): Point => ({ x: p.x - cx, y: p.y - top + drop });
      target.outlines.push(flattenOutline(piece, 0.5).polygon.map((p) => rp(at(p))));
      for (const s of shapes) target.marks.push(mapShape(s, at, labels));
    }
  }

  const views: SketchView[] = [];
  for (const side of ["frente", "costas"] as const) {
    const { outlines, marks } = bySide[side];
    if (outlines.length === 0) continue;
    // União em décimos de mm (inteiros para o clipper).
    const merged = union(outlines.map(toPath), FillRule.NonZero).map(fromPath);
    const all = [...outlines.flat(), ...merged.flat()];
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    views.push({
      side,
      outline: merged,
      pieces: outlines,
      marks,
      bounds: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) },
    });
  }
  return { schema: 1, views, skipped };
}

/** Caminho SVG de uma linha (fechada ou aberta), em mm. */
export function sketchPath(points: readonly Point[], closed: boolean): string {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${r1(p.x)} ${r1(p.y)}`).join("") + (closed ? "Z" : "");
}

/** Lê o desenho guardado na ficha; null se não tem ou não é do formato. */
export function readFlatSketch(raw: unknown): FlatSketch | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<FlatSketch>;
  if (s.schema !== 1 || !Array.isArray(s.views) || !Array.isArray(s.skipped)) return null;
  return s as FlatSketch;
}
