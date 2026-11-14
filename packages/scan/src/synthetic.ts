import type { Point } from "@alinhavo/geometry";
import { markerBits, MARKER_MODULES, type RgbaImage } from "./aruco";
import { applyHomography, invertHomography, type Homography } from "./homography";
import type { MarkerSheet } from "./sheet";

/**
 * Só para testes: "fotografa" uma cena em mm (mesa escura, folha de
 * marcadores e um molde de papel) com uma homografia conhecida, com
 * supersampling, ruído e luz desigual. Dá a resposta certa para medir o Scan.
 */

export type Scene = {
  sheet: MarkerSheet;
  /** Markers a desenhar (padrão: todos da folha). */
  markerIds?: number[];
  /** Contorno do molde, mm (polígono denso). */
  paper: Point[];
  table?: number;
  paperValue?: number;
  sheetValue?: number;
  /** Outras áreas claras (reflexo, sombra clara), desenhadas sob o papel. */
  extra?: { polygon: Point[]; value: number }[];
};

/** Máscara do polígono numa grade fina (preenchimento par-ímpar por linha). */
function rasterPolygon(poly: Point[], res: number) {
  const minX = Math.min(...poly.map((p) => p.x)) - 1;
  const minY = Math.min(...poly.map((p) => p.y)) - 1;
  const w = Math.ceil((Math.max(...poly.map((p) => p.x)) + 1 - minX) / res);
  const h = Math.ceil((Math.max(...poly.map((p) => p.y)) + 1 - minY) / res);
  const data = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) {
    const y = minY + (j + 0.5) * res;
    const xs: number[] = [];
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k]!;
      const b = poly[(k + 1) % poly.length]!;
      if (a.y <= y !== b.y <= y) xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k]! - minX) / res - 0.5));
      const i1 = Math.min(w - 1, Math.floor((xs[k + 1]! - minX) / res - 0.5));
      for (let i = i0; i <= i1; i++) data[j * w + i] = 1;
    }
  }
  return (x: number, y: number) => {
    const i = Math.floor((x - minX) / res);
    const j = Math.floor((y - minY) / res);
    return i >= 0 && j >= 0 && i < w && j < h && data[j * w + i] === 1;
  };
}

export function renderPhoto(
  scene: Scene,
  mmToPx: Homography,
  width: number,
  height: number,
  opts: { noise?: number; light?: number; supersample?: number; seed?: number } = {},
): RgbaImage {
  const pxToMm = invertHomography(mmToPx);
  const table = scene.table ?? 45;
  const paperValue = scene.paperValue ?? 222;
  const sheetValue = scene.sheetValue ?? 245;
  const ids = new Set(scene.markerIds ?? scene.sheet.markers.map((m) => m.id));
  const markers = scene.sheet.markers.filter((m) => ids.has(m.id)).map((m) => ({ ...m, bits: markerBits(m.id) }));
  const inPaper = rasterPolygon(scene.paper, 0.1);
  const extras = (scene.extra ?? []).map((e) => ({ inside: rasterPolygon(e.polygon, 1), value: e.value }));
  const ss = opts.supersample ?? 2;
  const noise = opts.noise ?? 6;
  const light = opts.light ?? 0.15;
  let s = (opts.seed ?? 1) >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };

  const shade = (p: Point): number => {
    for (const m of markers) {
      if (p.x >= m.x && p.y >= m.y && p.x < m.x + m.size && p.y < m.y + m.size) {
        const mod = m.size / MARKER_MODULES;
        const i = Math.floor((p.y - m.y) / mod);
        const j = Math.floor((p.x - m.x) / mod);
        const inner = i >= 1 && j >= 1 && i <= MARKER_MODULES - 2 && j <= MARKER_MODULES - 2;
        return inner && m.bits[i - 1]![j - 1] ? sheetValue : 15;
      }
    }
    if (p.x >= 0 && p.y >= 0 && p.x < scene.sheet.widthMm && p.y < scene.sheet.heightMm) return sheetValue;
    if (inPaper(p.x, p.y)) return paperValue;
    for (const e of extras) if (e.inside(p.x, p.y)) return e.value;
    return table;
  };

  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      for (let a = 0; a < ss; a++)
        for (let b = 0; b < ss; b++) v += shade(applyHomography(pxToMm, { x: x + (a + 0.5) / ss, y: y + (b + 0.5) / ss }));
      v /= ss * ss;
      v *= 1 - light + light * (x / width); // luz mais forte de um lado
      v += (rand() - 0.5) * 2 * noise;
      const k = (y * width + x) * 4;
      data[k] = data[k + 1] = data[k + 2] = v;
      data[k + 3] = 255;
    }
  }
  return { width, height, data };
}

/** Pontos de uma curva cúbica (para montar contornos de teste). */
export function cubicPoints(p0: Point, c1: Point, c2: Point, p3: Point, steps: number): Point[] {
  return Array.from({ length: steps }, (_, k) => {
    const t = k / steps;
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
    };
  });
}

/** Segmento reto em pontos (sem o último). */
export function linePoints(a: Point, b: Point, steps: number): Point[] {
  return Array.from({ length: steps }, (_, k) => ({ x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps }));
}

export { applyHomography };
