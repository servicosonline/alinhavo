import { hexToLinearRgb, type Rgb } from "./colors";
import type { FabricId } from "./protocol";

/**
 * Lavagem do jeans na Prova (só na tela, como a pose): a cor do tecido clareia
 * pelo tipo de lavagem e desbota mais onde o tecido estica (joelho, coxa,
 * quadril), pelo mapa de esticamento que a Prova já calcula.
 *
 * `tone`: quanto a cor vai do tecido cru até o jeans claro (0 a 1).
 * `fade`: quanto o ponto mais esticado vai até o desbotado (0 a 1).
 * Valores de olho, a calibrar com amostras de lavanderia.
 */
export type WashId = "crua" | "escura" | "media" | "clara" | "estonada";

export const WASHES: readonly { id: WashId; name: string; hint: string; tone: number; fade: number }[] = [
  { id: "crua", name: "Crua", hint: "Sem lavagem", tone: 0, fade: 0 },
  { id: "escura", name: "Escura", hint: "Amaciada, quase sem desbotar", tone: 0.12, fade: 0.15 },
  { id: "media", name: "Média", hint: "Clareada, desbota um pouco no joelho e na coxa", tone: 0.35, fade: 0.3 },
  { id: "clara", name: "Clara", hint: "Bem clareada", tone: 0.6, fade: 0.35 },
  { id: "estonada", name: "Estonada", hint: "Desbotado forte onde o tecido estica", tone: 0.4, fade: 0.75 },
];

/** Tecidos que aceitam lavagem na Prova. */
export const WASHABLE: readonly FabricId[] = ["jeans", "jeansElastano"];

export const washable = (fabric: FabricId) => WASHABLE.includes(fabric);

/** Jeans claro (o fim do clareamento) e o desbotado, em sRGB. */
export const WASH_LIGHT = "#a9bdd2";
export const WASH_BLEACH = "#dfe6ee";

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Cor lavada (RGB linear), sem o desbotado. */
export function washBase(fabricHex: string, wash: WashId): Rgb {
  const w = WASHES.find((x) => x.id === wash) ?? WASHES[0]!;
  return mix(hexToLinearRgb(fabricHex), hexToLinearRgb(WASH_LIGHT), w.tone);
}

/**
 * Pinta os vértices `start`…`start + count` em `out` (RGB linear, 3 por vértice).
 * Desbota a partir de 20% do limite do tecido até 90% dele; sem mapa ainda, só a cor lavada.
 */
export function paintWash(
  out: Float32Array,
  start: number,
  count: number,
  fabricHex: string,
  wash: WashId,
  stretch: ArrayLike<number> | null,
  fabricLimit: number,
): Float32Array {
  const w = WASHES.find((x) => x.id === wash) ?? WASHES[0]!;
  const base = washBase(fabricHex, wash);
  const bleach = hexToLinearRgb(WASH_BLEACH);
  for (let v = start; v < start + count; v++) {
    const s = stretch ? (stretch[v] ?? 0) : 0;
    const f = w.fade * smoothstep(0.2 * fabricLimit, 0.9 * fabricLimit, s);
    const c = f > 0 ? mix(base, bleach, f) : base;
    out[v * 3] = c[0];
    out[v * 3 + 1] = c[1];
    out[v * 3 + 2] = c[2];
  }
  return out;
}
