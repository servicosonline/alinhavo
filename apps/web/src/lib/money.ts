/**
 * Dinheiro no banco em centavos (inteiro). A tela mostra e lê reais com vírgula.
 */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 3990 → "R$ 39,90"; null → "—" */
export function formatMoney(cents: number | null): string {
  return cents === null ? "—" : brl.format(cents / 100);
}

/** "39,90", "39.90", "R$ 1.234,50" → centavos. Vazio → null. Inválido → undefined. */
export function parseMoneyToCents(text: unknown): number | null | undefined {
  let s = String(text ?? "").trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (!s) return null;
  // Com vírgula: ponto é milhar ("1.234,50"). Sem vírgula: ponto é decimal ("39.90").
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return undefined;
  return Math.round(Number(s) * 100);
}

/** "2", "1,5" → número positivo (até 2 casas). Inválido → undefined. */
export function parseQuantity(text: unknown): number | undefined {
  const s = String(text ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return undefined;
  const n = Number(s);
  return n > 0 && n < 100000 ? n : undefined;
}
