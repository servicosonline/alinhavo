import type { Point } from "@alinhavo/geometry";
import { MARKER_MODULES } from "./aruco";

/**
 * Folha de marcadores: onde cada marcador está impresso, em mm, com Y para
 * baixo (como no editor). A foto é lida pelos cantos dos marcadores achados;
 * a folha precisa sair da impressora em escala 100% (o quadrado de conferência
 * da folha mede 50 mm).
 */
export type SheetMarker = {
  id: number;
  /** Canto superior esquerdo do quadrado preto, mm. */
  x: number;
  y: number;
  /** Lado do quadrado preto (borda incluída), mm. */
  size: number;
};

export type MarkerSheet = {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  markers: SheetMarker[];
  /** Quadrado de conferência de escala impresso na folha (mm). */
  check: { x: number; y: number; size: number };
};

const MARKER = 40; // mm: 5 mm por módulo
const MARGIN = 12;

/** A4 em pé com 4 marcadores nos cantos (ids 0 a 3). */
export const A4_SHEET: MarkerSheet = {
  id: "a4-4",
  name: "A4 com 4 marcadores",
  widthMm: 210,
  heightMm: 297,
  markers: [
    { id: 0, x: MARGIN, y: MARGIN, size: MARKER },
    { id: 1, x: 210 - MARGIN - MARKER, y: MARGIN, size: MARKER },
    { id: 2, x: 210 - MARGIN - MARKER, y: 297 - MARGIN - MARKER, size: MARKER },
    { id: 3, x: MARGIN, y: 297 - MARGIN - MARKER, size: MARKER },
  ],
  check: { x: 80, y: 123.5, size: 50 },
};

/** Tamanho de um módulo do marcador, mm. */
export const moduleSize = (m: SheetMarker) => m.size / MARKER_MODULES;

/** Cantos do quadrado preto na ordem do detector: sup. esq., sup. dir., inf. dir., inf. esq. */
export function sheetMarkerCorners(m: SheetMarker): [Point, Point, Point, Point] {
  return [
    { x: m.x, y: m.y },
    { x: m.x + m.size, y: m.y },
    { x: m.x + m.size, y: m.y + m.size },
    { x: m.x, y: m.y + m.size },
  ];
}
