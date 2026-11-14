import type { Point } from "@alinhavo/geometry";
import { sample, type GrayImage } from "./image";

/**
 * Cantos do marcador com precisão abaixo do pixel: o detector devolve cantos
 * em pixel inteiro (até ~1 px fora da borda real, erro que vira mm na
 * medida). Aqui cada lado do quadrado preto é achado na imagem em cinza —
 * em vários pontos, onde o cinza cruza a média entre o preto de dentro e o
 * branco de fora — e ajustado por uma reta; os cantos são os cruzamentos
 * das retas vizinhas. Sem sinal claro, o canto original fica.
 */

type Line = { p: Point; d: Point }; // ponto e direção unitária

function fitLine(points: Point[]): Line | null {
  if (points.length < 4) return null;
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of points) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  // Direção principal (autovetor de maior autovalor).
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return { p: { x: cx, y: cy }, d: { x: Math.cos(angle), y: Math.sin(angle) } };
}

function intersect(a: Line, b: Line): Point | null {
  const det = a.d.x * b.d.y - a.d.y * b.d.x;
  if (Math.abs(det) < 1e-9) return null;
  const t = ((b.p.x - a.p.x) * b.d.y - (b.p.y - a.p.y) * b.d.x) / det;
  return { x: a.p.x + t * a.d.x, y: a.p.y + t * a.d.y };
}

/** Pontos do lado a→b onde o cinza cruza o meio entre dentro (preto) e fora (branco). */
function edgePoints(img: GrayImage, a: Point, b: Point, center: Point): Point[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const t = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
  let n = { x: -t.y, y: t.x };
  // Normal apontando para fora do marcador.
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  if ((mid.x - center.x) * n.x + (mid.y - center.y) * n.y < 0) n = { x: -n.x, y: -n.y };
  const reach = Math.max(2, Math.min(6, len * 0.08));
  const out: Point[] = [];
  const samples = Math.max(6, Math.round(len / 3));
  for (let k = 1; k < samples; k++) {
    const s = 0.15 + 0.7 * (k / samples); // longe dos cantos
    const base = { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s };
    const profile: number[] = [];
    const step = 0.25;
    for (let r = -reach; r <= reach + 1e-9; r += step) profile.push(sample(img, base.x + n.x * r, base.y + n.y * r));
    if (profile.some((v) => Number.isNaN(v))) continue;
    const inside = Math.min(...profile.slice(0, 4));
    const outside = Math.max(...profile.slice(-4));
    if (outside - inside < 40) continue;
    const level = (inside + outside) / 2;
    for (let i = 0; i + 1 < profile.length; i++) {
      const v0 = profile[i]!;
      const v1 = profile[i + 1]!;
      if (v0 < level && v1 >= level) {
        const r = -reach + step * (i + (level - v0) / (v1 - v0));
        out.push({ x: base.x + n.x * r, y: base.y + n.y * r });
        break;
      }
    }
  }
  return out;
}

export function refineCorners(img: GrayImage, corners: readonly [Point, Point, Point, Point]): [Point, Point, Point, Point] {
  const center = {
    x: corners.reduce((s, p) => s + p.x, 0) / 4,
    y: corners.reduce((s, p) => s + p.y, 0) / 4,
  };
  const lines = corners.map((a, i) => fitLine(edgePoints(img, a, corners[(i + 1) % 4]!, center)));
  return corners.map((c, i) => {
    const prev = lines[(i + 3) % 4];
    const next = lines[i];
    if (!prev || !next) return c;
    const p = intersect(prev, next);
    // Refinamento que anda demais é sinal de erro: fica o original.
    return p && Math.hypot(p.x - c.x, p.y - c.y) < 4 ? p : c;
  }) as [Point, Point, Point, Point];
}
