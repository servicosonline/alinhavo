import { PDFDocument, PDFRawStream, decodePDFRawStream, PDFArray, PDFRef } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { saia } from "./fixture";
import { A4, exportPdf, MM_TO_PT, tileLayout, toPage, usedTiles } from "./pdf";

/** Texto dos operadores de desenho de uma página (descomprimido). */
function pageContent(pdf: PDFDocument, index: number): string {
  const node = pdf.getPage(index).node;
  const contents = node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  return refs
    .map((ref) => {
      const stream = pdf.context.lookup(ref as PDFRef);
      return stream instanceof PDFRawStream ? new TextDecoder().decode(decodePDFRawStream(stream).decode()) : "";
    })
    .join("\n");
}

describe("tileLayout", () => {
  it("escolhe a orientação que usa menos folhas", () => {
    // 400 × 700 mm (+5 mm de folga): retrato daria 3×3 = 9, paisagem 2×4 = 8
    const l = tileLayout({ minX: 0, minY: 0, maxX: 400, maxY: 700 });
    expect(l.orientation).toBe("paisagem");
    expect([l.cols, l.rows]).toEqual([2, 4]);
    expect(l.tiles.map((t) => t.label)).toEqual(["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"]);
    expect([l.areaW, l.areaH]).toEqual([277, 190]);
  });

  it("molde pequeno cabe numa folha só, em retrato", () => {
    const l = tileLayout({ minX: 10, minY: 10, maxX: 150, maxY: 200 });
    expect(l.tiles).toHaveLength(1);
    expect(l.orientation).toBe("retrato");
  });

  it("cada folha continua exatamente onde a anterior parou", () => {
    const l = tileLayout({ minX: 0, minY: 0, maxX: 400, maxY: 700 });
    const [a1, a2, b1] = l.tiles;
    expect(a2!.ox - a1!.ox).toBe(l.areaW);
    expect(b1!.oy - a1!.oy).toBe(l.areaH);
  });
});

describe("escala 1:1", () => {
  it("1 mm do molde vira 72/25,4 pt na folha", () => {
    const l = tileLayout({ minX: 0, minY: 0, maxX: 100, maxY: 100 });
    const t = l.tiles[0]!;
    const a = toPage(l, t, { x: t.ox, y: t.oy });
    const b = toPage(l, t, { x: t.ox + 100, y: t.oy + 100 });
    expect(b.x - a.x).toBeCloseTo(100 * MM_TO_PT, 6); // 10 cm = 283,46 pt
    expect(a.y - b.y).toBeCloseTo(100 * MM_TO_PT, 6); // Y do molde desce, o do PDF sobe
    expect(a).toEqual({ x: 10 * MM_TO_PT, y: (297 - 10) * MM_TO_PT });
  });
});

describe("exportPdf", () => {
  it("gera folha de conferência + folhas A4 do molde", async () => {
    const bytes = await exportPdf(saia(), { title: "Saia base", size: "M" });
    const pdf = await PDFDocument.load(bytes);
    // peças de 0 a 530 mm de largura e 0 a 600 de altura (com margens): 2×4 em paisagem? 3×3 em retrato?
    const pages = pdf.getPages();
    expect(pages.length).toBeGreaterThan(2);
    const [conf, ...folhas] = pages;
    expect(conf!.getSize().width).toBeCloseTo(A4.w * MM_TO_PT, 2);
    expect(conf!.getSize().height).toBeCloseTo(A4.h * MM_TO_PT, 2);
    for (const f of folhas) {
      const { width, height } = f.getSize();
      expect([Math.round(width), Math.round(height)].sort()).toEqual([595, 842]);
    }
    expect(pdf.getTitle()).toBe("Saia base - tamanho M");
  });

  it("o quadrado de conferência tem 10 cm e o molde é desenhado na escala 1:1", async () => {
    const pdf = await PDFDocument.load(await exportPdf(saia(), { title: "Saia", size: "G" }));
    const lado = 100 * MM_TO_PT; // 283,46 pt
    expect(pageContent(pdf, 0)).toContain(`${lado} ${lado} l`);
    const folha = pageContent(pdf, 1);
    // a folha recorta o desenho na margem de 10 mm
    expect(folha).toContain(`${10 * MM_TO_PT} ${10 * MM_TO_PT} ${190 * MM_TO_PT} ${277 * MM_TO_PT} re\nW\nn`);
    // escala mm → pt com o Y invertido, aplicada antes de cada contorno
    expect(folha).toContain(`${MM_TO_PT} 0 0 -${MM_TO_PT} 0 0 cm`);
    // linha de corte do G em mm: 210 × 615 + 1 cm de margem (3 cm na barra)
    expect(folha).toMatch(/-10 -10 m\n220 -10 l\n220 645 l\n-10 645 l\nh\nS/);
    // linha de costura tracejada
    expect(folha).toMatch(/\[3 2\] 0 d\n0 0 m\n210 0 l\n210 615 l/);
  });

  it("recusa tamanho fora da grade e molde vazio", async () => {
    await expect(exportPdf(saia(), { title: "x", size: "XG" })).rejects.toThrow(/não está na grade/);
    await expect(exportPdf({ ...saia(), pieces: [] }, { title: "x", size: "M" })).rejects.toThrow(/não tem partes/);
  });
});

describe("folhas vazias", () => {
  it("não imprime as folhas entre peças distantes", async () => {
    const doc = saia();
    // costas bem longe da frente: abre um vão de folhas sem nada
    doc.pieces[1]!.points = Object.fromEntries(
      Object.entries(doc.pieces[1]!.points).map(([k, p]) => [k, { x: p.x + 1200, y: p.y }]),
    );
    doc.pieces[1]!.outline = [
      { kind: "line", to: "B" },
      { kind: "line", to: "C" },
      { kind: "line", to: "D" },
      { kind: "line", to: "A" },
    ];
    const layout = tileLayout({ minX: -10, minY: -10, maxX: 1730, maxY: 640 });
    const usadas = usedTiles(layout, [
      { minX: -10, minY: -10, maxX: 210, maxY: 640 },
      { minX: 1490, minY: -10, maxX: 1730, maxY: 640 },
    ]);
    expect(usadas.length).toBeLessThan(layout.tiles.length);
    const pdf = await PDFDocument.load(await exportPdf(doc, { title: "Saia", size: "M" }));
    expect(pdf.getPageCount()).toBe(1 + usadas.length);
  });
});
