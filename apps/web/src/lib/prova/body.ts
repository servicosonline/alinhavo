import {
  BELLY_RANGE,
  LIMB_WHOLE,
  MEASUREMENT_RANGE,
  readMeasurements,
  type BodyConditions,
  type BodyMeasurements,
  type BodyOverrides,
  type LimbId,
  type MeasurementKey,
} from "@alinhavo/cloth";

/**
 * Manequim ajustado na Prova: as medidas do corpo trocadas na tela, por cima
 * da tabela do tamanho. Só fica guardado como manequim salvo (`saved-bodies.ts`);
 * trocar o tamanho volta à tabela.
 */

export type BodyField = { key: MeasurementKey; name: string; hint?: string };
export type BodyGroup = { name: string; fields: BodyField[] };

/** Grupos e nomes na ordem da tela. */
export const BODY_GROUPS: BodyGroup[] = [
  { name: "Geral", fields: [{ key: "altura", name: "Altura" }] },
  {
    name: "Tronco",
    fields: [
      { key: "busto", name: "Busto" },
      { key: "cintura", name: "Cintura" },
      { key: "quadril", name: "Quadril" },
      { key: "alturaDoQuadril", name: "Altura do quadril", hint: "Da cintura até a linha do quadril" },
      { key: "ombro", name: "Ombro", hint: "Do pescoço à ponta do ombro" },
      { key: "larguraDasCostas", name: "Largura das costas" },
      { key: "pescoco", name: "Pescoço" },
    ],
  },
  {
    name: "Braços",
    fields: [
      { key: "comprimentoDoBraco", name: "Comprimento do braço", hint: "Do ombro ao punho" },
      { key: "braco", name: "Braço", hint: "Volta do bíceps" },
      { key: "punho", name: "Punho" },
    ],
  },
  {
    name: "Pernas",
    fields: [
      { key: "entrepernas", name: "Entrepernas", hint: "Do chão ao gancho" },
      { key: "coxa", name: "Coxa" },
      { key: "joelho", name: "Joelho" },
      { key: "tornozelo", name: "Tornozelo" },
    ],
  },
];

/** Nome legível de cada medida (minúsculo, para frases). */
export const BODY_FIELD_NAME: Record<MeasurementKey, string> = Object.fromEntries(
  BODY_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.name.toLowerCase()])),
) as Record<MeasurementKey, string>;

/** Limites do campo, em mm, os mesmos que o corpo aceita. */
export function bodyRange(key: MeasurementKey): readonly [number, number] {
  return MEASUREMENT_RANGE[key];
}

/**
 * Troca uma medida. O valor é arredondado ao mm e preso aos limites do corpo;
 * igual ao da tabela (ou ao estimado, sem ajuste), o ajuste sai.
 */
export function setBodyOverride(overrides: BodyOverrides, base: BodyMeasurements, key: MeasurementKey, mm: number): BodyOverrides {
  const [lo, hi] = MEASUREMENT_RANGE[key];
  if (!Number.isFinite(mm)) return overrides;
  const value = Math.min(hi, Math.max(lo, Math.round(mm)));
  const next = { ...overrides };
  if (Math.abs(value - base[key]) < 0.5) delete next[key];
  else next[key] = value;
  return next;
}

/** Quantas medidas foram trocadas. */
export function overrideCount(overrides: BodyOverrides): number {
  return Object.values(overrides).filter((v) => v !== undefined).length;
}

/**
 * Medidas do corpo com e sem os ajustes, pela mesma leitura que o Worker faz
 * (`readMeasurements`): `table` é o corpo só da tabela, `values` o que vai
 * vestir. `estimated` são os campos que nem a tabela nem a tela deram.
 */
export function bodyMeasurements(table: Record<string, number>, overrides: BodyOverrides) {
  const plain = readMeasurements(table);
  const adjusted = readMeasurements(table, overrides);
  return { table: plain.values, values: adjusted.values, estimated: adjusted.estimated };
}

// ---------------------------------------------------------------------------
// Tipos de corpo e condições
// ---------------------------------------------------------------------------

export type BodyTypeId = "magro" | "plus" | "musculoso";

/**
 * Tipos de corpo prontos: multiplicam as medidas da tabela do tamanho. São
 * ponto de partida visual, não norma (a pessoa vê os valores e ajusta).
 */
export const BODY_TYPES: { id: BodyTypeId; name: string; factors: Partial<Record<MeasurementKey, number>> }[] = [
  {
    id: "magro",
    name: "Magro",
    factors: { busto: 0.9, cintura: 0.88, quadril: 0.9, braco: 0.82, coxa: 0.82, joelho: 0.92, tornozelo: 0.95, punho: 0.95, pescoco: 0.95 },
  },
  {
    id: "plus",
    name: "Plus size",
    factors: { busto: 1.22, cintura: 1.32, quadril: 1.22, braco: 1.3, coxa: 1.28, joelho: 1.12, tornozelo: 1.08, punho: 1.06, pescoco: 1.1, larguraDasCostas: 1.08 },
  },
  {
    id: "musculoso",
    name: "Musculoso",
    factors: { busto: 1.08, cintura: 0.98, braco: 1.28, coxa: 1.15, ombro: 1.1, larguraDasCostas: 1.12, pescoco: 1.1, punho: 1.04 },
  },
];

