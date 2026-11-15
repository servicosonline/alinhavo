import type { Point } from "@alinhavo/geometry";
import { ascii } from "./outlines";

/**
 * Escrita de DXF R12 ASCII (a base do DXF-AAMA e do risco). Medidas em mm.
 * O eixo Y do DXF cresce para cima; o do Alinhavo (editor e risco) cresce
 * para baixo: quem chama inverte o Y com `flipY` (sem isso sai espelhado).
 */

/** Número com até 3 casas, ponto decimal, sem -0. */
const num = (v: number) => {
  const r = Math.round(v * 1000) / 1000 + 0;
  return Number.isInteger(r) ? `${r}.0` : String(r);
};

export class DxfWriter {
  private out: string[] = [];
  pair(code: number, value: string | number) {
    this.out.push(String(code), typeof value === "number" ? num(value) : value);
  }
  toString() {
    return `${this.out.join("\r\n")}\r\n`;
  }
}

export const flipY = (p: Point): Point => ({ x: p.x, y: -p.y });

/** HEADER (mm, métrico) e TABLES (linha contínua e as camadas). */
export function dxfBegin(w: DxfWriter, layers: readonly string[]) {
  w.pair(0, "SECTION");
  w.pair(2, "HEADER");
  w.pair(9, "$ACADVER");
  w.pair(1, "AC1009");
  w.pair(9, "$INSUNITS");
  w.pair(70, "4"); // milímetros
  w.pair(9, "$MEASUREMENT");
  w.pair(70, "1"); // métrico
  w.pair(0, "ENDSEC");

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
  w.pair(70, String(layers.length));
  for (const layer of layers) {
    w.pair(0, "LAYER");
    w.pair(2, layer);
    w.pair(70, "0");
    w.pair(62, "7");
    w.pair(6, "CONTINUOUS");
  }
  w.pair(0, "ENDTAB");
  w.pair(0, "ENDSEC");
}

/** Polilinha fechada; os pontos já vêm no sistema do DXF (Y para cima). */
export function dxfPolyline(w: DxfWriter, layer: string, points: readonly Point[]) {
  w.pair(0, "POLYLINE");
  w.pair(8, layer);
  w.pair(66, "1");
  w.pair(70, "1"); // fechada
  w.pair(10, 0);
  w.pair(20, 0);
  w.pair(30, 0);
  for (const p of points) {
    w.pair(0, "VERTEX");
    w.pair(8, layer);
    w.pair(10, p.x);
    w.pair(20, p.y);
    w.pair(30, 0);
  }
  w.pair(0, "SEQEND");
  w.pair(8, layer);
}

export function dxfPoint(w: DxfWriter, layer: string, p: Point) {
  w.pair(0, "POINT");
  w.pair(8, layer);
  w.pair(10, p.x);
  w.pair(20, p.y);
  w.pair(30, 0);
}

export function dxfText(w: DxfWriter, layer: string, at: Point, value: string, height: number) {
  w.pair(0, "TEXT");
  w.pair(8, layer);
  w.pair(10, at.x);
  w.pair(20, at.y);
  w.pair(30, 0);
  w.pair(40, height);
  w.pair(1, ascii(value));
}

export function dxfLine(w: DxfWriter, layer: string, a: Point, b: Point) {
  w.pair(0, "LINE");
  w.pair(8, layer);
  w.pair(10, a.x);
  w.pair(20, a.y);
  w.pair(30, 0);
  w.pair(11, b.x);
  w.pair(21, b.y);
  w.pair(31, 0);
}
