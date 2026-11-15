import type { Piece, Point } from "@alinhavo/geometry";
import { detectMarkers, type RgbaImage } from "./aruco";
import { traceOuterBoundary } from "./contour";
import { applyHomography, fitHomography, invertHomography, type Homography } from "./homography";
import { toGray } from "./image";
import { refineCorners } from "./refine";
import { cleanMask, components, fillHoles, otsu, rectify, type Mask, type Rectified } from "./segment";
import { outlineToPiece } from "./shape";
import { A4_SHEET, sheetMarkerCorners, type MarkerSheet } from "./sheet";

/**
 * Scan: da foto de um molde de papel (ao lado da folha de marcadores, sobre
 * um fundo contrastante) para uma parte de molde em mm. Puro, para rodar em
 * Web Worker. Passos: marcadores → homografia → foto endireitada em mm →
 * papel separado do fundo (Otsu) → contorno → parte (`outlineToPiece`).
 */

export type ScanOptions = {
  sheet?: MarkerSheet;
  /** mm por célula da foto endireitada. Padrão 0,5. */
  stepMm?: number;
  /** Limite de células da foto endireitada (o passo cresce acima disso). */
  maxCells?: number;
  name?: string;
};

export type ScanSuccess = {
  ok: true;
  piece: Piece;
  piques: Point[];
  corners: Point[];
  /** Ids dos marcadores achados. */
  markers: number[];
  /** Erro médio dos cantos dos marcadores depois da homografia, mm. */
  markerErrorMm: number;
  /** Contorno achado, nas coordenadas da foto endireitada (mm), para desenhar por cima. */
  outlineMm: Point[];
  /** Quanto a parte foi deslocada para começar em (0, 0). */
  offsetMm: Point;
  rectified: Rectified;
  warnings: string[];
};

export type ScanFailure = { ok: false; error: string; markers: number[] };

const DEFAULT_STEP = 0.5;
const DEFAULT_MAX_CELLS = 6_000_000;
/** Peças menores que isso (mm²) são sujeira, não molde. */
const MIN_PIECE_AREA = 40 * 40;

function photoBox(width: number, height: number, pxToMm: Homography, sheet: MarkerSheet) {
  const cx = sheet.widthMm / 2;
  const cy = sheet.heightMm / 2;
  const limit = 2000;
  const pts: Point[] = [];
  const steps = 16;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    for (const [x, y] of [
      [t * width, 0],
      [t * width, height],
      [0, t * height],
      [width, t * height],
    ] as const) {
      const w = pxToMm[6] * x + pxToMm[7] * y + pxToMm[8];
      if (w <= 0) continue; // além do horizonte
      const p = applyHomography(pxToMm, { x, y });
      pts.push({ x: Math.max(cx - limit, Math.min(cx + limit, p.x)), y: Math.max(cy - limit, Math.min(cy + limit, p.y)) });
    }
  }
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x)),
    maxY: Math.max(...pts.map((p) => p.y)),
  };
}

/**
 * Quem é papel: a classe que menos aparece na moldura da FOTO (a borda da
 * foto é mesa). A moldura é a beira da área fotografada dentro da grade
 * endireitada, que tem os cantos fora da foto (NaN em `photo`); a borda da
 * grade não serve (em foto em perspectiva quase toda ela fica fora da foto,
 * e o pouco que sobra pode ser só um reflexo). `values` é NaN também na
 * folha de marcadores, que não conta.
 */
export function paperIsBright(values: Float32Array, photo: Float32Array, w: number, h: number, t: number): boolean {
  let bright = 0;
  let count = 0;
  const outside = (i: number, j: number) => i < 0 || j < 0 || i >= w || j >= h || Number.isNaN(photo[j * w + i]!);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const v = values[j * w + i]!;
      if (Number.isNaN(v)) continue;
      if (!outside(i - 1, j) && !outside(i + 1, j) && !outside(i, j - 1) && !outside(i, j + 1)) continue;
      count++;
      if (v > t) bright++;
    }
  return count === 0 || bright / count < 0.5;
}

