import type { ProductStatus, StageTimeRow } from "./supabase/database.types";

/**
 * Tempo de produção: quanto o produto fica em cada estágio e da ideia à
 * produção (função `production_stage_times` do banco). Só formata e lê.
 */

export const STAGE_ORDER: ProductStatus[] = ["ideia", "modelagem", "prova", "aprovado", "producao"];

export const STAGE_LABEL: Record<ProductStatus, string> = {
  ideia: "Ideia",
  modelagem: "Modelagem",
  prova: "Prova",
  aprovado: "Aprovado",
  producao: "Produção",
};

export type StageTime = {
  stage: ProductStatus;
  done: number;
  avg: number | null;
  median: number | null;
  now: number;
  nowAvg: number | null;
};

export type ProductionTimes = {
  stages: StageTime[];
  /** Da entrada no primeiro estágio até a produção. */
  total: Omit<StageTime, "stage">;
  /** Estágio (antes da produção) com a maior média de passagens encerradas: o gargalo. */
  slowest: ProductStatus | null;
};

const num = (v: number | string | null | undefined): number | null => (v === null || v === undefined ? null : Number(v));

/** Lê as linhas do banco (em qualquer ordem) na ordem do fluxo. */
export function readProductionTimes(rows: readonly StageTimeRow[]): ProductionTimes {
  const by = new Map(rows.map((r) => [r.stage, r]));
  const pick = (r: StageTimeRow | undefined) => ({
    done: Number(r?.done_count ?? 0),
    avg: num(r?.done_avg_seconds),
    median: num(r?.done_median_seconds),
    now: Number(r?.current_count ?? 0),
    nowAvg: num(r?.current_avg_seconds),
  });
  const stages = STAGE_ORDER.map((stage) => ({ stage, ...pick(by.get(stage)) }));
  let slowest: ProductStatus | null = null;
  for (const s of stages) {
    // Produção é o fim: ninguém "sai" dela, não é gargalo.
    if (s.stage === "producao" || s.avg === null) continue;
    if (slowest === null || s.avg > stages.find((x) => x.stage === slowest)!.avg!) slowest = s.stage;
  }
  return { stages, total: pick(by.get("total")), slowest };
}

/** Segundos → "3 d 4 h", "5 h 10 min", "12 min", "menos de 1 min". */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const min = Math.floor(seconds / 60);
  if (min < 1) return "menos de 1 min";
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return h > 0 ? `${d} d ${h} h` : `${d} d`;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  return `${m} min`;
}

/** Algum dado para mostrar (senão a tela explica que a medição começou agora). */
export function hasProductionData(t: ProductionTimes): boolean {
  return t.stages.some((s) => s.done > 0 || s.now > 0);
}
