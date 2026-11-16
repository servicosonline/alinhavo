import { cubicLength, flattenCubic } from "./bezier";
import { validateFinishes } from "./finishes";
import { distance, type Point } from "./polygon";

/**
 * Documento do molde (versão 7). É o que fica salvo em pattern_versions.document.
 * Versões gravadas nunca são reescritas: documentos antigos passam por
 * `migratePattern` na leitura.
 *
 * Histórico do formato:
 * - 1: partes, pontos, curvas, gradação, margens e fio.
 * - 2: + `seams` (costuras: pares de segmentos que se unem na Prova).
 * - 3: + por parte, `fold` (segmento da dobra) e `placement` (posição na Prova).
 * - 4: + `placement.leg` (a parte veste uma perna) e, por parte, `cutPair` (cortar par: a segunda peça é o espelho) e
 *   costura de um segmento com o próprio par (`a` igual a `b`, ex.: gancho).
 * - 5: + por parte, `finishes` (acabamentos: pesponto, zíper, etiqueta e estampa; ver `finishes.ts`).
 * - 6: + `placement.arm` (a parte veste um braço: manga).
 * - 7: + acabamentos `bordado` (imagem com relevo, num retângulo) e `pedraria` (pedras ao longo de um segmento ou num retângulo).
 * - 6: + `placement.arm` (a parte veste um braço: manga). Não combina com `leg`; o cortar par troca de braço.
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
  /**
   * Segmento da dobra (precisa ser reta): a parte é cortada no tecido
   * dobrado e, aberta, vira inteira espelhada por ele (`unfoldPiece`).
   */
  fold?: number;
  /** Onde a parte fica no corpo na Prova. */
  placement?: PiecePlacement;
  /**
   * Cortar par: a parte é cortada duas vezes, a segunda espelhada (frente e
   * costas da calça, uma de cada lado). Na Prova vira duas (`pairCopy`).
   * Não combina com dobra.
   */
  cutPair?: true;
  /** Acabamentos desenhados na parte (pesponto, zíper, etiqueta, estampa). */
  finishes?: Finish[];
};

/**
 * Acabamento numa parte. Os de segmento (pesponto, zíper) usam o índice do
 * segmento, como as costuras: operação que renumera segmentos os acompanha, e
 * dividir ou juntar o segmento os desfaz. Os de área (etiqueta, estampa) ficam
 * presos a um ponto da parte (`anchor`) mais um deslocamento, então seguem a
 * gradação do ponto. Medidas em mm; `rotation` em graus.
 */
export type Finish =
  | {
      id: string;
      kind: "pesponto";
      segment: number;
      /** Distância da linha de costura para dentro da parte, em mm. */
      distance: number;
      /** Carreiras (pesponto duplo: a segunda a FINISH_ROW_GAP mm da primeira). */
      rows: 1 | 2;
    }
  | {
      id: string;
      kind: "ziper";
      segment: number;
      /** Trecho do segmento (0 = início, 1 = fim), pelo comprimento. */
      from: number;
      to: number;
    }
  | (FinishArea & { kind: "etiqueta"; text: string })
  | (FinishArea & {
      kind: "estampa";
      /** Imagem PNG, JPEG ou WebP em data URL (até FINISH_IMAGE_MAX caracteres). */
      image: string;
    })
  | (FinishArea & {
      kind: "bordado";
      /** O desenho do bordado, como a estampa (PNG, JPEG ou WebP em data URL); na Prova sai com relevo. */
      image: string;
    })
  | (StoneSpec & {
      kind: "pedraria";
      /** Pedras ao longo do segmento, `distance` mm para dentro, no trecho `from`–`to` (fração do comprimento). */
      segment: number;
      distance: number;
      from: number;
      to: number;
    })
  | (StoneSpec & FinishArea & { kind: "pedraria" });

/** Pedraria: diâmetro da pedra e distância entre centros, em mm; cor em hex (#rrggbb). */
export type StoneSpec = { id: string; stone: number; spacing: number; color: string };