export function scanPhoto(image: RgbaImage, options: ScanOptions = {}): ScanSuccess | ScanFailure {
  const sheet = options.sheet ?? A4_SHEET;
  const gray = toGray(image);
  const byId = new Map(sheet.markers.map((m) => [m.id, m]));
  const found = detectMarkers(image).filter((m) => byId.has(m.id));
  const ids = [...new Set(found.map((m) => m.id))].sort((a, b) => a - b);
  if (ids.length === 0) return { ok: false, error: "Nenhum marcador da folha apareceu na foto. Enquadre a folha inteira, sem reflexo.", markers: [] };
  if (ids.length < 2) return { ok: false, error: "Só um marcador da folha foi achado. Enquadre a folha inteira, sem sombra nem reflexo.", markers: ids };

  // Um marcador de cada id (o primeiro); cantos refinados abaixo do pixel.
  const px: Point[] = [];
  const mm: Point[] = [];
  for (const id of ids) {
    const m = found.find((f) => f.id === id)!;
    refineCorners(gray, m.corners).forEach((c, k) => {
      px.push(c);
      mm.push(sheetMarkerCorners(byId.get(id)!)[k]!);
    });
  }
  const mmToPx = fitHomography(mm, px);
  const pxToMm = invertHomography(mmToPx);
  const markerErrorMm = px.reduce((s, p, k) => s + Math.hypot(applyHomography(pxToMm, p).x - mm[k]!.x, applyHomography(pxToMm, p).y - mm[k]!.y), 0) / px.length;
  const warnings: string[] = [];
  if (markerErrorMm > 1.5) return { ok: false, error: "A folha de marcadores não está plana ou a foto saiu tremida. Estique a folha e tire de novo.", markers: ids };
  if (markerErrorMm > 0.6) warnings.push("Os marcadores não batem bem entre si: confira se a folha foi impressa em 100% e está bem plana.");

  // Foto endireitada em mm.
  const box = photoBox(image.width, image.height, pxToMm, sheet);
  let step = options.stepMm ?? DEFAULT_STEP;
  const maxCells = options.maxCells ?? DEFAULT_MAX_CELLS;
  const area = (box.maxX - box.minX) * (box.maxY - box.minY);
  if (area / (step * step) > maxCells) step = Math.sqrt(area / maxCells);
  const rect = rectify(gray, mmToPx, box, step);
  const { width: w, height: h } = rect;

  // A folha (e uma margem) não é molde.
  const margin = 4;
  const inSheet = (i: number, j: number) => {
    const x = rect.originX + (i + 0.5) * step;
    const y = rect.originY + (j + 0.5) * step;
    return x > -margin && y > -margin && x < sheet.widthMm + margin && y < sheet.heightMm + margin;
  };
  const values = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) values[j * w + i] = inSheet(i, j) ? Number.NaN : rect.data[j * w + i]!;
  const t = otsu(values);

  const paperBright = paperIsBright(values, rect.data, w, h, t);

  // Contraste fraco: o papel some no fundo.
  let sumHi = 0;
  let nHi = 0;
  let sumLo = 0;
  let nLo = 0;
  for (const v of values) {
    if (Number.isNaN(v)) continue;
    if (v > t) {
      sumHi += v;
      nHi++;
    } else {
      sumLo += v;
      nLo++;
    }
  }
  if (nHi === 0 || nLo === 0 || sumHi / nHi - sumLo / nLo < 40)
    return { ok: false, error: "Pouco contraste entre o papel e o fundo. Use um fundo bem mais escuro (ou mais claro) que o papel.", markers: ids };

  const raw: Mask = { width: w, height: h, data: new Uint8Array(w * h) };
  for (let i = 0; i < raw.data.length; i++) {
    const v = values[i]!;
    raw.data[i] = !Number.isNaN(v) && (paperBright ? v > t : v <= t) ? 1 : 0;
  }
  const mask = cleanMask(raw);
  const { labels, areas } = components(mask);
  // Por região: encosta na borda da foto (ou onde a foto acaba) e encosta na folha.
  const offPhoto = new Uint8Array(areas.length);
  const bySheet = new Uint8Array(areas.length);
  const gone = (a: number, b: number) => a < 0 || b < 0 || a >= w || b >= h || Number.isNaN(rect.data[b * w + a]!);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const l = labels[j * w + i]!;
      if (!l || (offPhoto[l] && bySheet[l])) continue;
      const around: [number, number][] = [
        [i - 1, j],
        [i + 1, j],
        [i, j - 1],
        [i, j + 1],
      ];
      if (around.some(([a, b]) => gone(a, b))) offPhoto[l] = 1;
      if (around.some(([a, b]) => !gone(a, b) && inSheet(a, b))) bySheet[l] = 1;
    }
  // O molde é a maior região inteira dentro da foto: reflexo de janela e
  // sombra clara costumam vir da borda e ser tão claros quanto papel pardo.
  const big = (l: number) => areas[l]! * step * step >= MIN_PIECE_AREA;
  let best = 0;
  let bestOff = 0;
  for (let l = 1; l < areas.length; l++) {
    if (!big(l)) continue;
    if (offPhoto[l]) {
      if (!bestOff || areas[l]! > areas[bestOff]!) bestOff = l;
    } else if (!best || areas[l]! > areas[best]!) best = l;
  }
  if (!best && bestOff) return { ok: false, error: "O molde sai da foto. Afaste o celular para caber o molde inteiro.", markers: ids };
  if (!best) return { ok: false, error: "Nenhum molde de papel apareceu na foto, fora da folha de marcadores.", markers: ids };
  if (bySheet[best]) return { ok: false, error: "O molde está encostado na folha de marcadores. Deixe um espaço entre os dois.", markers: ids };
  // Área grande deixada de fora: pode ser reflexo, ou outro molde cortado pela borda.
  if (bestOff && areas[bestOff]! >= 0.25 * areas[best]!)
    warnings.push("Uma área clara que encosta na borda da foto (reflexo ou sombra clara?) ficou de fora. Confira se o contorno vermelho pegou o molde certo.");

  const solid = fillHoles(labels, best, w, h);
  const boundaryCells = traceOuterBoundary(solid);
  const outlineMm = boundaryCells.map((q) => ({ x: rect.originX + q.x * step, y: rect.originY + q.y * step }));
  const shape = outlineToPiece(outlineMm, options.name);

  // Longe da folha, o erro dos marcadores cresce na mesma proporção.
  const half = Math.hypot(sheet.widthMm, sheet.heightMm) / 2;
  const far = Math.max(...outlineMm.map((q) => Math.hypot(q.x - sheet.widthMm / 2, q.y - sheet.heightMm / 2)));
  if (far / half > 5) warnings.push("O molde está longe da folha de marcadores: aproxime os dois para medir com mais precisão.");

  const minX = Math.min(...outlineMm.map((q) => q.x));
  const minY = Math.min(...outlineMm.map((q) => q.y));
  return {
    ok: true,
    piece: shape.piece,
    piques: shape.piques,
    corners: shape.corners,
    markers: ids,
    markerErrorMm,
    outlineMm,
    offsetMm: { x: minX, y: minY },
    rectified: rect,
    warnings,
  };
}
