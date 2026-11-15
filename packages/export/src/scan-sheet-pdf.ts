import { sheetDrawing, type MarkerSheet } from "@alinhavo/scan";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Folha de marcadores do Scan em PDF, 1:1 (imprimir em "tamanho real",
 * 100%). Marcadores pretos nos cantos, quadrado de conferência de 50 mm e
 * as instruções. Medidas em mm convertidas para pontos; o Y do PDF cresce
 * para cima.
 */
const MM = 72 / 25.4;

export async function exportScanSheetPdf(sheet: MarkerSheet): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Alinhavo · ${sheet.name}`);
  pdf.setCreator("Alinhavo");
  const page = pdf.addPage([sheet.widthMm * MM, sheet.heightMm * MM]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const H = sheet.heightMm;
  const { black, check } = sheetDrawing(sheet);

  for (const r of black) page.drawRectangle({ x: r.x * MM, y: (H - r.y - r.h) * MM, width: r.w * MM, height: r.h * MM, color: rgb(0, 0, 0) });

  page.drawRectangle({
    x: check.x * MM,
    y: (H - check.y - check.h) * MM,
    width: check.w * MM,
    height: check.h * MM,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });
  const text = (value: string, xMm: number, yMm: number, size: number, f = font) =>
    page.drawText(value, { x: xMm * MM, y: (H - yMm) * MM, size, font: f, color: rgb(0.2, 0.2, 0.2) });
  text(`${check.w} mm`, check.x + check.w / 2 - 6, check.y + check.h / 2 + 1.5, 9, bold);

  const lines = [
    "Folha de marcadores do Scan",
    "",
    "1. Imprima em tamanho real (100%, sem ajustar à página) e confira o",
    "   quadrado acima com a régua: ele precisa medir 50 mm.",
    "2. Ponha o molde de papel sobre um fundo bem contrastante (mesa escura",
    "   para papel branco), ao lado desta folha, sem encostar nela.",
    "3. Fotografe de cima, com a folha e o molde inteiros na foto,",
    "   sem sombra forte nem reflexo nos marcadores.",
  ];
  lines.forEach((l, i) => text(l, 24, check.y + check.h + 16 + i * 5.5, i === 0 ? 11 : 8.5, i === 0 ? bold : font));
  return pdf.save();
}
