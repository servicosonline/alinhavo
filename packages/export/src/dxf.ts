import { pieceAtSize, type PatternDocument, type Point } from "@alinhavo/geometry";
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

/** Número com até 3 casas, ponto decimal, sem -0. */
const num = (v: number) => {
  const r = Math.round(v * 1000) / 1000 + 0;
  return Number.isInteger(r) ? `${r}.0` : String(r);
};

class Writer {
  private out: string[] = [];
  pair(code: number, value: string | number) {
    this.out.push(String(code), typeof value === "number" ? num(value) : value);
  }
  toString() {
    return `${this.out.join("\r\n")}\r\n`;
  }
}

const flipY = (p: Point): Point => ({ x: p.x, y: -p.y });

function polyline(w: Writer, layer: string, outline: Outline) {
  w.pair(0, "POLYLINE");
  w.pair(8, layer);
  w.pair(66, "1");
  w.pair(70, "1"); // fechada
  w.pair(10, 0);
  w.pair(20, 0);
  w.pair(30, 0);
  for (const p of outline.points.map(flipY)) {
    w.pair(0, "VERTEX");
    w.pair(8, layer);
    w.pair(10, p.x);
    w.pair(20, p.y);
    w.pair(30, 0);
  }
  w.pair(0, "SEQEND");
  w.pair(8, layer);
}

function points(w: Writer, outline: Outline) {
  outline.points.forEach((raw, i) => {
    const p = flipY(raw);
    w.pair(0, "POINT");
    w.pair(8, outline.turn[i] ? "2" : "3");
    w.pair(10, p.x);
    w.pair(20, p.y);
    w.pair(30, 0);
  });
}

function text(w: Writer, layer: string, at: Point, value: string) {
  w.pair(0, "TEXT");
  w.pair(8, layer);
  w.pair(10, at.x);
  w.pair(20, at.y);
  w.pair(30, 0);
  w.pair(40, TEXT_HEIGHT);
  w.pair(1, ascii(value));
}

function line(w: Writer, layer: string, a: Point, b: Point) {
  w.pair(0, "LINE");
  w.pair(8, layer);
  w.pair(10, a.x);
  w.pair(20, a.y);
  w.pair(30, 0);
  w.pair(11, b.x);
  w.pair(21, b.y);
  w.pair(31, 0);
}

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
  const w = new Writer();

  // HEADER
  w.pair(0, "SECTION");
  w.pair(2, "HEADER");
  w.pair(9, "$ACADVER");
  w.pair(1, "AC1009");
  w.pair(9, "$INSUNITS");
  w.pair(70, "4"); // milímetros
  w.pair(9, "$MEASUREMENT");
  w.pair(70, "1"); // métrico
  w.pair(0, "ENDSEC");

  // TABLES: tipo de linha e camadas
  w.pair(0, "SECTION");
  w.pair(2, "TABLES");
  w.pair(0, "TABLE");
  w.pair(2, "LTYPE");
  w.pair(70, "1");
  w.pair(0, "LTYPE");
  w.pair(2, "CONTINUOUS");
  w.pair(70, "0");
  w.pair(3, "Solid line");
  w.pair(72, "65");
  w.pair(73, "0");
  w.pair(40, 0);
  w.pair(0, "ENDTAB");
  w.pair(0, "TABLE");
  w.pair(2, "LAYER");
  w.pair(70, String(LAYERS.length));
  for (const layer of LAYERS) {
    w.pair(0, "LAYER");
    w.pair(2, layer);
    w.pair(70, "0");
    w.pair(62, "7");
    w.pair(6, "CONTINUOUS");
  }
  w.pair(0, "ENDTAB");
  w.pair(0, "ENDSEC");

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
      [`Piece Name: ${piece.name}`, `Size: ${size}`, "Quantity: 1"].forEach((t, i) =>
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