/** Retângulo preso a um ponto da parte: centro em anchor + offset. */
export type FinishArea = { id: string; anchor: string; offset: Point; width: number; height: number; rotation: number };
export type FinishKind = Finish["kind"];

export type BodySide = "frente" | "costas" | "esquerda" | "direita";
export type BodyAnchor = "ombro" | "busto" | "cintura" | "quadril";

/**
 * Posição inicial da parte na Prova: o lado do corpo para onde ela olha e a
 * altura de referência onde fica a borda de cima (o menor Y do molde).
 * `offset` sobe (positivo) ou desce (negativo) a peça a partir dessa altura, em mm.
 */
export type PiecePlacement = {
  side: BodySide;
  anchor: BodyAnchor;
  offset: number;
  /**
   * A parte veste uma perna abaixo do gancho (calça). Na cópia do cortar
   * par, a outra perna.
   */
  leg?: BodyLeg;
  /**
   * A parte veste um braço (manga): enrola-se no braço, do alto do ombro
   * para baixo, com o meio da parte para fora e as bordas se encontrando por
   * baixo do braço. Não combina com `leg`. Na cópia do cortar par, o outro braço.
   * `anchor` e `side` não contam para a manga; `offset` desce (negativo) a manga no braço.
   */
  arm?: BodyArm;
};
/** Braço do corpo (esquerdo = +X do corpo). */
export type BodyArm = "esquerda" | "direita";
export type BodyLeg = "esquerda" | "direita";

export const BODY_SIDES: readonly BodySide[] = ["frente", "costas", "esquerda", "direita"];
export const BODY_ANCHORS: readonly BodyAnchor[] = ["ombro", "busto", "cintura", "quadril"];

/** Um lado de uma costura: o segmento `segment` do contorno da parte `piece`. */
export type SeamEdge = { piece: string; segment: number };

/**
 * Costura: dois segmentos que se unem. `opposite` (o comum) junta o início de
 * um com o fim do outro, como duas partes deitadas lado a lado; `same` junta
 * início com início. Numa parte com `cutPair`, `a` igual a `b` costura o
 * segmento com o mesmo segmento do par espelhado (gancho da calça).
 */
export type Seam = { id: string; a: SeamEdge; b: SeamEdge; direction: "opposite" | "same" };

export const CURRENT_SCHEMA = 7;

export type PatternDocument = {
  schema: 7;
  unit: "mm";
  sizes: string[];
  baseSize: string;
  pieces: Piece[];
  seams: Seam[];
};

/** Formato 1, só para leitura de versões antigas. */
export type PatternDocumentV1 = Omit<PatternDocument, "schema" | "seams"> & { schema: 1 };
/** Formato 2: sem dobra nem posição na Prova (campos opcionais, então as partes passam iguais). */
export type PatternDocumentV2 = Omit<PatternDocument, "schema"> & { schema: 2 };
/** Formato 3: sem cortar par (campo opcional, então as partes passam iguais). */
export type PatternDocumentV3 = Omit<PatternDocument, "schema"> & { schema: 3 };
/** Formato 4: sem acabamentos (campo opcional, então as partes passam iguais). */
export type PatternDocumentV4 = Omit<PatternDocument, "schema"> & { schema: 4 };
/** Formato 5: sem manga (campo opcional, então as partes passam iguais). */
export type PatternDocumentV5 = Omit<PatternDocument, "schema"> & { schema: 5 };
/** Formato 6: sem bordado nem pedraria (tipos novos de acabamento, então as partes passam iguais). */
export type PatternDocumentV6 = Omit<PatternDocument, "schema"> & { schema: 6 };

/**
 * Converte um documento salvo (de qualquer versão conhecida) para o formato
 * atual, sem alterar o original. Devolve null se não for um documento de
 * molde ou se a versão for desconhecida. Não valida o conteúdo: passe o
 * resultado por `validatePattern`.
 */
