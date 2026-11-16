import { FABRIC_TUNING_RANGE } from "@alinhavo/cloth";
import { parseMoneyToCents } from "./money";
import { isFabricPhoto, isFabricPreset } from "./prova/fabric-options";
import type { FabricPreset } from "./supabase/database.types";
import { parseCmToMm } from "./units";

/**
 * Leitura do formulário de tecido (cadastro e edição). Puro: devolve as
 * colunas do banco ou a mensagem do que está errado. Vazio = sem o dado.
 */

export type FabricFields = {
  name: string;
  composition: string | null;
  width_mm: number | null;
  weight_gsm: number | null;
  price_cents: number | null;
  preset: FabricPreset | null;
  stretch_pct: number | null;
  drape: number | null;
  thickness_mm: number | null;
  texture: string | null;
  texture_cm: number | null;
};

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
/** Número com vírgula ou ponto; "" = null; não número = NaN (vira erro). */
const decimal = (form: FormData, key: string): number | null => {
  const t = text(form, key).replace(",", ".");
  if (!t) return null;
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : Number.NaN;
};
const inRange = (v: number | null, lo: number, hi: number) => v === null || (Number.isFinite(v) && v >= lo && v <= hi);

export function readFabricForm(form: FormData): { fields: FabricFields } | { error: string } {
  const name = text(form, "name");
  const composition = text(form, "composition");
  const widthText = text(form, "width");
  const weight = decimal(form, "weight");
  const price = parseMoneyToCents(form.get("price"));
  const presetRaw = text(form, "preset");
  if (name.length < 1 || name.length > 120) return { error: "Dê um nome ao tecido (até 120 caracteres)." };
  if (composition.length > 200) return { error: "Composição com até 200 caracteres." };
  const widthMm = widthText ? parseCmToMm(widthText) : null;
  if (widthText && widthMm === null) return { error: "Largura útil em cm, por exemplo 150." };
  if (widthMm !== null && (widthMm < 100 || widthMm > 5000)) return { error: "Largura útil entre 10 e 500 cm." };
  if (weight !== null && !(weight > 0 && weight < 2000)) return { error: "Gramatura em g/m², entre 1 e 2000." };
  if (price === undefined) return { error: "Preço inválido. Use, por exemplo, 39,90." };

  // Na Prova (só na edição; no cadastro vêm vazios).
  const stretch = decimal(form, "stretch");
  const drape = decimal(form, "drape");
  const thickness = decimal(form, "thickness");
  const textureCm = decimal(form, "textureCm");
  const [sLo, sHi] = FABRIC_TUNING_RANGE.stretchPct;
  const [tLo, tHi] = FABRIC_TUNING_RANGE.thicknessMm;
  if (!inRange(stretch, sLo, sHi)) return { error: `Elasticidade entre ${sLo} e ${sHi}%.` };
  if (drape !== null && !(Number.isInteger(drape) && drape >= 1 && drape <= 5)) return { error: "Caimento de 1 (armado) a 5 (fluido)." };
  if (!inRange(thickness, tLo, tHi)) return { error: `Espessura entre ${String(tLo).replace(".", ",")} e ${String(tHi).replace(".", ",")} mm.` };
  if (!inRange(textureCm, 1, 300)) return { error: "A foto mostra de 1 a 300 cm de tecido." };
  const texture = text(form, "texture");
  if (texture && !isFabricPhoto(texture)) return { error: "A foto do tecido não pôde ser lida. Escolha a imagem de novo." };

  return {
    fields: {
      name,
      composition: composition || null,
      width_mm: widthMm === null ? null : Math.round(widthMm),
      weight_gsm: weight,
      price_cents: price,
      preset: isFabricPreset(presetRaw) ? presetRaw : null,
      stretch_pct: stretch,
      drape,
      thickness_mm: thickness,
      texture: texture || null,
      texture_cm: texture ? (textureCm ?? 10) : null,
    },
  };
}
