import type { PatternDocument } from "@alinhavo/geometry";
import type { FabricId } from "./protocol";

/**
 * Look na Prova: o molde em prova e outras roupas no mesmo corpo, em camadas
 * (a primeira da lista é a de dentro). Só mostra: o ajuste vale só para o
 * molde em prova, e o look não fica salvo. Regras puras, sem React.
 */

/** Uma roupa que pode entrar no look (outro molde). */
export type LookOption = { id: string; name: string; doc: PatternDocument };

/** Um item do look, de dentro para fora. O molde em prova é o item com `main`. */
export type LookItem = { key: string; main: boolean; optionId: string; name: string; fabric: FabricId };

/** Até quantas roupas o look veste (com o molde em prova): mais que isso pesa demais no navegador. */
export const LOOK_MAX = 4;

/** O look só com o molde em prova. */
export function lookStart(name: string, fabric: FabricId): LookItem[] {
  return [{ key: "main", main: true, optionId: "", name, fabric }];
}

/** Põe a roupa por fora de tudo. Não passa de LOOK_MAX; a chave é nova e única. */
export function addToLook(look: readonly LookItem[], option: LookOption, fabric: FabricId): LookItem[] {
  if (look.length >= LOOK_MAX) return [...look];
  let n = look.length;
  while (look.some((i) => i.key === `extra-${n}`)) n++;
  return [...look, { key: `extra-${n}`, main: false, optionId: option.id, name: option.name, fabric }];
}

/** Tira uma roupa (o molde em prova não sai). */
export function removeFromLook(look: readonly LookItem[], key: string): LookItem[] {
  return look.filter((i) => i.main || i.key !== key);
}

/** Leva a roupa uma camada para fora (+1) ou para dentro (−1); na ponta, nada muda. */
export function moveInLook(look: readonly LookItem[], key: string, delta: 1 | -1): LookItem[] {
  const i = look.findIndex((x) => x.key === key);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= look.length) return [...look];
  const out = [...look];
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}

/** Troca o tecido de uma roupa do look. */
export function setLookFabric(look: readonly LookItem[], key: string, fabric: FabricId): LookItem[] {
  return look.map((i) => (i.key === key ? { ...i, fabric } : i));
}

/** Uma roupa a mais na Prova: o documento, o tecido e a camada (0 = a de dentro). */
export type LookExtra = { name: string; doc: PatternDocument; fabric: FabricId; layer: number };

/**
 * Camada do molde em prova e as outras roupas, prontas para o Worker. Item cuja
 * opção sumiu (molde que não está mais na lista) fica de fora, sem buraco nas camadas.
 */
export function lookSetup(look: readonly LookItem[], options: readonly LookOption[]): { layer: number; extras: LookExtra[] } {
  const byId = new Map(options.map((o) => [o.id, o]));
  const kept = look.filter((i) => i.main || byId.has(i.optionId));
  const extras: LookExtra[] = [];
  let layer = 0;
  kept.forEach((item, k) => {
    if (item.main) layer = k;
    else extras.push({ name: item.name, doc: byId.get(item.optionId)!.doc, fabric: item.fabric, layer: k });
  });
  return { layer, extras };
}

/**
 * O documento com as partes renomeadas (`prefixo` + id) nas partes e nas
 * costuras: duas roupas do look podem ter partes com o mesmo id ("frente").
 */
export function prefixPieces(doc: PatternDocument, prefix: string): PatternDocument {
  return {
    ...doc,
    pieces: doc.pieces.map((p) => ({ ...p, id: `${prefix}${p.id}` })),
    seams: doc.seams.map((s) => ({ ...s, a: { ...s.a, piece: `${prefix}${s.a.piece}` }, b: { ...s.b, piece: `${prefix}${s.b.piece}` } })),
  };
}

/** O tamanho que a roupa do look veste: o mesmo do molde em prova, se ela tiver; senão, o base dela. */
export function lookSize(doc: PatternDocument, size: string): { size: string; fallback: boolean } {
  return doc.sizes.includes(size) ? { size, fallback: false } : { size: doc.baseSize, fallback: true };
}

/** Quanto cada roupa do look clareia (> 1) ou escurece a cor do tecido na vista "Tecido", pela posição na lista. */
const SHADES = [1, 0.72, 1.22, 0.55];

/** A cor de uma roupa do look: a do tecido, com o tom da posição, para as roupas se distinguirem. */
export function lookShade(hex: string, position: number): string {
  const f = SHADES[position % SHADES.length]!;
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
