/**
 * Calculadora da página inicial: quanto custam os pilotos que a prova 3D evitaria,
 * e quanto vale um ponto a mais de aproveitamento no encaixe.
 *
 * A conta é só com os números que a pessoa digita: nada aqui promete economia.
 * Tecido em mm (invariante do projeto), dinheiro em centavos (como em lib/money.ts).
 */

export interface PilotInput {
  /** Pilotos cortados por mês. */
  pilotsPerMonth: number;
  /** Quantos desses a prova 3D evitaria (estimativa de quem usa), 0..pilotsPerMonth. */
  avoidedPilots: number;
  /** Tecido gasto em cada piloto, em mm de comprimento. */
  fabricPerPilotMm: number;
  /** Preço do metro de tecido, em centavos. */
  pricePerMeterCents: number;
  /** Horas de corte e costura por piloto. */
  hoursPerPilot: number;
  /** Valor da hora de trabalho, em centavos. */
  hourRateCents: number;
}

export interface PilotSavings {
  avoided: number;
  fabricMm: number;
  hours: number;
  fabricCents: number;
  laborCents: number;
  monthlyCents: number;
  yearlyCents: number;
}

const finite = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** O que os pilotos evitados deixam de gastar por mês (e em 12 meses). */
export function pilotSavings(input: PilotInput): PilotSavings {
  const pilots = Math.floor(finite(input.pilotsPerMonth));
  const avoided = Math.min(pilots, Math.floor(finite(input.avoidedPilots)));
  const fabricMm = avoided * finite(input.fabricPerPilotMm);
  const hours = avoided * finite(input.hoursPerPilot);
  const fabricCents = Math.round((fabricMm / 1000) * finite(input.pricePerMeterCents));
  const laborCents = Math.round(hours * finite(input.hourRateCents));
  const monthlyCents = fabricCents + laborCents;
  return { avoided, fabricMm, hours, fabricCents, laborCents, monthlyCents, yearlyCents: monthlyCents * 12 };
}

export interface NestingInput {
  /** Tecido consumido na produção por mês, em mm. */
  monthlyFabricMm: number;
  /** Aproveitamento atual do risco, em % (1..99). */
  efficiencyPct: number;
  pricePerMeterCents: number;
}

/**
 * Quanto um ponto a mais de aproveitamento poupa por mês.
 * A área útil das peças é a mesma; com aproveitamento maior, ela cabe em menos tecido:
 * consumo novo = consumo × atual ÷ (atual + 1).
 */
export function nestingPointSavings(input: NestingInput): { fabricMm: number; cents: number } | null {
  const e = input.efficiencyPct;
  const fabric = finite(input.monthlyFabricMm);
  if (!Number.isFinite(e) || e < 1 || e > 99 || fabric === 0) return null;
  const fabricMm = fabric * (1 - e / (e + 1));
  return { fabricMm, cents: Math.round((fabricMm / 1000) * finite(input.pricePerMeterCents)) };
}

/** Valores de exemplo da página (marcados como exemplo na tela). */
export const EXAMPLE_PILOTS: PilotInput = {
  pilotsPerMonth: 8,
  avoidedPilots: 4,
  fabricPerPilotMm: 1800,
  pricePerMeterCents: 3200,
  hoursPerPilot: 6,
  hourRateCents: 2500,
};

export const EXAMPLE_NESTING = { monthlyFabricMm: 2_000_000, efficiencyPct: 78 } as const;

/**
 * Número digitado como no Brasil: "1,8", "2.000", "1.234,50" (e "1.8" também).
 * Vazio ou inválido vira 0.
 */
export function parseBrNumber(text: string): number {
  let s = text.trim().replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return s !== "" && Number.isFinite(n) && n >= 0 ? n : 0;
}
