import { flattenCubic } from "./bezier";
import type { Finish, FinishArea, FinishKind, PatternDocument, Piece } from "./pattern";
import { distance, signedArea, type Point } from "./polygon";

/**
 * Acabamentos da parte (formato 5; bordado e pedraria no 7): pesponto e zíper
 * num segmento; etiqueta, estampa e bordado num retângulo preso a um ponto;
 * pedraria nos dois jeitos (ao longo de um segmento ou num retângulo). Funções puras: devolvem documento
 * novo. O desenho (`finishShapes`) sai em mm, nas coordenadas do molde, para o
 * editor e para a Prova.
 */

/** Distância entre as carreiras do pesponto duplo, em mm. */
export const FINISH_ROW_GAP = 6;
/** Largura da faixa do zíper desenhada, em mm. */
export const ZIPPER_WIDTH = 10;
/** Tamanho máximo da imagem da estampa em data URL, em caracteres (cerca de 150 KB). */
export const FINISH_IMAGE_MAX = 200_000;
/** Texto da etiqueta, até quantos caracteres. */
export const LABEL_TEXT_MAX = 40;
/** Diâmetro da pedra, em mm (de chaton miúdo a pedra grande). */
export const STONE_RANGE = { min: 2, max: 12 } as const;
/** Distância máxima entre os centros das pedras, em mm. */
export const STONE_SPACING_MAX = 100;
/** Pedras por acabamento, no máximo (a Prova desenha cada uma). */
export const PEDRARIA_MAX_STONES = 1500;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const FINISH_NAME: Record<FinishKind, string> = {
  pesponto: "Pesponto",
  ziper: "Zíper",
  etiqueta: "Etiqueta",
  estampa: "Estampa",
  bordado: "Bordado",
  pedraria: "Pedraria",
};

const IMAGE_PREFIX = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;

const finitePoint = (p: Point | undefined) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);

