/** Um tamanho da tabela com as medidas dele, como vem do banco. */
export type ChartSizeRow = { id: string; label: string };
export type MeasurementRow = { size_id: string; name: string; value_mm: number | string };

export type ProvaMeasurements = {
  /** Tamanho da grade do molde → (nome da medida → mm). */
  bySize: Record<string, Record<string, number>>;
  /** Tamanhos da grade do molde sem nenhuma medida na tabela (o corpo estima). */
  missing: string[];
};

/**
 * Medidas da tabela ligada ao molde, organizadas pelos tamanhos da grade do
 * molde. Casa pelo rótulo (sem diferença de maiúsculas e espaços). Valores
 * inválidos são ignorados; o corpo estima o que faltar.
 */
export function measurementsBySize(
  docSizes: readonly string[],
  chartSizes: readonly ChartSizeRow[],
  rows: readonly MeasurementRow[],
): ProvaMeasurements {
  const norm = (s: string) => s.trim().toUpperCase();
  const labelOf = new Map(chartSizes.map((s) => [s.id, norm(s.label)]));
  const byLabel = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const label = labelOf.get(row.size_id);
    const value = Number(row.value_mm);
    if (!label || !Number.isFinite(value) || value <= 0) continue;
    const entry = byLabel.get(label) ?? {};
    entry[row.name.trim().toLowerCase()] = value;
    byLabel.set(label, entry);
  }
  const bySize: Record<string, Record<string, number>> = {};
  const missing: string[] = [];
  for (const size of docSizes) {
    const found = byLabel.get(norm(size));
    bySize[size] = found ?? {};
    if (!found) missing.push(size);
  }
  return { bySize, missing };
}