/** Medidas do tipo de corpo sobre as da tabela (presas aos limites do corpo). */
export function bodyTypeOverrides(base: BodyMeasurements, id: BodyTypeId): BodyOverrides {
  const type = BODY_TYPES.find((t) => t.id === id);
  let out: BodyOverrides = {};
  if (!type) return out;
  for (const [key, factor] of Object.entries(type.factors) as [MeasurementKey, number][]) {
    out = setBodyOverride(out, base, key, base[key] * factor);
  }
  return out;
}

export type LimbKind = "arm" | "leg";
export const LIMB_NAME: Record<LimbId, string> = {
  leftArm: "Braço esquerdo",
  rightArm: "Braço direito",
  leftLeg: "Perna esquerda",
  rightLeg: "Perna direita",
};
export const limbKind = (id: LimbId): LimbKind => (id.endsWith("Arm") ? "arm" : "leg");

/** Pontos de corte prontos, em peças da corrente (ver LIMB_WHOLE no cloth). */
export const LIMB_LEVELS: Record<LimbKind, { value: number; name: string }[]> = {
  arm: [
    { value: LIMB_WHOLE, name: "Inteiro" },
    { value: 2, name: "Sem a mão" },
    { value: 1.5, name: "Abaixo do cotovelo" },
    { value: 0.6, name: "Acima do cotovelo" },
    { value: 0, name: "Sem o braço" },
  ],
  leg: [
    { value: LIMB_WHOLE, name: "Inteira" },
    { value: 2, name: "Sem o pé" },
    { value: 1.4, name: "Abaixo do joelho" },
    { value: 0.6, name: "Acima do joelho" },
    { value: 0, name: "Sem a perna" },
  ],
};

/** Nome do ponto de corte ("Abaixo do cotovelo") ou, fora dos prontos, a posição em texto. */
export function limbLevelName(id: LimbId, value: number): string {
  const kind = limbKind(id);
  const found = LIMB_LEVELS[kind].find((l) => Math.abs(l.value - value) < 1e-6);
  if (found) return found.name;
  const parts = kind === "arm" ? ["do braço", "do antebraço", "da mão"] : ["da coxa", "da canela", "do pé"];
  const i = Math.min(2, Math.floor(value));
  return `${Math.round((value - i) * 100)}% ${parts[i]}`;
}

/** Troca o corte de um membro; inteiro sai da lista. */
export function setLimb(conditions: BodyConditions, id: LimbId, value: number): BodyConditions {
  const v = Math.min(LIMB_WHOLE, Math.max(0, Number.isFinite(value) ? Math.round(value * 100) / 100 : LIMB_WHOLE));
  const limbs = { ...conditions.limbs };
  if (v >= LIMB_WHOLE) delete limbs[id];
  else limbs[id] = v;
  const next: BodyConditions = { ...conditions, limbs };
  if (Object.keys(limbs).length === 0) delete next.limbs;
  return next;
}

/** Volta natural na altura da barriga (a mesma conta do manequim), e a sugestão ao ligar "gestante". */
export function naturalBelly(values: BodyMeasurements): number {
  return (values.quadril + values.cintura) / 2;
}
export function suggestedBelly(values: BodyMeasurements): number {
  return Math.min(BELLY_RANGE[1], Math.round(naturalBelly(values) + 180));
}

/** Liga, desliga ou muda a barriga (mm, presa aos limites). */
export function setBelly(conditions: BodyConditions, mm: number | null): BodyConditions {
  const next = { ...conditions };
  if (mm === null || !Number.isFinite(mm)) delete next.belly;
  else next.belly = Math.min(BELLY_RANGE[1], Math.max(BELLY_RANGE[0], Math.round(mm)));
  return next;
}

/** Resumo para o título do painel ("2 medidas · gestante · 1 membro"). */
export function bodySummary(overrides: BodyOverrides, conditions: BodyConditions): string {
  const parts: string[] = [];
  const n = overrideCount(overrides);
  if (n > 0) parts.push(n === 1 ? "1 medida trocada" : `${n} medidas trocadas`);
  if (conditions.belly !== undefined) parts.push("gestante");
  const limbs = Object.keys(conditions.limbs ?? {}).length;
  if (limbs > 0) parts.push(limbs === 1 ? "1 membro" : `${limbs} membros`);
  return parts.length === 0 ? "pela tabela" : parts.join(" · ");
}
