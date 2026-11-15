/**
 * Qualidade do desenho da Prova. "alta": tecido com trama (relevo e cor dos
 * fios), brilho aveludado e sombra. "leve": cor lisa, sem sombra e menos
 * pixels, para celular e máquina fraca. A simulação é a mesma nas duas.
 */
export type RenderQuality = "alta" | "leve";

export const QUALITIES: { id: RenderQuality; name: string }[] = [
  { id: "alta", name: "Alta (trama e sombra)" },
  { id: "leve", name: "Leve (celular)" },
];

/** O que a escolha padrão olha do aparelho (separado para testar). */
export type DeviceHints = { coarsePointer: boolean; cores: number | undefined };

/** Celular/tablet (toque) ou até 4 núcleos começa em "leve"; o resto em "alta". */
export function defaultQuality(device: DeviceHints): RenderQuality {
  if (device.coarsePointer) return "leve";
  if (device.cores !== undefined && device.cores <= 4) return "leve";
  return "alta";
}

/** Lê o aparelho no navegador (fora dele, "alta"). */
export function deviceHints(): DeviceHints {
  if (typeof window === "undefined") return { coarsePointer: false, cores: undefined };
  return {
    coarsePointer: window.matchMedia?.("(pointer: coarse)").matches ?? false,
    cores: navigator.hardwareConcurrency,
  };
}