/** Problemas dos acabamentos de uma parte, em português. */
export function validateFinishes(piece: Piece): string[] {
  if (piece.finishes === undefined) return [];
  const nome = piece.name || piece.id;
  if (!Array.isArray(piece.finishes)) return [`${nome}: a lista de acabamentos é inválida.`];
  const erros: string[] = [];
  const ids = new Set<string>();
  piece.finishes.forEach((f, n) => {
    const qual = `${nome}: acabamento ${n + 1}`;
    if (!f || typeof f !== "object" || typeof f.id !== "string" || f.id === "") {
      erros.push(`${qual} tem formato inválido.`);
      return;
    }
    if (ids.has(f.id)) erros.push(`${qual}: id repetido (${f.id}).`);
    ids.add(f.id);
    if (f.kind === "pedraria") {
      if (!Number.isFinite(f.stone) || f.stone < STONE_RANGE.min || f.stone > STONE_RANGE.max) {
        erros.push(`${qual}: pedra de ${STONE_RANGE.min} a ${STONE_RANGE.max} mm.`);
      }
      if (!Number.isFinite(f.spacing) || f.spacing < f.stone || f.spacing > STONE_SPACING_MAX) {
        erros.push(`${qual}: distância entre pedras de um diâmetro a ${STONE_SPACING_MAX} mm.`);
      }
      if (typeof f.color !== "string" || !HEX_COLOR.test(f.color)) erros.push(`${qual}: cor da pedra inválida.`);
      const before = erros.length;
      if ("segment" in f) {
        if (!Number.isInteger(f.segment) || f.segment < 0 || f.segment >= piece.outline.length) erros.push(`${qual}: o segmento não existe.`);
        else if (piece.fold === f.segment) erros.push(`${qual}: a dobra não leva pedraria (ela não é borda do tecido).`);
        if (!Number.isFinite(f.distance) || f.distance < 0 || f.distance > 50) erros.push(`${qual}: distância da borda fora de 0 a 50 mm.`);
        if (!Number.isFinite(f.from) || !Number.isFinite(f.to) || f.from < 0 || f.to > 1 || f.to - f.from < 0.01) {
          erros.push(`${qual}: trecho da pedraria inválido.`);
        }
      } else {
        erros.push(...areaErrors(piece, f, qual));
      }
      if (erros.length === before && Number.isFinite(f.spacing) && f.spacing > 0 && stoneCount(piece, f) > PEDRARIA_MAX_STONES) {
        erros.push(`${qual}: até ${PEDRARIA_MAX_STONES} pedras por acabamento (aumente a distância entre elas).`);
      }
      return;
    }
    if (f.kind === "pesponto" || f.kind === "ziper") {
      if (!Number.isInteger(f.segment) || f.segment < 0 || f.segment >= piece.outline.length) {
        erros.push(`${qual}: o segmento não existe.`);
      } else if (piece.fold === f.segment) {
        erros.push(`${qual}: a dobra não leva ${f.kind === "ziper" ? "zíper" : "pesponto"} (ela não é borda do tecido).`);
      }
      if (f.kind === "pesponto") {
        if (!Number.isFinite(f.distance) || f.distance < 0 || f.distance > 50) erros.push(`${qual}: distância do pesponto fora de 0 a 50 mm.`);
        if (f.rows !== 1 && f.rows !== 2) erros.push(`${qual}: o pesponto tem 1 ou 2 carreiras.`);
      } else if (!Number.isFinite(f.from) || !Number.isFinite(f.to) || f.from < 0 || f.to > 1 || f.to - f.from < 0.01) {
        erros.push(`${qual}: trecho do zíper inválido.`);
      }
      return;
    }
    if (f.kind === "etiqueta" || f.kind === "estampa" || f.kind === "bordado") {
      erros.push(...areaErrors(piece, f, qual));
      if (f.kind === "etiqueta" && (typeof f.text !== "string" || f.text.length > LABEL_TEXT_MAX)) {
        erros.push(`${qual}: o texto da etiqueta tem até ${LABEL_TEXT_MAX} caracteres.`);
      }
      if ((f.kind === "estampa" || f.kind === "bordado") && (typeof f.image !== "string" || f.image.length > FINISH_IMAGE_MAX || !IMAGE_PREFIX.test(f.image))) {
        erros.push(`${qual}: a imagem ${f.kind === "bordado" ? "do bordado" : "da estampa"} precisa ser PNG, JPEG ou WebP de até ${Math.round((FINISH_IMAGE_MAX * 3) / 4 / 1000)} KB.`);
      }
      return;
    }
    erros.push(`${qual}: tipo desconhecido.`);
  });
  return erros;
}

/** Problemas do retângulo de um acabamento de área (ponto, deslocamento, tamanho, rotação). */
function areaErrors(piece: Piece, f: FinishArea, qual: string): string[] {
  const erros: string[] = [];
  if (!(f.anchor in piece.points)) erros.push(`${qual}: o ponto de referência ${f.anchor} não existe.`);
  if (!finitePoint(f.offset) || Math.abs(f.offset.x) > 2000 || Math.abs(f.offset.y) > 2000) erros.push(`${qual}: deslocamento inválido.`);
  for (const side of [f.width, f.height]) {
    if (!Number.isFinite(side) || side < 5 || side > 1000) erros.push(`${qual}: largura e altura entre 5 e 1000 mm.`);
  }
  if (!Number.isFinite(f.rotation) || Math.abs(f.rotation) > 360) erros.push(`${qual}: rotação inválida.`);
  return erros;
}

// ---------------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------------

/** Acabamento novo, sem o id (o id é dado pela parte). */
export type NewFinish = Finish extends infer F ? (F extends Finish ? Omit<F, "id"> : never) : never;

function withPiece(doc: PatternDocument, pieceId: string, fn: (p: Piece) => Piece | null): PatternDocument {
  let changed = false;
  const pieces = doc.pieces.map((p) => {
    if (p.id !== pieceId) return p;
    const next = fn(p);
    if (!next || next === p) return p;
    changed = true;
    return next;
  });
  return changed ? { ...doc, pieces } : doc;
}

