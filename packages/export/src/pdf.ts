import { pieceAtSize, type PatternDocument, type Point } from "@alinhavo/geometry";
import {
  clip,
  degrees,
  endPath,
  PDFDocument,
  type PDFFont,
  type PDFPage,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  StandardFonts,
} from "pdf-lib";
import { bounds, pieceOutlines } from "./outlines";

/**
 * PDF do molde em escala real (1:1), dividido em folhas A4 para imprimir em
 * casa e emendar. A primeira folha é de conferência: tem um quadrado de 10 cm
 * para medir com a régua antes de cortar e o mapa das folhas.
 */

/** Pontos PDF por mm (1 pt = 1/72 pol). */
export const MM_TO_PT = 72 / 25.4;
export const A4 = { w: 210, h: 297 } as const;

export type Box = { minX: number; minY: number; maxX: number; maxY: number };
export type Tile = { row: number; col: number; label: string; ox: number; oy: number };
export type TileLayout = {
  orientation: "retrato" | "paisagem";
  pageW: number;
  pageH: number;
  margin: number;
  areaW: number;
  areaH: number;
  cols: number;
  rows: number;
  tiles: Tile[];
};

const PAD = 5; // mm de folga em volta das peças

/** Divide a área do molde em folhas, escolhendo a orientação que gasta menos papel. */
export function tileLayout(box: Box, marginMm = 10): TileLayout {
  const w = box.maxX - box.minX + PAD * 2;
  const h = box.maxY - box.minY + PAD * 2;
  const make = (orientation: TileLayout["orientation"]): TileLayout => {
    const pageW = orientation === "retrato" ? A4.w : A4.h;
    const pageH = orientation === "retrato" ? A4.h : A4.w;
    const areaW = pageW - marginMm * 2;
    const areaH = pageH - marginMm * 2;
    const cols = Math.max(1, Math.ceil(w / areaW));
    const rows = Math.max(1, Math.ceil(h / areaH));
    const tiles: Tile[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push({
          row: r,
          col: c,
          label: `${String.fromCharCode(65 + (r % 26))}${c + 1}`,
          ox: box.minX - PAD + c * areaW,
          oy: box.minY - PAD + r * areaH,
        });
      }
    }
    return { orientation, pageW, pageH, margin: marginMm, areaW, areaH, cols, rows, tiles };
  };
  const portrait = make("retrato");
  const landscape = make("paisagem");
  return landscape.tiles.length < portrait.tiles.length ? landscape : portrait;
}

/**
 * Folhas que têm alguma peça. As vazias (o espaço entre peças distantes) não
 * são impressas: só gastariam papel e atrapalhariam a emenda.
 */
export function usedTiles(layout: TileLayout, boxes: Box[]): Tile[] {
  return layout.tiles.filter((t) =>
    boxes.some((b) => b.maxX > t.ox && b.minX < t.ox + layout.areaW && b.maxY > t.oy && b.minY < t.oy + layout.areaH),
  );
}

/** Ponto do molde (mm, Y para baixo) → ponto na folha (pt, Y para cima). */
export function toPage(layout: TileLayout, tile: Tile, p: Point): Point {
  return {
    x: (layout.margin + p.x - tile.ox) * MM_TO_PT,
    y: (layout.pageH - layout.margin - (p.y - tile.oy)) * MM_TO_PT,
  };
}

export type PdfOptions = { title: string; size: string };

const INK = rgb(0.11, 0.106, 0.094);
const SOFT = rgb(0.36, 0.34, 0.3);
const RED = rgb(0.76, 0.25, 0.18);
const GUIDE = rgb(0.75, 0.75, 0.75);

/** A fonte padrão do PDF só tem Latin-1: troca o resto por "-". */
const latin1 = (t: string) => t.replace(/[^\x20-\x7e\xa0-\xff]/g, "-");

const pathOf = (pts: Point[]) => `M${pts.map((p) => `${p.x} ${p.y}`).join("L")}Z`;

