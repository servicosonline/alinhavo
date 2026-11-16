import {
  BELLY_RANGE,
  HEEL_RANGE,
  LIMB_IDS,
  LIMB_WHOLE,
  MEASUREMENT_KEYS,
  MEASUREMENT_RANGE,
  readMeasurements,
  type BodyConditions,
  type BodyMeasurements,
  type BodyOverrides,
  type LimbId,
  type MeasurementKey,
} from "@alinhavo/cloth";
import { setBodyOverride } from "./body";

/**
 * Manequim salvo (tabela `body_presets`): o corpo ajustado na Prova, com nome,
 * para carregar em qualquer molde da organização. Guarda as medidas que
 * vestiram (em mm, a tabela mais os ajustes) e as condições (gestante, membro
 * cortado, salto). Carregar aplica as medidas por cima da tabela do tamanho
 * escolhido, como se a pessoa tivesse trocado cada uma na tela.
 */

export const SAVED_BODY_NAME_MAX = 60;
/** O mesmo limite do banco (private.body_presets_limit). */
export const SAVED_BODIES_MAX = 100;

export type SavedBody = {
  id: string;
  name: string;
  measurements: Partial<BodyMeasurements>;
  /** Com o salto (`heel`), que na tela fica num controle à parte. */
  conditions: BodyConditions;
  updatedAt: string;
};

/** Resposta de salvar ou apagar: a lista nova (ordem de nome) ou o erro para a tela. */
export type SavedBodiesResult = { ok: true; list: SavedBody[]; savedId?: string } | { ok: false; error: string };

/** Manequins salvos na Prova do painel (sem isso, o painel do corpo não mostra a seção). */
export type SavedBodyLibrary = {
  initial: SavedBody[];
  /** Quem edita moldes salva e apaga; os outros só carregam. */
  canEdit: boolean;
  save: (name: string, payload: SavedBodyPayload) => Promise<SavedBodiesResult>;
  remove: (id: string) => Promise<SavedBodiesResult>;
};

/** O que vai para o banco ao salvar. */
export type SavedBodyPayload = { measurements: Partial<Record<MeasurementKey, number>>; conditions: BodyConditions };

/** Nome do manequim: espaços juntados, de 1 a 60 letras. */
export function cleanSavedBodyName(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const value = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (!value) return { ok: false, error: "Dê um nome ao manequim." };
  if (value.length > SAVED_BODY_NAME_MAX) return { ok: false, error: `O nome pode ter até ${SAVED_BODY_NAME_MAX} letras.` };
  return { ok: true, value };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const inRange = (v: unknown, [lo, hi]: readonly [number, number]): v is number => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;

/** Medidas conhecidas e dentro dos limites do corpo, arredondadas ao mm; o resto fica de fora. */
export function readSavedMeasurements(raw: unknown): Partial<BodyMeasurements> {
  const out: Partial<BodyMeasurements> = {};
  if (!isObject(raw)) return out;
  for (const key of MEASUREMENT_KEYS) {
    const v = raw[key];
    if (inRange(v, MEASUREMENT_RANGE[key])) out[key] = Math.round(v);
  }
  return out;
}

/** Condições válidas (o que não lê fica de fora: o corpo volta ao normal naquele ponto). */
export function readSavedConditions(raw: unknown): BodyConditions {
  const out: BodyConditions = {};
  if (!isObject(raw)) return out;
  if (inRange(raw.belly, BELLY_RANGE)) out.belly = Math.round(raw.belly);
  if (inRange(raw.heel, HEEL_RANGE) && raw.heel > 0) out.heel = Math.round(raw.heel);
  if (isObject(raw.limbs)) {
    const limbs: Partial<Record<LimbId, number>> = {};
    for (const id of LIMB_IDS) {
      const v = raw.limbs[id];
      if (inRange(v, [0, LIMB_WHOLE]) && v < LIMB_WHOLE) limbs[id] = Math.round(v * 100) / 100;
    }
    if (Object.keys(limbs).length > 0) out.limbs = limbs;
  }
  return out;
}

/** Uma linha do banco; sem nenhuma medida válida, não é manequim (fica de fora da lista). */
export function readSavedBody(row: { id: string; name: string; measurements: unknown; conditions: unknown; updated_at: string }): SavedBody | null {
  const measurements = readSavedMeasurements(row.measurements);
  if (Object.keys(measurements).length === 0) return null;
  return { id: row.id, name: row.name, measurements, conditions: readSavedConditions(row.conditions), updatedAt: row.updated_at };
}

export function readSavedBodies(rows: Parameters<typeof readSavedBody>[0][]): SavedBody[] {
  return rows
    .map(readSavedBody)
    .filter((b): b is SavedBody => b !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** O corpo que está vestindo agora, para salvar: as medidas todas e as condições com o salto. */
export function savedBodyPayload(values: BodyMeasurements, conditions: BodyConditions, heel: number): SavedBodyPayload {
  const measurements: Partial<Record<MeasurementKey, number>> = {};
  for (const key of MEASUREMENT_KEYS) measurements[key] = Math.round(values[key]);
  return { measurements, conditions: readSavedConditions({ ...conditions, heel }) };
}

/**
 * Carrega o manequim sobre a tabela do tamanho: cada medida salva vira um
 * ajuste (a que for igual à da tabela não conta como trocada); condições e
 * salto voltam como foram salvos.
 */
export function applySavedBody(saved: SavedBody, table: Record<string, number>): { overrides: BodyOverrides; conditions: BodyConditions; heel: number } {
  const base = readMeasurements(table).values;
  let overrides: BodyOverrides = {};
  for (const [key, mm] of Object.entries(saved.measurements) as [MeasurementKey, number][]) {
    overrides = setBodyOverride(overrides, base, key, mm);
  }
  // Medida que o corpo estima a partir das outras (ex.: o braço pelo busto) e que
  // já sai igual sem o ajuste não conta como trocada.
  const target = readMeasurements(table, overrides).values;
  for (const key of Object.keys(overrides) as MeasurementKey[]) {
    const without = { ...overrides };
    delete without[key];
    const values = readMeasurements(table, without).values;
    if (MEASUREMENT_KEYS.every((k) => Math.abs(values[k] - target[k]) < 0.5)) overrides = without;
  }
  const { heel = 0, ...conditions } = saved.conditions;
  return { overrides, conditions, heel };
}

/** Já está vestindo este manequim? (medidas e condições iguais às salvas) */
export function isSavedBodyActive(saved: SavedBody, values: BodyMeasurements, conditions: BodyConditions, heel: number): boolean {
  const now = savedBodyPayload(values, conditions, heel);
  const keys = Object.keys(saved.measurements) as MeasurementKey[];
  if (keys.some((k) => now.measurements[k] !== saved.measurements[k])) return false;
  return JSON.stringify(sortKeys(now.conditions)) === JSON.stringify(sortKeys(saved.conditions));
}

function sortKeys(c: BodyConditions): unknown {
  return { belly: c.belly, heel: c.heel, limbs: c.limbs ? Object.fromEntries(Object.entries(c.limbs).sort()) : undefined };
}
