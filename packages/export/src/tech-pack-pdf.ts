import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import { readFlatSketch, sketchPath, type SketchView } from "./flat-sketch";
import { cm, consumptionNote, consumptionSource, grams, meters, money, PRODUCT_STATUS_PT, squareMeters, type TechPackData } from "./tech-pack";

/**
 * PDF da ficha técnica (A4 retrato). Fontes padrão do PDF (WinAnsi): o que
 * a fonte não tem (emoji, símbolos raros) vira "?" em vez de quebrar.
 */

const MM = 72 / 25.4;
const PAGE = { w: 210 * MM, h: 297 * MM };
const MARGIN = 15 * MM;
const INK = rgb(0.12, 0.12, 0.14);
const SOFT = rgb(0.42, 0.42, 0.45);
const LINE = rgb(0.8, 0.8, 0.82);

/** Troca o que a fonte WinAnsi não sabe desenhar. */
export function winAnsiSafe(text: string): string {
  const extras = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
  let out = "";
  for (const ch of text.normalize("NFC")) {
    const code = ch.codePointAt(0)!;
    out += (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || extras.has(ch) ? ch : "?";
  }
  return out;
}

type Ctx = { doc: PDFDocument; page: PDFPage; y: number; font: PDFFont; bold: PDFFont };

function ensure(ctx: Ctx, height: number) {
  if (ctx.y - height >= MARGIN) return;
  ctx.page = ctx.doc.addPage([PAGE.w, PAGE.h]);
  ctx.y = PAGE.h - MARGIN;
}

function text(ctx: Ctx, value: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number } = {}) {
  const size = opts.size ?? 10;
  ensure(ctx, size + 4);
  ctx.page.drawText(winAnsiSafe(value), { x: opts.x ?? MARGIN, y: ctx.y - size, size, font: opts.bold ? ctx.bold : ctx.font, color: opts.color ?? INK });
  ctx.y -= size + 4;
}

function heading(ctx: Ctx, value: string) {
  ctx.y -= 6;
  text(ctx, value, { size: 12, bold: true });
  ensure(ctx, 4);
  ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: PAGE.w - MARGIN, y: ctx.y }, thickness: 0.5, color: LINE });
  ctx.y -= 6;
}

/** Texto corrido quebrado na largura da página (as quebras de linha do texto são mantidas). */
function paragraph(ctx: Ctx, value: string, size = 9.5) {
  const max = PAGE.w - 2 * MARGIN;
  for (const raw of winAnsiSafe(value).split("\n")) {
    let line = "";
    for (const word of raw.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.font.widthOfTextAtSize(next, size) > max) {
        text(ctx, line, { size });
        line = word;
      } else line = next;
    }
    if (line) text(ctx, line, { size });
    else ctx.y -= size / 2;
  }
}

/** Altura máxima de uma vista do desenho técnico, em pt. */
const SKETCH_HEIGHT = 250;

/**
 * Desenho técnico: as vistas lado a lado, na mesma escala (a do que mais
 * aperta), com o nome de cada uma embaixo. Espessuras em pt, convertidas para
 * a escala do caminho (o drawSvgPath escala também as linhas).
 */
