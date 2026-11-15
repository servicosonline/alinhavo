import { applyHomography, type Homography } from "./homography";
import { sample, type GrayImage } from "./image";

/**
 * A foto "endireitada": uma grade em mm sobre o plano da mesa, com o cinza
 * reamostrado da foto pela homografia (mm → pixel). Fora da foto, NaN.
 */
export type Rectified = {
  /** Canto superior esquerdo da grade, mm. */
  originX: number;
  originY: number;
  /** mm por célula. */
  step: number;
  width: number;
  height: number;
  data: Float32Array;
};

export function rectify(img: GrayImage, mmToPx: Homography, box: { minX: number; minY: number; maxX: number; maxY: number }, step: number): Rectified {
  const width = Math.max(1, Math.ceil((box.maxX - box.minX) / step));
  const height = Math.max(1, Math.ceil((box.maxY - box.minY) / step));
  const data = new Float32Array(width * height);
  for (let j = 0; j < height; j++) {
    const y = box.minY + (j + 0.5) * step;
    for (let i = 0; i < width; i++) {
      const p = applyHomography(mmToPx, { x: box.minX + (i + 0.5) * step, y });
      data[j * width + i] = sample(img, p.x, p.y);
    }
  }
  return { originX: box.minX, originY: box.minY, step, width, height, data };
}

/** Limiar de Otsu (0 a 255) dos valores válidos (ignora NaN). */
export function otsu(values: Float32Array): number {
  const hist = new Array<number>(256).fill(0);
  let n = 0;
  for (const v of values) {
    if (Number.isNaN(v)) continue;
    hist[Math.max(0, Math.min(255, Math.round(v)))]!++;
    n++;
  }
  if (n === 0) return 128;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i]!;
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]!;
    if (wB === 0) continue;
    const wF = n - wB;
    if (wF === 0) break;
    sumB += t * hist[t]!;
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) {
      best = between;
      threshold = t + 0.5;
    }
  }
  return threshold;
}

/** Máscara binária (1 = papel). */
export type Mask = { width: number; height: number; data: Uint8Array };

function erode(m: Mask): Mask {
  const { width: w, height: h, data } = m;
  const out = new Uint8Array(data.length);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      out[i] = data[i]! & data[i - 1]! & data[i + 1]! & data[i - w]! & data[i + w]!;
    }
  return { width: w, height: h, data: out };
}

function dilate(m: Mask): Mask {
  const { width: w, height: h, data } = m;
  const out = new Uint8Array(data.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      out[i] = data[i]! | (x > 0 ? data[i - 1]! : 0) | (x < w - 1 ? data[i + 1]! : 0) | (y > 0 ? data[i - w]! : 0) | (y < h - 1 ? data[i + w]! : 0);
    }
  return { width: w, height: h, data: out };
}

/** Abertura (tira pontinhos de papel soltos) e fechamento (tapa furinhos e riscos finos). */
export function cleanMask(m: Mask): Mask {
  return erode(dilate(dilate(erode(m))));
}

/** Componentes de 4 vizinhos: rótulo por pixel (0 = fundo) e a área de cada rótulo. */
export function components(m: Mask): { labels: Int32Array; areas: number[] } {
  const { width: w, height: h, data } = m;
  const labels = new Int32Array(w * h);
  const areas = [0];
  const stack: number[] = [];
  let next = 1;
  for (let start = 0; start < data.length; start++) {
    if (!data[start] || labels[start]) continue;
    let area = 0;
    labels[start] = next;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      area++;
      const x = i % w;
      const neighbors = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
      for (const j of neighbors) {
        if (j < 0 || j >= data.length || !data[j] || labels[j]) continue;
        labels[j] = next;
        stack.push(j);
      }
    }
    areas.push(area);
    next++;
  }
  return { labels, areas };
}

/** Só um rótulo, com os buracos de dentro preenchidos (riscos de lápis, furos de molde). */
export function fillHoles(labels: Int32Array, label: number, width: number, height: number): Mask {
  const inside = new Uint8Array(width * height);
  for (let i = 0; i < inside.length; i++) inside[i] = labels[i] === label ? 1 : 0;
  // Fundo alcançável pela borda da grade (4 vizinhos); o resto vira papel.
  const outside = new Uint8Array(width * height);
  const stack: number[] = [];
  const seed = (i: number) => {
    if (!inside[i] && !outside[i]) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < width; x++) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % width;
    if (x > 0) seed(i - 1);
    if (x < width - 1) seed(i + 1);
    if (i >= width) seed(i - width);
    if (i + width < inside.length) seed(i + width);
  }
  const out = new Uint8Array(width * height);
  for (let i = 0; i < out.length; i++) out[i] = outside[i] ? 0 : 1;
  return { width, height, data: out };
}
