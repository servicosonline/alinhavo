import { A4_SHEET } from "@alinhavo/scan";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { exportScanSheetPdf } from "./scan-sheet-pdf";

describe("folha de marcadores em PDF", () => {
  it("abre num leitor, uma página A4 em tamanho real, com título", async () => {
    const pdf = await PDFDocument.load(await exportScanSheetPdf(A4_SHEET));
    expect(pdf.getPageCount()).toBe(1);
    const { width, height } = pdf.getPage(0).getSize();
    expect(width).toBeCloseTo((210 * 72) / 25.4, 2);
    expect(height).toBeCloseTo((297 * 72) / 25.4, 2);
    expect(pdf.getTitle()).toContain("A4 com 4 marcadores");
  });
});