function setFinishes(p: Piece, list: Finish[]): Piece {
  const next = { ...p };
  if (list.length > 0) next.finishes = list;
  else delete next.finishes;
  return next;
}

/** Põe um acabamento na parte. Recusa (devolve o mesmo documento e id null) se ele não validar. */
export function addFinish(doc: PatternDocument, pieceId: string, finish: NewFinish): { doc: PatternDocument; finishId: string | null } {
  let created: string | null = null;
  const next = withPiece(doc, pieceId, (p) => {
    const used = new Set((p.finishes ?? []).map((f) => f.id));
    let n = 1;
    while (used.has(`A${n}`)) n++;
    const candidate = setFinishes(p, [...(p.finishes ?? []), { ...finish, id: `A${n}` } as Finish]);
    if (validateFinishes(candidate).length > 0) return null;
    created = `A${n}`;
    return candidate;
  });
  return { doc: next, finishId: created };
}

/** Muda campos de um acabamento (não o tipo nem o id). Recusa o que não validar. */
export function updateFinish(doc: PatternDocument, pieceId: string, finishId: string, patch: Partial<NewFinish>): PatternDocument {
  return withPiece(doc, pieceId, (p) => {
    const list = p.finishes ?? [];
    const i = list.findIndex((f) => f.id === finishId);
    if (i < 0) return null;
    const merged = { ...list[i]!, ...patch, id: finishId, kind: list[i]!.kind } as Finish;
    const candidate = setFinishes(
      p,
      list.map((f, k) => (k === i ? merged : f)),
    );
    return validateFinishes(candidate).length > 0 ? null : candidate;
  });
}

/** Tira um acabamento da parte. */
export function removeFinish(doc: PatternDocument, pieceId: string, finishId: string): PatternDocument {
  return withPiece(doc, pieceId, (p) => {
    const list = p.finishes ?? [];
    const kept = list.filter((f) => f.id !== finishId);
    return kept.length === list.length ? null : setFinishes(p, kept);
  });
}

/**
 * Acompanha uma renumeração de segmentos da parte (como as costuras): o
 * pesponto, o zíper e a pedraria de borda mudam de índice ou, com o segmento
 * desfeito (null), saem. Os de área não dependem de segmento.
 */
export function remapFinishes(p: Piece, map: (segment: number) => number | null): Piece {
  if (!p.finishes) return p;
  let changed = false;
  const list: Finish[] = [];
  for (const f of p.finishes) {
    if (!("segment" in f)) {
      list.push(f);
      continue;
    }
    const to = map(f.segment);
    if (to === f.segment) list.push(f);
    else {
      changed = true;
      if (to !== null) list.push({ ...f, segment: to });
    }
  }
  return changed ? setFinishes(p, list) : p;
}

/** Tira os acabamentos presos a um ponto que deixou de existir. */
export function dropFinishesAt(p: Piece, pointId: string): Piece {
  if (!p.finishes?.some((f) => "anchor" in f && f.anchor === pointId)) return p;
  return setFinishes(
    p,
    p.finishes.filter((f) => !("anchor" in f && f.anchor === pointId)),
  );
}

// ---------------------------------------------------------------------------
// Desenho (mm, coordenadas do molde)
// ---------------------------------------------------------------------------

/** O desenho de um acabamento: linhas (pesponto, eixo do zíper) e polígonos (faixa, retângulo). */
export type FinishShape =
  | { id: string; kind: "pesponto"; lines: Point[][] }
  | { id: string; kind: "ziper"; band: Point[]; axis: Point[] }
  | {
      id: string;
      kind: "pedraria";
      stones: Point[];
      radius: number;
      color: string;
      /** Ao longo de um segmento: segue a borda nas duas metades da dobra, como o pesponto. */
      edge: boolean;
    }
  | {
      id: string;
      kind: "etiqueta" | "estampa" | "bordado";
      corners: [Point, Point, Point, Point];
      center: Point;
      rotation: number;
      width: number;
      height: number;
    };

