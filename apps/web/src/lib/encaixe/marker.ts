import { buildMarkerLayout, type MarkerLayout, type NestResult, type PatternNestPiece, type SizeDemand } from "@alinhavo/nesting";
import { parseCmToMm } from "../units";

/**
 * Regras da tela do Encaixe (as mesmas na tela e na Server Action): leitura
 * dos campos, limites e formatação. Medidas em mm; a tela mostra cm e m.
 */

/** Peças prontas por tamanho num risco. */
export const DEMAND_MAX = 200;
/** Cópias de peça num risco (todas as partes × demanda): acima disso o encaixe fica lento demais no navegador. */
export const PIECES_MAX = 400;
/** Largura do tecido aceita, mm (a mesma trava do banco). */
export const WIDTH_MIN = 100;
export const WIDTH_MAX = 5000;
/** Folga entre peças, mm. */
export const GAP_MAX = 50;
/** Largura usada quando o produto não tem tecido com largura. */
export const DEFAULT_WIDTH_MM = 1500;

export type MarkerInput = { demand: SizeDemand; widthMm: number; gapMm: number; oneWay: boolean };

/**
 * Confere demanda e medidas digitadas. `piecesPerGarment` = cópias de
 * peça por peça pronta (partes, contando o par duas vezes).
 */
export function readMarkerInput(
  sizes: readonly string[],
  raw: { demand: Record<string, string>; width: string; gap: string; oneWay: boolean },
  piecesPerGarment: number,
): { input: MarkerInput } | { error: string } {
  const demand: SizeDemand = {};
  for (const size of sizes) {
    const text = (raw.demand[size] ?? "").trim();
    if (text === "") continue;
    if (!/^\d+$/.test(text) || Number(text) > DEMAND_MAX) return { error: `Quantidade do tamanho ${size}: use um número inteiro de 0 a ${DEMAND_MAX}.` };
    if (Number(text) > 0) demand[size] = Number(text);
  }
  const garments = garmentCount(demand);
  if (garments === 0) return { error: "Peça pelo menos uma peça em algum tamanho." };
  if (garments * piecesPerGarment > PIECES_MAX) return { error: `Risco grande demais para o navegador (até ${PIECES_MAX} peças cortadas). Divida a demanda em mais de um risco.` };

  const widthMm = parseCmToMm(raw.width);
  if (widthMm === null || widthMm < WIDTH_MIN || widthMm > WIDTH_MAX)
    return { error: `Largura do tecido: de ${WIDTH_MIN / 10} a ${WIDTH_MAX / 10} cm.` };
  const gapMm = raw.gap.trim() === "" ? 0 : parseCmToMm(raw.gap);
  if (gapMm === null || gapMm < 0 || gapMm > GAP_MAX) return { error: `Folga entre peças: de 0 a ${GAP_MAX / 10} cm.` };
  return { input: { demand, widthMm: Math.round(widthMm), gapMm, oneWay: raw.oneWay } };
}

/** Confere uma entrada que chegou do navegador (Server Action). */
export function checkMarkerInput(sizes: readonly string[], input: unknown): MarkerInput | null {
  if (typeof input !== "object" || input === null) return null;
  const i = input as Record<string, unknown>;
  if (typeof i.demand !== "object" || i.demand === null || Array.isArray(i.demand)) return null;
  const demand: SizeDemand = {};
  for (const [size, q] of Object.entries(i.demand as Record<string, unknown>)) {
    if (!sizes.includes(size) || !Number.isInteger(q) || (q as number) < 1 || (q as number) > DEMAND_MAX) return null;
    demand[size] = q as number;
  }
  if (garmentCount(demand) === 0) return null;
  const { widthMm, gapMm, oneWay } = i;
  if (!Number.isInteger(widthMm) || (widthMm as number) < WIDTH_MIN || (widthMm as number) > WIDTH_MAX) return null;
  if (typeof gapMm !== "number" || !(gapMm >= 0 && gapMm <= GAP_MAX)) return null;
  if (typeof oneWay !== "boolean") return null;
  return { demand, widthMm: widthMm as number, gapMm, oneWay };
}

/**
 * O risco de um encaixe terminado (na tela ou na fila): recusa quando
 * alguma peça não coube e confere as posições (`buildMarkerLayout`).
 */
export function layoutFromRun(
  pieces: readonly PatternNestPiece[],
  result: Pick<NestResult, "placements" | "unplaced">,
  input: MarkerInput,
): { layout: MarkerLayout } | { error: string } {
  if (result.unplaced.length > 0) {
    const names = [...new Set(result.unplaced.map((u) => pieces.find((p) => p.id === u.pieceId)?.name ?? u.pieceId))];
    return { error: `Não couberam na largura do tecido: ${names.join(", ")}.` };
  }
  try {
    return { layout: buildMarkerLayout(pieces, result.placements, input) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro no encaixe." };
  }
}

export function garmentCount(demand: SizeDemand): number {
  return Object.values(demand).reduce((s, q) => s + q, 0);
}

const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const m2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 0.8123 → "81,2%" */
export const formatEfficiency = (e: number) => `${pct.format(e * 100)}%`;
/** 3148.6 mm → "3,15 m" */
export const formatMeters = (mm: number) => `${m2.format(mm / 1000)} m`;
/** Tecido por peça pronta (comprimento do risco ÷ peças), "0,45 m". */
export const formatPerGarment = (lengthMm: number, demand: SizeDemand) => {
  const n = garmentCount(demand);
  return n > 0 ? formatMeters(lengthMm / n) : "—";
};
/** { P: 2, M: 3 } → "P 2 · M 3", na ordem da grade. */
export const formatDemand = (sizes: readonly string[], demand: Record<string, number>) =>
  sizes
    .filter((s) => demand[s])
    .map((s) => `${s} ${demand[s]}`)
    .join(" · ");

/** Cor de cada tamanho no risco (pela posição na grade). */
const SIZE_COLORS = ["#c9d8e8", "#f1d7b8", "#cfe3c7", "#e8cde0", "#f3e6a8", "#d5d0ec", "#bfe1df", "#efc9c3"];
export const sizeColor = (sizes: readonly string[], size: string) => SIZE_COLORS[Math.max(0, sizes.indexOf(size)) % SIZE_COLORS.length]!;
