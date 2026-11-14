import { cubicLength, flattenCubic } from "./bezier";
import { distance, type Point } from "./polygon";

/**
 * Documento do molde (versão 2). É o que fica salvo em pattern_versions.document.
 * Versões gravadas nunca são reescritas: documentos antigos passam por
 * `migratePattern` na leitura.
 *
 * Histórico do formato:
 * - 1: partes, pontos, curvas, gradação, margens e fio.
 * - 2: + `seams` (costuras: pares de segmentos que se unem na Prova).
 *
 * - Coordenadas em mm, do tamanho base.
 * - Cada parte tem um contorno fechado: começa em `start` e cada segmento vai
 *   até um ponto nomeado (`to`). O último segmento volta para `start`.
 * - Alças de curva (c1, c2) acompanham a gradação das pontas: c1 segue o ponto
 *   de onde o segmento sai, c2 segue o ponto aonde ele chega.
 * - Gradação: para cada ponto, o deslocamento em cada tamanho em relação ao base.
 */
export type LineSegment = { kind: "line"; to: string };
export type CubicSegment = { kind: "cubic"; c1: Point; c2: Point; to: string };
export type Segment = LineSegment | CubicSegment;

export type Piece = {
  id: string;
  name: string;
  points: Record<string, Point>;
  start: string;
  outline: Segment[];
  /** pointId → tamanho → deslocamento em mm. Tamanho ausente = não se move. */
  grading?: Record<string, Record<string, Point>>;
  /** Margem de costura padrão da parte, em mm. */
  seamAllowance: number;
  /** Margem por segmento do contorno (índice → mm). Sobrepõe a padrão. */
  seamAllowanceByEdge?: Record<number, number>;
  grainline?: { from: Point; to: Point };
};

/** Um lado de uma costura: o segmento `segment` do contorno da parte `piece`. */
export type SeamEdge = { piece: string; segment: number };

/**
 * Costura: dois segmentos que se unem. `opposite` (o comum) junta o início de
 * um com o fim do outro, como duas partes deitadas lado a lado; `same` junta
 * início com início.
 */
export type Seam = { id: string; a: SeamEdge; b: SeamEdge; direction: "opposite" | "same" };

export const CURRENT_SCHEMA = 2;

export type PatternDocument = {
  schema: 2;
  unit: "mm";
  sizes: string[];
  baseSize: string;
  pieces: Piece[];
  seams: Seam[];
};

/** Formato 1, só para leitura de versões antigas. */
export type PatternDocumentV1 = Omit<PatternDocument, "schema" | "seams"> & { schema: 1 };

/**
 * Converte um documento salvo (de qualquer versão conhecida) para o formato
 * atual, sem alterar o original. Devolve null se não for um documento de
 * molde ou se a versão for desconhecida. Não valida o conteúdo: passe o
 * resultado por `validatePattern`.
 */
export function migratePattern(raw: unknown): PatternDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (d.schema === 1) {
    const { schema: _schema, ...rest } = d as PatternDocumentV1;
    return { ...rest, schema: 2, seams: [] };
  }
  if (d.schema === 2) {
    return Array.isArray(d.seams) ? (d as PatternDocument) : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

const finite = (p: Point | undefined) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);