export async function exportPdf(doc: PatternDocument, options: PdfOptions): Promise<Uint8Array> {
  if (!doc.sizes.includes(options.size)) throw new Error(`O tamanho ${options.size} não está na grade.`);
  if (doc.pieces.length === 0) throw new Error("O molde não tem partes para imprimir.");

  const pieces = doc.pieces.map((p) => {
    const graded = pieceAtSize(p, options.size);
    return { piece: graded, ...pieceOutlines(graded) };
  });
  const box = bounds(pieces.flatMap((p) => p.cut.points));
  const layout = tileLayout(box);
  const used = usedTiles(layout, pieces.map((p) => bounds(p.cut.points)));
  const usedLabels = new Set(used.map((t) => t.label));

  const pdf = await PDFDocument.create();
  pdf.setTitle(latin1(`${options.title} - tamanho ${options.size}`));
  pdf.setCreator("Alinhavo");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  conferencePage(pdf, font, bold, layout, usedLabels, options);

  used.forEach((tile, i) => {
    const page = pdf.addPage([layout.pageW * MM_TO_PT, layout.pageH * MM_TO_PT]);
    const origin = toPage(layout, tile, { x: 0, y: 0 });

    // Só a área da folha recebe o desenho; a margem fica livre para emendar.
    page.pushOperators(
      pushGraphicsState(),
      rectangle(layout.margin * MM_TO_PT, layout.margin * MM_TO_PT, layout.areaW * MM_TO_PT, layout.areaH * MM_TO_PT),
      clip(),
      endPath(),
    );
    for (const { piece, sew, cut, hasAllowance } of pieces) {
      // Espessuras e tracejados em mm: a escala do desenho vale também para eles.
      page.drawSvgPath(pathOf(cut.points), { x: origin.x, y: origin.y, scale: MM_TO_PT, borderColor: INK, borderWidth: 0.35 });
      if (hasAllowance) {
        page.drawSvgPath(pathOf(sew.points), {
          x: origin.x,
          y: origin.y,
          scale: MM_TO_PT,
          borderColor: RED,
          borderWidth: 0.25,
          borderDashArray: [3, 2],
        });
      }
      if (piece.grainline) {
        const { from, to } = piece.grainline;
        page.drawSvgPath(`M${from.x} ${from.y}L${to.x} ${to.y}${arrowHead(from, to)}${arrowHead(to, from)}`, {
          x: origin.x,
          y: origin.y,
          scale: MM_TO_PT,
          borderColor: INK,
          borderWidth: 0.3,
        });
      }
      const b = bounds(sew.points);
      const center = toPage(layout, tile, { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });
      const label = latin1(`${piece.name} - ${options.size}`);
      page.drawText(label, { x: center.x - font.widthOfTextAtSize(label, 12) / 2, y: center.y, size: 12, font: bold, color: INK });
    }
    page.pushOperators(popGraphicsState());

    tileFrame(page, font, layout, usedLabels, tile, i, options);
  });

  return pdf.save();
}

/** Duas pernas de seta na ponta `to` do fio. */
function arrowHead(from: Point, to: Point): string {
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const len = 8;
  const a1 = ang + Math.PI - 0.45;
  const a2 = ang + Math.PI + 0.45;
  return `M${to.x + Math.cos(a1) * len} ${to.y + Math.sin(a1) * len}L${to.x} ${to.y}L${to.x + Math.cos(a2) * len} ${to.y + Math.sin(a2) * len}`;
}