function sketch(ctx: Ctx, views: SketchView[]) {
  const total = PAGE.w - 2 * MARGIN;
  const gap = 24;
  const slot = (total - gap * (views.length - 1)) / views.length;
  const scale = Math.min(...views.map((v) => Math.min(slot / Math.max(1, v.bounds.maxX - v.bounds.minX), SKETCH_HEIGHT / Math.max(1, v.bounds.maxY - v.bounds.minY))));
  const height = Math.max(...views.map((v) => (v.bounds.maxY - v.bounds.minY) * scale));
  ensure(ctx, height + 24);
  const top = ctx.y - 4;
  views.forEach((v, i) => {
    const w = (v.bounds.maxX - v.bounds.minX) * scale;
    const left = MARGIN + i * (slot + gap) + (slot - w) / 2;
    const at = { x: left - v.bounds.minX * scale, y: top + v.bounds.minY * scale };
    const pt = (n: number) => n / scale; // espessura em pt na escala do caminho
    for (const p of v.pieces) ctx.page.drawSvgPath(sketchPath(p, true), { ...at, scale, borderColor: SOFT, borderWidth: pt(0.4) });
    for (const p of v.outline) ctx.page.drawSvgPath(sketchPath(p, true), { ...at, scale, borderColor: INK, borderWidth: pt(1.2) });
    for (const m of v.marks) {
      if (m.kind === "pesponto") {
        for (const l of m.lines) ctx.page.drawSvgPath(sketchPath(l, false), { ...at, scale, borderColor: INK, borderWidth: pt(0.4), borderDashArray: [pt(2), pt(1.5)] });
      } else if (m.kind === "ziper") {
        ctx.page.drawSvgPath(sketchPath(m.band, true), { ...at, scale, borderColor: INK, borderWidth: pt(0.5) });
        ctx.page.drawSvgPath(sketchPath(m.axis, false), { ...at, scale, borderColor: INK, borderWidth: pt(1), borderDashArray: [pt(0.8), pt(0.8)] });
      } else if (m.kind === "pedraria") {
        for (const s of m.stones) {
          ctx.page.drawCircle({ x: at.x + s.x * scale, y: at.y - s.y * scale, size: Math.max(0.4, m.radius * scale), borderColor: INK, borderWidth: 0.3 });
        }
      } else {
        ctx.page.drawSvgPath(sketchPath(m.corners, true), { ...at, scale, borderColor: SOFT, borderWidth: pt(0.5), borderDashArray: [pt(2), pt(1.5)] });
        const cx = m.corners.reduce((s, p) => s + p.x, 0) / m.corners.length;
        const cy = m.corners.reduce((s, p) => s + p.y, 0) / m.corners.length;
        const label = winAnsiSafe(m.label);
        const size = 6;
        ctx.page.drawText(label, { x: at.x + cx * scale - ctx.font.widthOfTextAtSize(label, size) / 2, y: at.y - cy * scale - size / 2, size, font: ctx.font, color: SOFT });
      }
    }
    const name = v.side === "frente" ? "Frente" : "Costas";
    ctx.page.drawText(name, { x: MARGIN + i * (slot + gap) + slot / 2 - ctx.font.widthOfTextAtSize(name, 8) / 2, y: top - height - 12, size: 8, font: ctx.font, color: SOFT });
  });
  ctx.y = top - height - 18;
}

/** Tabela simples: larguras em fração da área útil. */
function table(ctx: Ctx, cols: { title: string; width: number; align?: "right" }[], rows: string[][]) {
  const total = PAGE.w - 2 * MARGIN;
  const draw = (cells: string[], bold: boolean) => {
    ensure(ctx, 14);
    let x = MARGIN;
    cells.forEach((c, i) => {
      const w = cols[i]!.width * total;
      const font = bold ? ctx.bold : ctx.font;
      let value = winAnsiSafe(c);
      while (value.length > 1 && font.widthOfTextAtSize(value, 9) > w - 4) value = value.slice(0, -2) + "…";
      const tw = font.widthOfTextAtSize(value, 9);
      ctx.page.drawText(value, { x: cols[i]!.align === "right" ? x + w - tw - 2 : x + 2, y: ctx.y - 10, size: 9, font, color: bold ? SOFT : INK });
      x += w;
    });
    ctx.y -= 14;
  };
  draw(cols.map((c) => c.title), true);
  for (const r of rows) draw(r, false);
}