/** Pontos de um segmento do contorno, do início ao fim (curva achatada). */
export function segmentPolyline(piece: Piece, index: number, tolerance = 0.2): Point[] {
  const seg = piece.outline[index];
  if (!seg) return [];
  const from = piece.points[index === 0 ? piece.start : piece.outline[index - 1]!.to]!;
  const to = piece.points[seg.to]!;
  if (seg.kind === "line") return [from, to];
  return [from, ...flattenCubic({ p0: from, c1: seg.c1, c2: seg.c2, p3: to }, tolerance)];
}

/** O trecho [a, b] (frações do comprimento) de uma polilinha. */
export function slicePolyline(line: readonly Point[], a: number, b: number): Point[] {
  const lens = [0];
  for (let i = 1; i < line.length; i++) lens.push(lens[i - 1]! + distance(line[i - 1]!, line[i]!));
  const total = lens.at(-1)!;
  if (total === 0) return [...line];
  const at = (s: number): Point => {
    const d = Math.max(0, Math.min(1, s)) * total;
    let i = 1;
    while (i < line.length - 1 && lens[i]! < d) i++;
    const span = lens[i]! - lens[i - 1]!;
    const t = span > 0 ? (d - lens[i - 1]!) / span : 0;
    return { x: line[i - 1]!.x + (line[i]!.x - line[i - 1]!.x) * t, y: line[i - 1]!.y + (line[i]!.y - line[i - 1]!.y) * t };
  };
  const out = [at(a)];
  for (let i = 1; i < line.length - 1; i++) if (lens[i]! > a * total && lens[i]! < b * total) out.push(line[i]!);
  out.push(at(b));
  return out;
}

/**
 * Desloca a polilinha `mm` para dentro da parte (`inward` = +1 se o interior
 * fica à esquerda do sentido do contorno). Junta as normais das arestas
 * vizinhas em cada vértice; o bastante para pespontos de poucos mm.
 */
export function offsetPolyline(line: readonly Point[], mm: number, inward: 1 | -1): Point[] {
  const normals: Point[] = [];
  for (let i = 1; i < line.length; i++) {
    const dx = line[i]!.x - line[i - 1]!.x;
    const dy = line[i]!.y - line[i - 1]!.y;
    const len = Math.hypot(dx, dy) || 1;
    normals.push({ x: (-dy / len) * inward, y: (dx / len) * inward });
  }
  return line.map((p, i) => {
    const a = normals[Math.max(0, i - 1)]!;
    const b = normals[Math.min(normals.length - 1, i)]!;
    let nx = a.x + b.x;
    let ny = a.y + b.y;
    const len = Math.hypot(nx, ny);
    if (len < 1e-9) {
      nx = b.x;
      ny = b.y;
    } else {
      // Miter: mantém a distância da reta nas duas arestas (limitado em canto agudo).
      const cos = Math.max(0.5, (a.x * b.x + a.y * b.y + 1) / 2);
      nx = nx / len / Math.sqrt(cos);
      ny = ny / len / Math.sqrt(cos);
    }
    return { x: p.x + nx * mm, y: p.y + ny * mm };
  });
}

/** +1 se o interior da parte fica à esquerda de quem anda pelo contorno, −1 se à direita. */
export function interiorSide(piece: Piece): 1 | -1 {
  const poly: Point[] = [];
  piece.outline.forEach((_, i) => poly.push(...segmentPolyline(piece, i).slice(0, -1)));
  return signedArea(poly) >= 0 ? 1 : -1;
}