/** Borda da área, marcas de canto, cabeçalho e com quais folhas esta emenda. */
function tileFrame(
  page: PDFPage,
  font: PDFFont,
  layout: TileLayout,
  usedLabels: Set<string>,
  tile: Tile,
  index: number,
  options: PdfOptions,
) {
  const k = MM_TO_PT;
  const x0 = layout.margin * k;
  const y0 = layout.margin * k;
  const w = layout.areaW * k;
  const h = layout.areaH * k;
  page.drawRectangle({ x: x0, y: y0, width: w, height: h, borderColor: GUIDE, borderWidth: 0.5 });
  const mark = 6 * k;
  for (const [cx, cy] of [
    [x0, y0],
    [x0 + w, y0],
    [x0, y0 + h],
    [x0 + w, y0 + h],
  ] as const) {
    page.drawLine({ start: { x: cx - mark / 2, y: cy }, end: { x: cx + mark / 2, y: cy }, thickness: 0.6, color: INK });
    page.drawLine({ start: { x: cx, y: cy - mark / 2 }, end: { x: cx, y: cy + mark / 2 }, thickness: 0.6, color: INK });
  }

  const header = latin1(
    `${options.title} · tamanho ${options.size} · folha ${tile.label} (${index + 1} de ${usedLabels.size})`,
  );
  page.drawText(header, { x: x0, y: y0 + h + 3 * k, size: 9, font, color: SOFT });

  const neighbor = (r: number, c: number) => {
    const label = layout.tiles.find((t) => t.row === r && t.col === c)?.label;
    return label && usedLabels.has(label) ? label : undefined;
  };
  const size = 8;
  const right = neighbor(tile.row, tile.col + 1);
  const below = neighbor(tile.row + 1, tile.col);
  const left = neighbor(tile.row, tile.col - 1);
  const above = neighbor(tile.row - 1, tile.col);
  if (right) page.drawText(`emenda com ${right}`, { x: x0 + w + 2, y: y0 + h / 2, size, font, color: SOFT, rotate: degrees(-90) });
  if (left) page.drawText(`emenda com ${left}`, { x: x0 - 4, y: y0 + h / 2, size, font, color: SOFT, rotate: degrees(90) });
  if (below) page.drawText(`emenda com ${below}`, { x: x0 + w / 2 - 25, y: y0 - 4 * k, size, font, color: SOFT });
  if (above) page.drawText(`emenda com ${above}`, { x: x0 + w - 60, y: y0 + h + 3 * k, size, font, color: SOFT });
}

function conferencePage(
  pdf: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  layout: TileLayout,
  usedLabels: Set<string>,
  options: PdfOptions,
) {
  const k = MM_TO_PT;
  const page = pdf.addPage([A4.w * k, A4.h * k]);
  const left = 20 * k;
  let y = (A4.h - 25) * k;
  const line = (text: string, size = 11, f = font, color = INK) => {
    page.drawText(latin1(text), { x: left, y, size, font: f, color });
    y -= size * 1.6;
  };
  line(options.title, 20, bold);
  line(`Tamanho ${options.size} · escala real (1:1) · ${usedLabels.size} folhas A4 (${layout.orientation})`, 11, font, SOFT);
  y -= 10;
  line("Antes de cortar o tecido:", 12, bold);
  line("1. Imprima em tamanho real (100%), sem 'ajustar à página'.");
  line("2. Meça o quadrado abaixo com a régua: ele tem que ter 10 cm de cada lado.");
  line("3. Recorte uma das folhas na linha cinza e emende as vizinhas pelas marcas de canto.");
  line("Linha cheia: corte. Tracejada vermelha: costura. Seta dupla: fio do tecido.", 10, font, SOFT);

  // Quadrado de 10 cm
  const sq = 100 * k;
  const sqY = y - 20 - sq;
  page.drawRectangle({ x: left, y: sqY, width: sq, height: sq, borderColor: INK, borderWidth: 1 });
  page.drawText("10 cm", { x: left + sq / 2 - 12, y: sqY - 14, size: 10, font: bold, color: INK });
  page.drawText("10 cm", {
    x: left + sq + 6,
    y: sqY + sq / 2 - 12,
    size: 10,
    font: bold,
    color: INK,
    rotate: degrees(90),
  });

  // Mapa das folhas
  const mapX = left + sq + 30 * k;
  const cell = Math.min(((A4.w - 20) * k - mapX) / layout.cols, (sq * 1.2) / layout.rows, 20 * k);
  page.drawText("Mapa das folhas", { x: mapX, y: sqY + sq + 6, size: 10, font: bold, color: INK });
  for (const t of layout.tiles) {
    const cx = mapX + t.col * cell;
    const cy = sqY + sq - (t.row + 1) * cell;
    if (usedLabels.has(t.label)) {
      page.drawRectangle({ x: cx, y: cy, width: cell, height: cell, borderColor: SOFT, borderWidth: 0.6 });
      page.drawText(t.label, { x: cx + 3, y: cy + 3, size: Math.min(9, cell / 2.5), font, color: INK });
    } else {
      // folha vazia: não é impressa
      page.drawRectangle({ x: cx, y: cy, width: cell, height: cell, borderColor: GUIDE, borderWidth: 0.4, borderDashArray: [2, 2] });
    }
  }
}
