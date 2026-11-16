/**
 * Escalas de cor dos mapas da Prova, na convenção dos softwares de prova 3D:
 * azul → verde → amarelo → vermelho. Cores em RGB de 0 a 1.
 */

export type Rgb = [number, number, number];

const STOPS: Rgb[] = [
  [0.16, 0.36, 0.78], // azul
  [0.22, 0.66, 0.36], // verde
  [0.95, 0.8, 0.22], // amarelo
  [0.84, 0.2, 0.15], // vermelho
];

/** Cor na posição t (0 = azul, 1 = vermelho); fora da faixa, fica na ponta. */
export function heat(t: number): Rgb {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const a = STOPS[i]!;
  const b = STOPS[i + 1]!;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** Pressão: azul sem tensão, vermelho no limite de esticamento do tecido. */
export function pressureColor(stretch: number, fabricLimit: number): Rgb {
  return heat(fabricLimit > 0 ? stretch / fabricLimit : 0);
}

/** Folga considerada "bem solta" (azul), em mm. */
export const LOOSE_MM = 50;

/** Folga: vermelho encostado no corpo, azul com LOOSE_MM ou mais de sobra. */
export function clearanceColor(mm: number): Rgb {
  return heat(1 - mm / LOOSE_MM);
}

/** Preenche cores por vértice (3 floats cada) a partir dos valores. */
export function fillColors(values: ArrayLike<number>, color: (v: number) => Rgb, out = new Float32Array(values.length * 3)): Float32Array {
  for (let i = 0; i < values.length; i++) {
    const [r, g, b] = color(values[i]!);
    out[i * 3] = r;
    out[i * 3 + 1] = g;
    out[i * 3 + 2] = b;
  }
  return out;
}

/** sRGB (como no CSS) para linear: a cor do material o three converte sozinho; a cor por vértice, não. */
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** Cor hex em RGB linear (0 a 1), para pintar por vértice igual à cor do material. */
export function hexToLinearRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [toLinear(((n >> 16) & 255) / 255), toLinear(((n >> 8) & 255) / 255), toLinear((n & 255) / 255)];
}
