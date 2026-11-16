/**
 * Medidas do corpo a partir da tabela de medidas (nomes livres, em
 * minúsculas, valores em mm). O que a tabela não tiver é estimado por
 * proporção da altura (ou do quadril/busto), e a lista do que foi estimado
 * volta junto para a interface avisar.
 */

export type BodyMeasurements = {
  altura: number;
  busto: number;
  cintura: number;
  quadril: number;
  /** Distância vertical da cintura até a linha do quadril. */
  alturaDoQuadril: number;
  /** Do chão até o gancho (entrepernas). */
  entrepernas: number;
  /** Do ombro ao punho. */
  comprimentoDoBraco: number;
  punho: number;
  /** Comprimento do ombro (do pescoço à ponta do ombro). */
  ombro: number;
  larguraDasCostas: number;
  pescoco: number;
  coxa: number;
  joelho: number;
  tornozelo: number;
  /** Circunferência do braço (bíceps). */
  braco: number;
};

export type MeasurementKey = keyof BodyMeasurements;

/** Nome na tabela → campo. Aceita as variações mais comuns. */
const NAMES: Record<string, MeasurementKey> = {
  altura: "altura",
  "altura total": "altura",
  estatura: "altura",
  busto: "busto",
  "tórax": "busto",
  torax: "busto",
  cintura: "cintura",
  quadril: "quadril",
  "altura do quadril": "alturaDoQuadril",
  entrepernas: "entrepernas",
  "comprimento do braço": "comprimentoDoBraco",
  "comprimento do braco": "comprimentoDoBraco",
  punho: "punho",
  ombro: "ombro",
  "largura das costas": "larguraDasCostas",
  "pescoço": "pescoco",
  pescoco: "pescoco",
  coxa: "coxa",
  joelho: "joelho",
  tornozelo: "tornozelo",
  "braço": "braco",
  braco: "braco",
};

/** Limites de plausibilidade, em mm. Fora deles, a medida é ignorada (e avisada). */
export const MEASUREMENT_RANGE: Readonly<Record<MeasurementKey, readonly [number, number]>> = {
  altura: [900, 2300],
  busto: [500, 1800],
  cintura: [400, 1800],
  quadril: [500, 1900],
  alturaDoQuadril: [80, 350],
  entrepernas: [450, 1100],
  comprimentoDoBraco: [350, 900],
  punho: [100, 300],
  ombro: [70, 220],
  larguraDasCostas: [250, 600],
  pescoco: [250, 600],
  coxa: [300, 1000],
  joelho: [250, 600],
  tornozelo: [150, 400],
  braco: [180, 600],
};

export type MeasurementReading = {
  values: BodyMeasurements;
  /** Campos que não vieram da tabela (estimados). */
  estimated: MeasurementKey[];
  /** Nomes da tabela que o corpo não usa. */
  ignored: string[];
  /** Medidas recusadas por estarem fora do plausível. */
  rejected: string[];
};

/** As medidas que o corpo usa, na ordem da tela (geral, tronco, braços, pernas). */
export const MEASUREMENT_KEYS: readonly MeasurementKey[] = [
  "altura",
  "busto",
  "cintura",
  "quadril",
  "alturaDoQuadril",
  "ombro",
  "larguraDasCostas",
  "pescoco",
  "comprimentoDoBraco",
  "braco",
  "punho",
  "entrepernas",
  "coxa",
  "joelho",
  "tornozelo",
];

/**
 * Lê as medidas da tabela (nome → mm) e completa o que faltar.
 *
 * `overrides` são medidas trocadas na tela (o manequim ajustado na Prova):
 * valem por cima da tabela, contam como dadas (não estimadas) e entram nas
 * estimativas das outras (a coxa estimada acompanha o quadril ajustado). Fora
 * do plausível, são recusadas como as da tabela (pelo nome do campo).
 */
export function readMeasurements(
  table: Record<string, number>,
  overrides: Partial<Record<MeasurementKey, number>> = {},
): MeasurementReading {
  const given: Partial<BodyMeasurements> = {};
  const ignored: string[] = [];
  const rejected: string[] = [];
  for (const [rawName, value] of Object.entries(table)) {
    const key = NAMES[rawName.trim().toLowerCase()];
    if (!key) {
      ignored.push(rawName);
      continue;
    }
    const [lo, hi] = MEASUREMENT_RANGE[key];
    if (!Number.isFinite(value) || value < lo || value > hi) {
      rejected.push(rawName);
      continue;
    }
    given[key] = value;
  }
  for (const key of MEASUREMENT_KEYS) {
    const value = overrides[key];
    if (value === undefined) continue;
    const [lo, hi] = MEASUREMENT_RANGE[key];
    if (!Number.isFinite(value) || value < lo || value > hi) {
      rejected.push(key);
      continue;
    }
    given[key] = value;
  }

  const estimated: MeasurementKey[] = [];
  const pick = (key: MeasurementKey, fallback: number): number => {
    const v = given[key];
    if (v !== undefined) return v;
    estimated.push(key);
    return fallback;
  };

  // Proporções de partida para um corpo adulto; a tabela sempre manda.
  const altura = pick("altura", 1650);
  const busto = pick("busto", altura * 0.55);
  const cintura = pick("cintura", altura * 0.42);
  const quadril = pick("quadril", altura * 0.58);
  const values: BodyMeasurements = {
    altura,
    busto,
    cintura,
    quadril,
    alturaDoQuadril: pick("alturaDoQuadril", altura * 0.12),
    entrepernas: pick("entrepernas", altura * 0.45),
    comprimentoDoBraco: pick("comprimentoDoBraco", altura * 0.35),
    punho: pick("punho", altura * 0.095),
    ombro: pick("ombro", altura * 0.075),
    larguraDasCostas: pick("larguraDasCostas", altura * 0.21),
    pescoco: pick("pescoco", altura * 0.21),
    coxa: pick("coxa", quadril * 0.57),
    joelho: pick("joelho", quadril * 0.38),
    tornozelo: pick("tornozelo", quadril * 0.23),
    braco: pick("braco", busto * 0.3),
  };
  return { values, estimated, ignored, rejected };
}