/** Lista os problemas do documento, em português. Lista vazia = documento válido. */
export function validatePattern(doc: PatternDocument): string[] {
  const erros: string[] = [];
  if (doc.schema !== CURRENT_SCHEMA) erros.push(`Versão de documento desconhecida: ${String(doc.schema)}.`);
  if (doc.unit !== "mm") erros.push("A unidade do documento precisa ser mm.");
  if (doc.sizes.length === 0) erros.push("A grade precisa de pelo menos um tamanho.");
  if (new Set(doc.sizes).size !== doc.sizes.length) erros.push("A grade tem tamanhos repetidos.");
  if (!doc.sizes.includes(doc.baseSize)) erros.push(`O tamanho base "${doc.baseSize}" não está na grade.`);

  const ids = new Set<string>();
  for (const piece of doc.pieces) {
    const nome = piece.name || piece.id;
    if (ids.has(piece.id)) erros.push(`Parte repetida: ${piece.id}.`);
    ids.add(piece.id);

    for (const [id, p] of Object.entries(piece.points)) {
      if (!finite(p)) erros.push(`${nome}: o ponto ${id} tem coordenada inválida.`);
    }
    if (!(piece.start in piece.points)) erros.push(`${nome}: o ponto inicial ${piece.start} não existe.`);
    if (piece.outline.length < 2) erros.push(`${nome}: o contorno precisa de pelo menos dois segmentos.`);
    piece.outline.forEach((seg, i) => {
      if (!(seg.to in piece.points)) erros.push(`${nome}: o segmento ${i + 1} vai para um ponto que não existe (${seg.to}).`);
      if (seg.kind === "cubic" && (!finite(seg.c1) || !finite(seg.c2))) {
        erros.push(`${nome}: o segmento ${i + 1} tem alça inválida.`);
      }
    });
    if (piece.outline.length > 0 && piece.outline.at(-1)?.to !== piece.start) {
      erros.push(`${nome}: o contorno não fecha (o último segmento precisa voltar ao ponto inicial).`);
    }

    const margens = [piece.seamAllowance, ...Object.values(piece.seamAllowanceByEdge ?? {})];
    if (margens.some((m) => !Number.isFinite(m) || m < 0 || m > 100)) {
      erros.push(`${nome}: margem de costura fora do intervalo 0 a 100 mm.`);
    }
    for (const k of Object.keys(piece.seamAllowanceByEdge ?? {})) {
      const i = Number(k);
      if (!Number.isInteger(i) || i < 0 || i >= piece.outline.length) {
        erros.push(`${nome}: margem definida para um segmento que não existe (${k}).`);
      }
    }

    for (const [pointId, porTamanho] of Object.entries(piece.grading ?? {})) {
      if (!(pointId in piece.points)) erros.push(`${nome}: gradação para um ponto que não existe (${pointId}).`);
      for (const [size, delta] of Object.entries(porTamanho)) {
        if (!doc.sizes.includes(size)) erros.push(`${nome}: gradação para um tamanho fora da grade (${size}).`);
        if (!finite(delta)) erros.push(`${nome}: gradação inválida em ${pointId}/${size}.`);
      }
    }
  }
  erros.push(...validateSeams(doc));
  return erros;
}

function validateSeams(doc: PatternDocument): string[] {
  if (!Array.isArray(doc.seams)) return ["A lista de costuras está faltando."];
  const erros: string[] = [];
  const byId = new Map(doc.pieces.map((p) => [p.id, p]));
  const seamIds = new Set<string>();
  const sewn = new Set<string>();
  doc.seams.forEach((seam, n) => {
    const nome = `Costura ${n + 1}`;
    if (!seam || typeof seam !== "object") {
      erros.push(`${nome}: formato inválido.`);
      return;
    }
    if (seamIds.has(seam.id)) erros.push(`${nome}: id repetido (${seam.id}).`);
    seamIds.add(seam.id);
    if (seam.direction !== "opposite" && seam.direction !== "same") erros.push(`${nome}: sentido inválido.`);
    const keys: string[] = [];
    for (const edge of [seam.a, seam.b]) {
      const piece = edge ? byId.get(edge.piece) : undefined;
      if (!piece) {
        erros.push(`${nome}: a parte ${edge?.piece ?? "?"} não existe.`);
        continue;
      }
      if (!Number.isInteger(edge.segment) || edge.segment < 0 || edge.segment >= piece.outline.length) {
        erros.push(`${nome}: ${piece.name || piece.id} não tem o segmento ${edge.segment + 1}.`);
        continue;
      }
      keys.push(`${edge.piece}#${edge.segment}`);
    }
    if (keys.length === 2 && keys[0] === keys[1]) erros.push(`${nome}: um segmento não pode ser costurado nele mesmo.`);
    for (const key of new Set(keys)) {
      if (sewn.has(key)) erros.push(`${nome}: o segmento já está em outra costura.`);
      sewn.add(key);
    }
  });
  return erros;
}

