import type { RgbaImage } from "./aruco";

/** Imagem em tons de cinza (0 a 255). */
export type GrayImage = { width: number; height: number; data: Float32Array };

/** RGBA → cinza (luminância Rec. 601). */
export function toGray(image: RgbaImage): GrayImage {
  const { width, height, data } = image;
  const out = new Float32Array(width * height);
  for (let i = 0, k = 0; i < out.length; i++, k += 4) out[i] = 0.299 * data[k]! + 0.587 * data[k + 1]! + 0.114 * data[k + 2]!;
  return { width, height, data: out };
}

/** Valor por interpolação bilinear; NaN fora da imagem. Coordenadas com o centro do pixel em +0,5. */
export function sample(img: GrayImage, x: number, y: number): number {
  const fx = x - 0.5;
  const fy = y - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  if (x0 < 0 || y0 < 0 || x0 + 1 >= img.width || y0 + 1 >= img.height) return Number.NaN;
  const tx = fx - x0;
  const ty = fy - y0;
  const i = y0 * img.width + x0;
  const d = img.data;
  const top = d[i]! * (1 - tx) + d[i + 1]! * tx;
  const bottom = d[i + img.width]! * (1 - tx) + d[i + img.width + 1]! * tx;
  return top * (1 - ty) + bottom * ty;
}
