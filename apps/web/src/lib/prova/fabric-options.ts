import { FABRIC_PRESETS, FABRIC_TUNING_RANGE, FABRICS, type FabricTuning } from "@alinhavo/cloth";
import type { FabricId } from "./protocol";

/**
 * Tecidos da Prova: os presets da biblioteca e, no painel, os tecidos
 * cadastrados pela confecção (um preset de partida ajustado pelos números
 * dela, com foto). Só leitura e regras; o cadastro mora em /tecidos.
 */

export type FabricPhoto = { dataUrl: string; cm: number };

export type ProvaFabricOption = {
  id: string;
  name: string;
  preset: FabricId;
  tuning: FabricTuning;
  /** A foto, quando veio junto; com `hasPhoto` e sem ela, a tela busca ao escolher (é pesada para vir na lista). */
  photo: FabricPhoto | null;
  hasPhoto: boolean;
};

/** O que o banco devolve de um tecido para a Prova. */
export type FabricProvaRow = {
  id: string;
  name: string;
  preset: string | null;
  weight_gsm: number | string | null;
  stretch_pct: number | string | null;
  drape: number | string | null;
  thickness_mm: number | string | null;
  /** Ausente quando a lista veio sem as fotos (a tela busca depois). */
  texture?: string | null;
  texture_cm: number | string | null;
};

/** Preset de quem não escolheu um no cadastro. */
export const DEFAULT_PRESET: FabricId = "planoLeve";
/** Largura da foto quando o cadastro não diz (cm). */
export const DEFAULT_PHOTO_CM = 10;
/** Foto do tecido: data URL de imagem, até o limite do banco. */
export const FABRIC_PHOTO_MAX = 200_000;

export function isFabricPreset(id: unknown): id is FabricId {
  return typeof id === "string" && (FABRIC_PRESETS as readonly string[]).includes(id);
}

export function isFabricPhoto(url: unknown): url is string {
  return typeof url === "string" && url.length <= FABRIC_PHOTO_MAX && /^data:image\/(png|jpeg|webp);base64,/.test(url);
}

const num = (v: number | string | null | undefined): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Ajuste do tecido a partir do cadastro (o que estiver fora do plausível fica de fora). */
export function tuningFrom(row: Pick<FabricProvaRow, "weight_gsm" | "stretch_pct" | "drape" | "thickness_mm">): FabricTuning {
  const out: FabricTuning = {};
  const put = (key: keyof FabricTuning, value: number | undefined) => {
    const [lo, hi] = FABRIC_TUNING_RANGE[key];
    if (value !== undefined && value >= lo && value <= hi) out[key] = value;
  };
  put("weightGsm", num(row.weight_gsm));
  put("stretchPct", num(row.stretch_pct));
  put("drape", num(row.drape));
  put("thicknessMm", num(row.thickness_mm));
  return out;
}

/** Tecidos cadastrados, prontos para a Prova (sem nome não entra). */
export function fabricOptionsFrom(rows: readonly FabricProvaRow[]): ProvaFabricOption[] {
  return rows
    .filter((r) => r.name.trim().length > 0)
    .map((r) => {
      const cm = num(r.texture_cm);
      const photo = isFabricPhoto(r.texture) ? { dataUrl: r.texture, cm: photoCm(cm) } : null;
      return {
        id: r.id,
        name: r.name,
        preset: isFabricPreset(r.preset) ? r.preset : DEFAULT_PRESET,
        tuning: tuningFrom(r),
        photo,
        // A largura da foto só é gravada junto com ela.
        hasPhoto: photo !== null || (r.texture === undefined && cm !== undefined),
      };
    });
}

/** Largura da foto em cm (a padrão quando falta). */
export function photoCm(cm: number | undefined): number {
  return cm !== undefined && cm > 0 ? cm : DEFAULT_PHOTO_CM;
}

/** Valor do seletor: "p:<preset>" ou "o:<id do tecido cadastrado>". */
export const presetChoice = (id: FabricId) => `p:${id}`;
export const optionChoice = (id: string) => `o:${id}`;

export type ResolvedFabric = {
  /** Tecido cadastrado escolhido (null = preset da biblioteca). */
  optionId: string | null;
  /** O cadastrado tem foto que ainda não veio. */
  photoPending: boolean;
  preset: FabricId;
  tuning: FabricTuning | undefined;
  photo: FabricPhoto | null;
  /** Nome para a tela e para a aprovação. */
  name: string;
};

/** O tecido escolhido no seletor; escolha que não existe mais volta ao preset padrão. */
export function resolveFabric(choice: string, options: readonly ProvaFabricOption[]): ResolvedFabric {
  if (choice.startsWith("o:")) {
    const o = options.find((x) => x.id === choice.slice(2));
    if (o) return { optionId: o.id, photoPending: o.hasPhoto && !o.photo, preset: o.preset, tuning: o.tuning, photo: o.photo, name: o.name };
  }
  const id = choice.startsWith("p:") ? choice.slice(2) : choice;
  const preset = isFabricPreset(id) ? id : DEFAULT_PRESET;
  return { optionId: null, photoPending: false, preset, tuning: undefined, photo: null, name: FABRICS[preset].name };
}
