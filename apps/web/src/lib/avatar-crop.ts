/**
 * Recorte quadrado da foto de perfil. A foto fica atrás de uma janela quadrada de `view` px;
 * `zoom` 1 = a foto cobre a janela pelo lado menor; `x`, `y` = deslocamento da foto em px da janela.
 * Puro: a tela (components/account/avatar-cropper.tsx) desenha e o canvas recorta com `sourceRect`.
 */

export const AVATAR_SIZE = 256;
export const AVATAR_MAX_BYTES = 200 * 1024;
export const ZOOM_MAX = 4;

export interface Crop {
  zoom: number;
  x: number;
  y: number;
}

/** Escala da foto na janela (px da janela por px da foto). */
export function scaleFor(imgW: number, imgH: number, view: number, zoom: number): number {
  return (view / Math.min(imgW, imgH)) * zoom;
}

/** Mantém a janela sempre coberta pela foto (sem borda vazia) e o zoom entre 1 e ZOOM_MAX. */
export function clampCrop(c: Crop, imgW: number, imgH: number, view: number): Crop {
  const zoom = Math.min(ZOOM_MAX, Math.max(1, Number.isFinite(c.zoom) ? c.zoom : 1));
  const s = scaleFor(imgW, imgH, view, zoom);
  const maxX = Math.max(0, (imgW * s - view) / 2);
  const maxY = Math.max(0, (imgH * s - view) / 2);
  const clamp = (v: number, m: number) => Math.min(m, Math.max(-m, Number.isFinite(v) ? v : 0));
  return { zoom, x: clamp(c.x, maxX), y: clamp(c.y, maxY) };
}

/** O pedaço da foto original (em px da foto) que aparece na janela. */
export function sourceRect(c: Crop, imgW: number, imgH: number, view: number): { sx: number; sy: number; size: number } {
  const k = clampCrop(c, imgW, imgH, view);
  const s = scaleFor(imgW, imgH, view, k.zoom);
  const size = view / s;
  // Centro da janela, em px da foto: o centro da foto menos o deslocamento.
  const cx = imgW / 2 - k.x / s;
  const cy = imgH / 2 - k.y / s;
  return { sx: cx - size / 2, sy: cy - size / 2, size };
}