export function migratePattern(raw: unknown): PatternDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  // Cada versão sobe um degrau até a atual.
  if (d.schema === 1) {
    const { schema: _schema, ...rest } = d as PatternDocumentV1;
    return migratePattern({ ...rest, schema: 2, seams: [] } satisfies PatternDocumentV2);
  }
  if (d.schema === 2) {
    if (!Array.isArray(d.seams)) return null;
    // 2 → 3: dobra e posição são opcionais; nada a converter além do número.
    return migratePattern({ ...(d as PatternDocumentV2), schema: 3 } satisfies PatternDocumentV3);
  }
  if (d.schema === 3) {
    if (!Array.isArray(d.seams)) return null;
    // 3 → 4: cortar par é opcional; nada a converter além do número.
    return migratePattern({ ...(d as PatternDocumentV3), schema: 4 } satisfies PatternDocumentV4);
  }
  if (d.schema === 4) {
    if (!Array.isArray(d.seams)) return null;
    // 4 → 5: acabamentos são opcionais; nada a converter além do número.
    return migratePattern({ ...(d as PatternDocumentV4), schema: 5 } satisfies PatternDocumentV5);
  }
  if (d.schema === 5) {
    if (!Array.isArray(d.seams)) return null;
    // 5 → 6: braço é opcional; nada a converter além do número.
    return migratePattern({ ...(d as PatternDocumentV5), schema: 6 } satisfies PatternDocumentV6);
  }
  if (d.schema === 6) {
    if (!Array.isArray(d.seams)) return null;
    // 6 → 7: bordado e pedraria são tipos novos; nada a converter além do número.
    return { ...(d as PatternDocumentV6), schema: 7 };
  }
  if (d.schema === 7) {
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

    if (piece.fold !== undefined) {
      const seg = piece.outline[piece.fold];
      if (!Number.isInteger(piece.fold) || !seg) erros.push(`${nome}: a dobra está num segmento que não existe.`);
      else if (seg.kind !== "line") erros.push(`${nome}: a dobra precisa ser um segmento reto.`);
    }
    if (piece.cutPair !== undefined) {
      if (piece.cutPair !== true) erros.push(`${nome}: cortar par inválido.`);
      else if (piece.fold !== undefined) erros.push(`${nome}: cortar par não combina com dobra.`);
    }
    if (piece.placement !== undefined) {
      const { side, anchor, offset, leg, arm } = piece.placement;
      if (
        !BODY_SIDES.includes(side) ||
        !BODY_ANCHORS.includes(anchor) ||
        !Number.isFinite(offset) ||
        Math.abs(offset) > 1000 ||
        (leg !== undefined && leg !== "esquerda" && leg !== "direita") ||
        (arm !== undefined && arm !== "esquerda" && arm !== "direita")
      ) {
        erros.push(`${nome}: posição na Prova inválida.`);
      } else if (leg !== undefined && arm !== undefined) {
        erros.push(`${nome}: a parte veste uma perna ou um braço, não os dois.`);
      }
    }

    for (const [pointId, porTamanho] of Object.entries(piece.grading ?? {})) {
      if (!(pointId in piece.points)) erros.push(`${nome}: gradação para um ponto que não existe (${pointId}).`);
      for (const [size, delta] of Object.entries(porTamanho)) {
        if (!doc.sizes.includes(size)) erros.push(`${nome}: gradação para um tamanho fora da grade (${size}).`);
        if (!finite(delta)) erros.push(`${nome}: gradação inválida em ${pointId}/${size}.`);
      }
    }
    erros.push(...validateFinishes(piece));
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
    if (keys.length === 2 && keys[0] === keys[1] && byId.get(seam.a.piece)?.cutPair !== true) {
      erros.push(`${nome}: um segmento só se costura nele mesmo numa parte de cortar par (com o par espelhado).`);
    }
    for (const key of new Set(keys)) {
      if (sewn.has(key)) erros.push(`${nome}: o segmento já está em outra costura.`);
      sewn.add(key);
    }
    for (const edge of [seam.a, seam.b]) {
      if (edge && byId.get(edge.piece)?.fold === edge.segment) {
        erros.push(`${nome}: a dobra não pode ser costurada (ela não é borda do tecido).`);
      }
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
