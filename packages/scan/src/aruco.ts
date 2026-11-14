/// <reference path="../types/js-aruco2.d.ts" />
import aruco from "js-aruco2";
import type { Point } from "@alinhavo/geometry";

/**
 * Única ponte com o js-aruco2 (MIT): detecção dos marcadores e os bits de
 * cada um (para imprimir a folha). Trocar de detector é trocar este arquivo.
 *
 * Dicionário ARUCO_MIP_36h12: 6×6 bits, borda preta de 1 módulo (o
 * marcador tem 8×8 módulos) e distância de Hamming grande entre códigos
 * (menos falso positivo em foto de mesa com tecido estampado).
 */

export const DICTIONARY = "ARUCO_MIP_36h12";
/**
 * Bits errados aceitos na leitura. O padrão do dicionário aceita até 11 de
 * 36 e lê quadradinhos de dentro de outro marcador como marcadores falsos
 * (que podem ter o id de um marcador da folha e estragar a medida).
 */
export const MAX_HAMMING = 3;
/** Módulos do lado do quadrado preto (6 bits + borda). */
export const MARKER_MODULES = 8;

export type RgbaImage = { width: number; height: number; data: Uint8ClampedArray | Uint8Array };

/** Marcador achado na foto: cantos em pixels, na ordem do marcador (sup. esq., sup. dir., inf. dir., inf. esq.). */
export type DetectedMarker = { id: number; corners: [Point, Point, Point, Point] };

const { AR } = aruco;
let dictionary: InstanceType<typeof AR.Dictionary> | null = null;

export function detectMarkers(image: RgbaImage): DetectedMarker[] {
  const detector = new AR.Detector({ dictionaryName: DICTIONARY, maxHammingDistance: MAX_HAMMING });
  return detector
    .detect(image)
    .filter((m) => m.corners.length === 4)
    .map((m) => ({ id: m.id, corners: m.corners.map((c) => ({ x: c.x, y: c.y })) as DetectedMarker["corners"] }));
}

/** Bits do marcador (6×6, linha a linha; true = módulo branco), para desenhar. */
export function markerBits(id: number): boolean[][] {
  dictionary ??= new AR.Dictionary(DICTIONARY);
  const code = dictionary.codeList[id];
  if (!code) throw new Error(`Marcador ${id} não existe no dicionário.`);
  const n = MARKER_MODULES - 2;
  return Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => code[y * n + x] === "1"));
}
