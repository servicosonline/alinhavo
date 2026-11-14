import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import { cm, ESTIMATED_EFFICIENCY, grams, meters, money, PRODUCT_STATUS_PT, squareMeters, type TechPackData } from "./tech-pack";

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

  heading(ctx, "Consumo por tamanho (estimativa)");
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
    `Estimativa pela área das peças com margem, com aproveitamento de ${Math.round(ESTIMATED_EFFICIENCY * 100)}%. O consumo real vem do Encaixe.`,
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
