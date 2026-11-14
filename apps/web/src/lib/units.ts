/**
 * O código e o banco trabalham em mm. A modelista lê e digita em cm.
 * Esta é a única ponte entre os dois.
 */

const cm = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** 125 → "12,5" */
export function formatCm(mm: number): string {
  return cm.format(Math.round(mm * 10) / 100);
}

/** "12,5" ou "12.5" → 125. Devolve null se não for número. */
export function parseCmToMm(text: string): number | null {
  const clean = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100) / 10;
}
