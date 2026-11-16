import { clearanceColor, fillColors, hexToLinearRgb, pressureColor } from "./colors";
import { paintWash, type WashId } from "./wash";

export { hexToLinearRgb };
import { lookShade } from "./look";
import type { FabricId, ProvaMaps, ProvaPart } from "./protocol";

/** Cor de cada tecido na vista "Tecido". */
export const FABRIC_COLOR: Record<FabricId, string> = {
  planoLeve: "#d8c3a5",
  malha: "#8a9db3",
  jeans: "#4a6687",
  tricoline: "#e6e1d6",
  viscose: "#b5675a",
  linho: "#cdbf9f",
  crepe: "#3f3f48",
  chiffon: "#e8c9cf",
  sarja: "#8a7a5c",
  jeansElastano: "#3c5470",
  ribana: "#6f8f7a",
  moletom: "#9a9a9e",
};

export type PaintView = "tecido" | "pressao" | "folga";

/**
 * Cores por vértice da roupa (3 floats por vértice) para a vista, ou null
 * para pintar tudo com a cor do tecido do molde em prova (uma roupa só, na
 * vista "Tecido", ou mapa ainda não calculado). Com look, cada roupa tem o tom
 * do seu tecido (`lookShade` pela posição) e a pressão de cada uma é medida
 * contra o limite do tecido dela.
 */
export function garmentPaint(
  view: PaintView,
  maps: ProvaMaps | null,
  parts: readonly ProvaPart[],
  vertexCount: number,
  /** Lavagem do molde em prova (jeans), na vista "Tecido": cor lavada e desbotada onde estica. */
  wash: { id: WashId; fabricHex: string } | null = null,
): Float32Array | null {
  const washing = view === "tecido" && wash !== null && wash.id !== "crua";
  if (view === "folga") return maps ? fillColors(maps.clearance, clearanceColor) : null;
  if (view === "pressao" && maps) {
    const out = new Float32Array(vertexCount * 3);
    if (parts.length === 0) return fillColors(maps.stretch, (s) => pressureColor(s, 0.05), out);
    for (const p of parts) {
      fillColors(
        maps.stretch.subarray(p.start, p.start + p.count),
        (s) => pressureColor(s, p.fabricLimit),
        out.subarray(p.start * 3, (p.start + p.count) * 3),
      );
    }
    return out;
  }
  if (parts.length <= 1) {
    if (!washing) return null;
    return paintWash(new Float32Array(vertexCount * 3), 0, vertexCount, wash.fabricHex, wash.id, maps?.stretch ?? null, parts[0]?.fabricLimit ?? 0.05);
  }
  const out = new Float32Array(vertexCount * 3);
  parts.forEach((p, k) => {
    if (washing && p.main) {
      paintWash(out, p.start, p.count, wash.fabricHex, wash.id, maps?.stretch ?? null, p.fabricLimit);
      return;
    }
    const [r, g, b] = hexToLinearRgb(lookShade(FABRIC_COLOR[p.fabric], k));
    for (let v = p.start; v < p.start + p.count; v++) {
      out[v * 3] = r;
      out[v * 3 + 1] = g;
      out[v * 3 + 2] = b;
    }
  });
  return out;
}