export async function exportTechPackPdf(data: TechPackData, opts: { number?: number } = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(winAnsiSafe(`Ficha técnica - ${data.product.name}`));
  doc.setCreator("Alinhavo");
  const ctx: Ctx = {
    doc,
    page: doc.addPage([PAGE.w, PAGE.h]),
    y: PAGE.h - MARGIN,
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  const p = data.product;
  text(ctx, "FICHA TÉCNICA" + (opts.number ? ` Nº ${opts.number}` : ""), { size: 9, color: SOFT });
  text(ctx, `${p.reference ? `${p.reference} · ` : ""}${p.name}`, { size: 18, bold: true });
  text(
    ctx,
    [p.collection && `Coleção ${p.collection}`, `Status: ${PRODUCT_STATUS_PT[p.status] ?? p.status}`, `Molde ${data.pattern.name}, versão ${data.pattern.version}`]
      .filter(Boolean)
      .join("   ·   "),
    { color: SOFT },
  );
  text(ctx, `Grade: ${data.pattern.sizes.join(", ")} (base ${data.pattern.baseSize})   ·   Gerada em ${new Date(data.generatedAt).toLocaleDateString("pt-BR")}`, {
    color: SOFT,
  });

  const drawing = readFlatSketch(data.sketch);
  if (drawing && drawing.views.length > 0) {
    heading(ctx, "Desenho técnico");
    sketch(ctx, drawing.views);
    if (drawing.skipped.length > 0) text(ctx, `Fora do desenho (partes laterais ou sem posição): ${drawing.skipped.join(", ")}.`, { size: 8, color: SOFT });
  }

  if (data.technicalDescription) {
    heading(ctx, "Descrição técnica");
    paragraph(ctx, data.technicalDescription);
  }

  heading(ctx, "Peças");
  const base = data.pattern.baseSize;
  table(
    ctx,
    [
      { title: "Peça", width: 0.34 },
      { title: "Corte", width: 0.18 },
      { title: `Largura (${base})`, width: 0.16, align: "right" },
      { title: `Comprimento (${base})`, width: 0.17, align: "right" },
      { title: `Área (${base})`, width: 0.15, align: "right" },
    ],
    data.pieces.map((pc) => {
      const m = pc.bySize[base];
      return [
        pc.name,
        `${pc.quantity}×${pc.quantity === 2 ? " (par)" : ""}${pc.onFold ? " na dobra" : ""}`,
        m ? cm(m.widthMm) : "—",
        m ? cm(m.lengthMm) : "—",
        m ? squareMeters(m.cutAreaMm2) : "—",
      ];
    }),
  );

  heading(ctx, "Tecido");
  const f = data.fabric;
  if (!f) text(ctx, "Nenhum tecido ligado ao produto.", { color: SOFT });
  else {
    text(ctx, `${f.name}${f.composition ? ` · ${f.composition}` : ""}`, { bold: true });
    text(
      ctx,
      [f.widthMm && `Largura útil ${cm(f.widthMm)}`, f.weightGsm && `${f.weightGsm} g/m²`, f.priceCents != null && `${money(f.priceCents)} por metro`]
        .filter(Boolean)
        .join("   ·   ") || "Sem largura, gramatura ou preço cadastrados.",
      { color: SOFT },
    );
  }

  heading(ctx, `Consumo por tamanho (${consumptionSource(data.consumption)})`);
  table(
    ctx,
    [
      { title: "Tamanho", width: 0.16 },
      { title: "Área das peças", width: 0.2, align: "right" },
      { title: "Tecido", width: 0.18, align: "right" },
      { title: "Peso", width: 0.14, align: "right" },
      { title: "Custo tecido", width: 0.16, align: "right" },
      { title: "Material total", width: 0.16, align: "right" },
    ],
    data.pattern.sizes.map((s) => {
      const c = data.consumption.bySize[s]!;
      return [s, squareMeters(c.areaMm2), meters(c.meters), grams(c.weightG), money(c.fabricCents), money(data.materialCentsBySize[s] ?? null)];
    }),
  );
  text(
    ctx,
    consumptionNote(data.consumption),
    { size: 8, color: SOFT },
  );

  heading(ctx, "Aviamentos");
  if (data.trims.length === 0) text(ctx, "Nenhum aviamento cadastrado.", { color: SOFT });
  else {
    table(
      ctx,
      [
        { title: "Item", width: 0.46 },
        { title: "Quantidade", width: 0.18, align: "right" },
        { title: "Preço unitário", width: 0.18, align: "right" },
        { title: "Total", width: 0.18, align: "right" },
      ],
      data.trims.map((t) => [t.name, `${String(t.quantity).replace(".", ",")} ${t.unit}`, money(t.unitPriceCents), money(t.totalCents)]),
    );
    text(ctx, `Total de aviamentos: ${money(data.trimsCents)}`, { bold: true, x: PAGE.w - MARGIN - 160 });
  }

  return doc.save();
}
