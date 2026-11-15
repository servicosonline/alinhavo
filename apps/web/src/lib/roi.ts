/**
 * Resultados (ROI) da organização: quanto ficou no caixa no mês, comparando com como era antes.
 * Usa a mesma conta do simulador da página inicial (lib/landing/savings.ts). Puro e sempre estimativa:
 * só com os números que a organização informou e o que o app mediu.
 */
import { pilotSavings } from "./landing/savings";

export interface RoiBaseline {
  /** Pilotos cortados por mês antes do Alinhavo. */
  pilotsPerMonth: number;
  fabricPerPilotMm: number;
  pricePerMeterCents: number;
  hoursPerPilot: number;
  hourRateCents: number;
  /** Tecido da produção por mês, em mm. */
  monthlyFabricMm: number;
  /** Aproveitamento médio do risco antes (%). */
  efficiencyPct: number | null;
  goalMonthlyCents: number | null;
}

export interface RoiMonthInput {
  /** Pilotos cortados neste mês (informado); null = ainda não informado. */
  pilotsCut: number | null;
  /** Aproveitamento médio dos riscos salvos no mês (0..1); null = nenhum risco. */
  avgEfficiency: number | null;
}

export interface RoiMonth {
  pilotsAvoided: number | null;
  fabricMm: number;
  hours: number;
  pilotCents: number;
  nestingFabricMm: number;
  nestingCents: number;
  totalCents: number;
  /** Progresso até a meta (0..1+); null sem meta. */
  goalProgress: number | null;
}

/**
 * Economia estimada do mês:
 * - pilotos: (pilotos de antes − pilotos cortados) × (tecido + horas de cada piloto);
 * - encaixe: com aproveitamento melhor, a mesma área cabe em menos tecido:
 *   tecido economizado = tecido do mês × (1 − antes ÷ agora).
 */
export function roiMonth(b: RoiBaseline, m: RoiMonthInput): RoiMonth {
  const avoided = m.pilotsCut === null ? null : Math.max(0, b.pilotsPerMonth - m.pilotsCut);
  const p = pilotSavings({
    pilotsPerMonth: b.pilotsPerMonth,
    avoidedPilots: avoided ?? 0,
    fabricPerPilotMm: b.fabricPerPilotMm,
    pricePerMeterCents: b.pricePerMeterCents,
    hoursPerPilot: b.hoursPerPilot,
    hourRateCents: b.hourRateCents,
  });
  let nestingFabricMm = 0;
  if (b.efficiencyPct && m.avgEfficiency && b.monthlyFabricMm > 0) {
    const before = b.efficiencyPct / 100;
    if (m.avgEfficiency > before) nestingFabricMm = b.monthlyFabricMm * (1 - before / m.avgEfficiency);
  }
  const nestingCents = Math.round((nestingFabricMm / 1000) * b.pricePerMeterCents);
  const totalCents = p.monthlyCents + nestingCents;
  return {
    pilotsAvoided: avoided,
    fabricMm: p.fabricMm,
    hours: p.hours,
    pilotCents: p.monthlyCents,
    nestingFabricMm,
    nestingCents,
    totalCents,
    goalProgress: b.goalMonthlyCents ? totalCents / b.goalMonthlyCents : null,
  };
}

/** "2026-11-01" do mês da data (no fuso de São Paulo). */
export function monthKey(d: Date = new Date()): string {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(d);
  return `${s}-01`;
}

/** Os últimos `n` meses, do mais recente para trás ("2026-11-01", "2026-10-01", …). */
export function lastMonths(n: number, from: string = monthKey()): string[] {
  const [y, mo] = from.split("-").map(Number) as [number, number];
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(Date.UTC(y, mo - 1 - i, 1));
    return t.toISOString().slice(0, 10);
  });
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-11-01" → "novembro de 2026". */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number) as [number, number];
  return `${MESES[m - 1]} de ${y}`;
}
