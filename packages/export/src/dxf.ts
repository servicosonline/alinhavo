import { pieceAtSize, type PatternDocument, type Point } from "@alinhavo/geometry";
import { DxfWriter, dxfBegin, dxfLine, dxfPoint, dxfPolyline, dxfText, flipY } from "./dxf-writer";
import { ascii, bounds, pieceOutlines, type Outline } from "./outlines";

/**
 * Exportação DXF-AAMA (ASCII, base DXF R12), o formato que plotters, cortadoras
 * e CADs de moda (Audaces, Lectra, Gerber, Optitex, CLO) importam.
 *
 * Convenção usada (camadas fixas, numeradas):
 *   1  linha de corte (contorno com margem) e textos do molde/peça
 *   2  pontos de quina      3  pontos de curva
 *   7  fio                  14 linha de costura (sem margem)
 * Uma BLOCK por peça e por tamanho ("Frente_M"), inserida na origem.
 * Medidas em mm ("Units: METRIC"). O eixo Y do DXF cresce para cima; o do
 * editor cresce para baixo, então todo Y é invertido aqui (sem isso a peça
 * sairia espelhada).
 *
 * Os rótulos de texto seguem a prática pública do formato; a norma ASTM D6673
 * completa é paga e não foi consultada.
 */

export type DxfOptions = {
  styleName: string;
  /** Tamanhos a exportar (padrão: todos da grade). */
  sizes?: string[];
  author?: string;
  date?: Date;
};

const LAYERS = ["0", "1", "2", "3", "7", "14"] as const;
const TEXT_HEIGHT = 5; // mm

function polyline(w: DxfWriter, layer: string, outline: Outline) {
  dxfPolyline(w, layer, outline.points.map(flipY));
}

function points(w: DxfWriter, outline: Outline) {
  outline.points.forEach((raw, i) => dxfPoint(w, outline.turn[i] ? "2" : "3", flipY(raw)));
}

const text = (w: DxfWriter, layer: string, at: Point, value: string) => dxfText(w, layer, at, value, TEXT_HEIGHT);
const line = dxfLine;

/** Nome de BLOCK: só letras, números, _ e -, único no arquivo. */
function blockNames(doc: PatternDocument, sizes: string[]) {
  const used = new Set<string>();
  const names = new Map<string, string>();
  for (const piece of doc.pieces) {
    for (const size of sizes) {
      const base = ascii(`${piece.name}_${size}`).replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "PECA";
      let name = base;
      for (let k = 2; used.has(name.toUpperCase()); k++) name = `${base}_${k}`;
      used.add(name.toUpperCase());
      names.set(`${piece.id}\u0000${size}`, name);
    }
  }
  return names;
}

export function exportDxfAama(doc: PatternDocument, options: DxfOptions): string {
  const sizes = (options.sizes ?? doc.sizes).filter((s) => doc.sizes.includes(s));
  if (sizes.length === 0) throw new Error("Nenhum tamanho para exportar.");
  const date = options.date ?? new Date();
  const names = blockNames(doc, sizes);
  const w = new DxfWriter();

  dxfBegin(w, LAYERS);

  // BLOCKS: uma por peça e tamanho
  w.pair(0, "SECTION");
  w.pair(2, "BLOCKS");
  for (const piece of doc.pieces) {
    for (const size of sizes) {
      const graded = pieceAtSize(piece, size);
      const { sew, cut, hasAllowance } = pieceOutlines(graded);
      const name = names.get(`${piece.id}\u0000${size}`)!;
      w.pair(0, "BLOCK");
      w.pair(8, "0");
      w.pair(2, name);
      w.pair(70, "0");
      w.pair(10, 0);
      w.pair(20, 0);
      w.pair(30, 0);
      w.pair(3, name);

      polyline(w, "1", cut);
      points(w, cut);
      if (hasAllowance) {
        polyline(w, "14", sew);
        points(w, sew);
      }
      if (graded.grainline) line(w, "7", flipY(graded.grainline.from), flipY(graded.grainline.to));

      // Textos da peça, perto do centro.
      const b = bounds(sew.points.map(flipY));
      const at = { x: b.minX + (b.maxX - b.minX) * 0.15, y: (b.minY + b.maxY) / 2 };
      // Cortar par: duas peças (a segunda espelhada), como no papel.
      [`Piece Name: ${piece.name}`, `Size: ${size}`, `Quantity: ${piece.cutPair ? 2 : 1}`].forEach((t, i) =>
        text(w, "1", { x: at.x, y: at.y - i * TEXT_HEIGHT * 1.6 }, t),
      );

      w.pair(0, "ENDBLK");
      w.pair(8, "0");
    }
  }
  w.pair(0, "ENDSEC");

  // ENTITIES: textos do molde na origem e as peças inseridas
  w.pair(0, "SECTION");
  w.pair(2, "ENTITIES");
  const pad = (n: number) => String(n).padStart(2, "0");
  const style = [
    `Style Name: ${options.styleName}`,
    `Creation Date: ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `Creation Time: ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    `Author: ${options.author ?? "Alinhavo"}`,
    `Sample Size: ${doc.baseSize}`,
    "Grading Rule Table:",
    "Units: METRIC",
  ];
  style.forEach((t, i) => text(w, "1", { x: 0, y: -i * TEXT_HEIGHT * 1.6 }, t));
  for (const name of names.values()) {
    w.pair(0, "INSERT");
    w.pair(8, "0");
    w.pair(2, name);
    w.pair(10, 0);
    w.pair(20, 0);
    w.pair(30, 0);
  }
  w.pair(0, "ENDSEC");
  w.pair(0, "EOF");
  return w.toString();
}
