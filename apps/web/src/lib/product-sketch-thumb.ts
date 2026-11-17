// Só o servidor usa (a rota da miniatura): o desenho técnico traz o clipper2-ts, que não deve ir ao navegador.
import { sketchPath, type FlatSketch } from "@alinhavo/export/flat-sketch";

/** A vista de frente do desenho técnico (ou a primeira) num quadrado, contorno em tinta sobre papel. */
export function sketchThumbnailSvg(sketch: FlatSketch): string | null {
  const view = sketch.views.find((v) => v.side === "frente") ?? sketch.views[0];
  if (!view || view.outline.length === 0) return null;
  const { minX, minY, maxX, maxY } = view.bounds;
  const side = Math.max(maxX - minX, maxY - minY) * 1.16;
  const x = (minX + maxX) / 2 - side / 2;
  const y = (minY + maxY) / 2 - side / 2;
  const n = (v: number) => Number(v.toFixed(1));
  const paths = [
    ...view.pieces.map((p) => `<path d="${sketchPath(p, true)}" fill="none" stroke="#5c564c" stroke-width="0.6" vector-effect="non-scaling-stroke"/>`),
    ...view.outline.map((p) => `<path d="${sketchPath(p, true)}" fill="#f5efe3" stroke="#1d1b18" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`),
  ];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(x)} ${n(y)} ${n(side)} ${n(side)}" width="320" height="320">` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(side)}" height="${n(side)}" fill="#e8decb"/>` +
    paths.join("") +
    `</svg>`
  );
}
