import type { Point } from "@alinhavo/geometry";
import type { Mask } from "./segment";

/**
 * Contorno de fora de uma máscara (uma região de 4 vizinhos, sem buracos),
 * seguindo as bordas entre pixels: os vértices ficam nos cantos dos pixels
 * (coordenadas da grade, 0..largura e 0..altura), com o papel sempre à
 * direita de quem anda (Y para baixo). Devolve só os vértices onde o
 * contorno vira.
 */
export function traceOuterBoundary(m: Mask): Point[] {
  const { width: w, height: h, data } = m;
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && data[y * w + x] === 1;
  let start = -1;
  for (let i = 0; i < data.length; i++)
    if (data[i]) {
      start = i;
      break;
    }
  if (start < 0) return [];

  // Direções: 0 direita, 1 baixo, 2 esquerda, 3 cima (virar à direita = +1).
  const DX = [1, 0, -1, 0];
  const DY = [0, 1, 0, -1];
  // Pixels à frente (esquerda e direita de quem anda) a partir do vértice (vx, vy).
  const ahead = (vx: number, vy: number, d: number): [boolean, boolean] => {
    switch (d) {
      case 0:
        return [at(vx, vy - 1), at(vx, vy)];
      case 1:
        return [at(vx, vy), at(vx - 1, vy)];
      case 2:
        return [at(vx - 1, vy), at(vx - 1, vy - 1)];
      default:
        return [at(vx - 1, vy - 1), at(vx, vy - 1)];
    }
  };

  const sx = start % w;
  const sy = (start - sx) / w;
  let vx = sx;
  let vy = sy;
  let d = 0;
  const out: Point[] = [{ x: vx, y: vy }];
  const limit = 4 * (w + 1) * (h + 1);
  for (let steps = 0; steps < limit; steps++) {
    vx += DX[d]!;
    vy += DY[d]!;
    if (vx === sx && vy === sy) break;
    const [left, right] = ahead(vx, vy, d);
    let nd = d;
    if (!right) nd = (d + 1) % 4;
    else if (left) nd = (d + 3) % 4;
    if (nd !== d) {
      out.push({ x: vx, y: vy });
      d = nd;
    }
  }
  return out;
}