/** Centro e cantos do retângulo de uma etiqueta ou estampa (sentido: −x−y, +x−y, +x+y, −x+y antes da rotação). */
export function areaCorners(piece: Piece, f: FinishArea): { center: Point; corners: [Point, Point, Point, Point] } {
  const a = piece.points[f.anchor] ?? { x: 0, y: 0 };
  const center = { x: a.x + f.offset.x, y: a.y + f.offset.y };
  const r = (f.rotation * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const c = (dx: number, dy: number): Point => ({ x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos });
  const w = f.width / 2;
  const h = f.height / 2;
  return { center, corners: [c(-w, -h), c(w, -h), c(w, h), c(-w, h)] };
}

/**
 * O desenho de cada acabamento da parte (use a parte já no tamanho, por
 * `pieceAtSize`, para a gradação). Acabamento que não dá para desenhar (segmento
 * que sumiu) fica de fora.
 */
export function finishShapes(piece: Piece): FinishShape[] {
  const out: FinishShape[] = [];
  const side = interiorSide(piece);
  for (const f of piece.finishes ?? []) {
    if (f.kind === "pesponto") {
      const line = segmentPolyline(piece, f.segment);
      if (line.length < 2) continue;
      const rows = f.rows === 2 ? [f.distance, f.distance + FINISH_ROW_GAP] : [f.distance];
      out.push({ id: f.id, kind: "pesponto", lines: rows.map((mm) => offsetPolyline(line, mm, side)) });
    } else if (f.kind === "ziper") {
      const line = segmentPolyline(piece, f.segment);
      if (line.length < 2) continue;
      const part = slicePolyline(line, f.from, f.to);
      const inner = offsetPolyline(part, ZIPPER_WIDTH, side);
      out.push({ id: f.id, kind: "ziper", band: [...part, ...inner.reverse()], axis: offsetPolyline(part, ZIPPER_WIDTH / 2, side) });
    } else if (f.kind === "pedraria") {
      const stones = pedrariaStones(piece, f, side);
      if (stones.length === 0) continue;
      out.push({ id: f.id, kind: "pedraria", stones, radius: f.stone / 2, color: f.color, edge: "segment" in f });
    } else {
      const { center, corners } = areaCorners(piece, f);
      out.push({ id: f.id, kind: f.kind, corners, center, rotation: f.rotation, width: f.width, height: f.height });
    }
  }
  return out;
}

/** Ponto do segmento na fração t do comprimento (para pôr o zíper ou mostrar onde fica). */
export function pointOnSegment(piece: Piece, index: number, t: number): Point | null {
  if (!piece.outline[index]) return null;
  // Pelo comprimento (curva achatada), não pelo parâmetro da Bézier.
  return slicePolyline(segmentPolyline(piece, index), t, t)[0] ?? null;
}

// ---------------------------------------------------------------------------
// Na Prova (peças abertas pela dobra e pares)
// ---------------------------------------------------------------------------

/**
 * Um acabamento numa peça da Prova (`piece` é o id da peça da Prova: a parte
 * aberta pela dobra ou a cópia do par), já nas coordenadas dela. `mirrored`:
 * o desenho é o espelho do molde (metade espelhada da dobra ou cópia do par).
 */
export type GarmentFinish = {
  piece: string;
  finishId: string;
  shape: FinishShape;
  mirrored: boolean;
  /** Estampa: a imagem. */
  image?: string;
  /** Etiqueta: o texto. */
  text?: string;
};

/**
 * O desenho com cada ponto passado por `fn`. Num espelho, a etiqueta troca a
 * ordem dos cantos para o texto continuar legível; a estampa fica espelhada,
 * como a peça (é o que sai no tecido cortado em par).
 */
export function mapFinishShape(shape: FinishShape, fn: (p: Point) => Point, mirror: boolean): FinishShape {
  const line = (l: readonly Point[]) => l.map(fn);
  if (shape.kind === "pesponto") return { ...shape, lines: shape.lines.map(line) };
  if (shape.kind === "ziper") return { ...shape, band: line(shape.band), axis: line(shape.axis) };
  if (shape.kind === "pedraria") return { ...shape, stones: line(shape.stones) };
  const c = shape.corners.map(fn) as [Point, Point, Point, Point];
  const corners: [Point, Point, Point, Point] = mirror && shape.kind === "etiqueta" ? [c[1], c[0], c[3], c[2]] : c;
  return { ...shape, corners, center: fn(shape.center) };
}

/** Imagem e texto do acabamento, para acompanhar o desenho. */
export function finishExtras(piece: Piece, finishId: string): { image?: string; text?: string } {
  const f = piece.finishes?.find((x) => x.id === finishId);
  if (f?.kind === "estampa" || f?.kind === "bordado") return { image: f.image };
  if (f?.kind === "etiqueta") return { text: f.text };
  return {};
}

// ---------------------------------------------------------------------------
// Pedraria
// ---------------------------------------------------------------------------

type Pedraria = Extract<Finish, { kind: "pedraria" }>;

/** Pontos a cada `spacing` mm ao longo da polilinha, centrados (sobra igual nas duas pontas). */
function alongLine(line: readonly Point[], spacing: number): Point[] {
  let total = 0;
  for (let i = 1; i < line.length; i++) total += distance(line[i - 1]!, line[i]!);
  if (line.length < 2 || total === 0) return line.slice(0, 1);
  const n = Math.floor(total / spacing);
  const start = (total - n * spacing) / 2;
  return Array.from({ length: n + 1 }, (_, k) => {
    const t = (start + k * spacing) / total;
    return slicePolyline(line, t, t)[0]!;
  });
}

/** Centros das pedras (mm, nas coordenadas da parte): ao longo da borda, ou em colmeia dentro do retângulo. */
export function pedrariaStones(piece: Piece, f: Pedraria, side: 1 | -1 = interiorSide(piece)): Point[] {
  if ("segment" in f) {
    const line = segmentPolyline(piece, f.segment);
    if (line.length < 2) return [];
    return alongLine(offsetPolyline(slicePolyline(line, f.from, f.to), f.distance, side), f.spacing);
  }
  const { center } = areaCorners(piece, f);
  const r = (f.rotation * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const half = f.stone / 2;
  const w = f.width / 2 - half;
  const h = f.height / 2 - half;
  if (w < 0 || h < 0) return [{ ...center }];
  const rowStep = (f.spacing * Math.sqrt(3)) / 2;
  const rows = Math.floor((2 * h) / rowStep);
  const out: Point[] = [];
  // Uma grade só (fileiras pares centradas, ímpares meio passo ao lado): vizinhas sempre a `spacing`.
  const cols = Math.floor((2 * w) / f.spacing);
  const x0 = (-cols * f.spacing) / 2;
  for (let j = 0; j <= rows; j++) {
    const y = -h + (2 * h - rows * rowStep) / 2 + j * rowStep;
    const shift = j % 2 === 1 ? f.spacing / 2 : 0;
    for (let i = -1; i <= cols; i++) {
      const x = x0 + shift + i * f.spacing;
      if (Math.abs(x) > w + 1e-9) continue;
      out.push({ x: center.x + x * cos - y * sin, y: center.y + x * sin + y * cos });
    }
  }
  return out.length > 0 ? out : [{ ...center }];
}

/** Quantas pedras o acabamento leva, por cima (para a trava de PEDRARIA_MAX_STONES), sem desenhar. */
function stoneCount(piece: Piece, f: Pedraria): number {
  if ("segment" in f) {
    const line = segmentPolyline(piece, f.segment);
    let total = 0;
    for (let i = 1; i < line.length; i++) total += distance(line[i - 1]!, line[i]!);
    return Math.floor((total * (f.to - f.from)) / f.spacing) + 1;
  }
  const rowStep = (f.spacing * Math.sqrt(3)) / 2;
  return (Math.floor(f.height / rowStep) + 1) * (Math.floor(f.width / f.spacing) + 1);
}