// ---------------------------------------------------------------------------
// Gradação
// ---------------------------------------------------------------------------

/**
 * Atalho para a regra mais comum: o ponto anda `perStep` mm a cada tamanho
 * acima do base (e o oposto abaixo). Ex.: grade P, M, G, base M, perStep x=5
 * → P: x −5, M: 0, G: +5.
 */
export function stepGrading(sizes: string[], baseSize: string, perStep: Point): Record<string, Point> {
  const base = sizes.indexOf(baseSize);
  if (base < 0) throw new Error(`Tamanho base "${baseSize}" fora da grade.`);
  const out: Record<string, Point> = {};
  sizes.forEach((size, i) => {
    const n = i - base;
    // `+ 0` troca -0 por 0 (0 × −1 dá -0, que vira 0 ao salvar e relê diferente)
    if (n !== 0) out[size] = { x: perStep.x * n + 0, y: perStep.y * n + 0 };
  });
  return out;
}

/** A parte no tamanho pedido, com pontos e alças já deslocados. */
export function pieceAtSize(piece: Piece, size: string): Piece {
  const delta = (id: string): Point => piece.grading?.[id]?.[size] ?? { x: 0, y: 0 };
  const move = (p: Point, d: Point): Point => ({ x: p.x + d.x, y: p.y + d.y });

  const points: Record<string, Point> = {};
  for (const [id, p] of Object.entries(piece.points)) points[id] = move(p, delta(id));

  let from = piece.start;
  const outline = piece.outline.map((seg): Segment => {
    const out: Segment =
      seg.kind === "line" ? seg : { ...seg, c1: move(seg.c1, delta(from)), c2: move(seg.c2, delta(seg.to)) };
    from = seg.to;
    return out;
  });

  const graded: Piece = { ...piece, points, outline };
  delete graded.grading; // a parte devolvida já está no tamanho pedido
  return graded;
}

// ---------------------------------------------------------------------------
// Contorno
// ---------------------------------------------------------------------------

export type FlatOutline = {
  /** Vértices do contorno fechado (o último liga de volta ao primeiro). */
  polygon: Point[];
  /** Para cada aresta i (de polygon[i] a polygon[i+1]), o segmento do molde de onde ela veio. */
  edgeSegment: number[];
};

/** Converte o contorno (retas e curvas) num polígono, guardando a origem de cada aresta. */
export function flattenOutline(piece: Piece, tolerance = 0.1): FlatOutline {
  const polygon: Point[] = [];
  const edgeSegment: number[] = [];
  let current = piece.points[piece.start]!;
  polygon.push(current);

  piece.outline.forEach((seg, i) => {
    const end = piece.points[seg.to]!;
    const pts = seg.kind === "line" ? [end] : flattenCubic({ p0: current, c1: seg.c1, c2: seg.c2, p3: end }, tolerance);
    for (const p of pts) {
      const last = polygon.at(-1)!;
      if (distance(last, p) < 1e-9) continue; // ignora arestas de comprimento zero
      edgeSegment.push(i);
      polygon.push(p);
    }
    current = end;
  });

  // O último vértice coincide com o inicial: a aresta de fechamento já está implícita.
  if (polygon.length > 1 && distance(polygon[0]!, polygon.at(-1)!) < 1e-9) polygon.pop();
  return { polygon, edgeSegment };
}

/** Comprimento de cada segmento do contorno, em mm (para conferir costuras). */
export function segmentLengths(piece: Piece): number[] {
  let from = piece.points[piece.start]!;
  return piece.outline.map((seg) => {
    const to = piece.points[seg.to]!;
    const len = seg.kind === "line" ? distance(from, to) : cubicLength({ p0: from, c1: seg.c1, c2: seg.c2, p3: to });
    from = to;
    return len;
  });
}
