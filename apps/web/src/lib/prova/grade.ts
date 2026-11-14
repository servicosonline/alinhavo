import type { MapSummary } from "@alinhavo/cloth";

/**
 * Regras da grade inteira na Prova: todos os tamanhos lado a lado, cada um
 * com o corpo da sua linha da tabela e a sua simulação (um Worker por
 * tamanho). Sem React nem three: a tela e a cena usam daqui.
 */

/** Distância entre os corpos, de centro a centro, em mm (braços abertos não se tocam). */
export const GRADE_SPACING_MM = 750;
/** Tempo simulado (s) em que um tamanho é dado por pronto: costuras fechadas e a roupa assentada. */
export const GRADE_SETTLE_TIME = 6;

export type GradeSlotState = "fila" | "montando" | "simulando" | "pronto" | "erro";

export const GRADE_STATE_NAME: Record<GradeSlotState, string> = {
  fila: "Na fila",
  montando: "Montando",
  simulando: "Simulando",
  pronto: "Pronto",
  erro: "Erro",
};

/**
 * Posição em X (mm) de cada tamanho, centrada em 0. O primeiro da grade fica à
 * esquerda de quem olha de frente (a câmera fica em +Z, então a direita da tela é +X).
 */
export function gradeOffsets(count: number, spacing = GRADE_SPACING_MM): number[] {
  return Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * spacing);
}

/**
 * Quantos tamanhos simulam ao mesmo tempo: um núcleo fica para a tela.
 * Sem a informação do navegador, 2.
 */
export function gradeConcurrency(hardware: number | undefined, count: number): number {
  const cores = hardware && Number.isFinite(hardware) && hardware > 0 ? Math.floor(hardware) : 3;
  return Math.max(1, Math.min(count, cores - 1));
}

/** Índices que devem começar agora: vagas livres preenchidas pela fila, na ordem da grade. */
export function nextToStart(states: readonly GradeSlotState[], concurrency: number): number[] {
  const active = states.filter((s) => s === "montando" || s === "simulando").length;
  const free = Math.max(0, concurrency - active);
  const out: number[] = [];
  for (let i = 0; i < states.length && out.length < free; i++) {
    if (states[i] === "fila") out.push(i);
  }
  return out;
}

/**
 * Distância da câmera (m) para caber a fileira de corpos de frente:
 * largura da fileira mais a margem de um corpo, e a altura de um corpo.
 * `fovDeg` é o campo de visão vertical; `aspect`, largura ÷ altura da tela.
 */
export function gradeCameraDistance(count: number, aspect: number, fovDeg = 32, spacing = GRADE_SPACING_MM): number {
  const halfV = ((fovDeg / 2) * Math.PI) / 180;
  const halfH = Math.atan(Math.tan(halfV) * Math.max(0.1, aspect));
  const halfWidth = (((Math.max(1, count) - 1) * spacing) / 2 + 500) / 1000;
  const byWidth = halfWidth / Math.tan(halfH) + 0.6;
  return Math.max(3.1, byWidth);
}

/** Linha da tabela de comparação. */
export type GradeRow = { size: string; summary: MapSummary | null };

/** O tamanho com a maior pressão alta (o mais justo), entre os que já têm mapa; null sem nenhum. */
export function tightestSize(rows: readonly GradeRow[]): string | null {
  let best: GradeRow | null = null;
  for (const r of rows) {
    if (r.summary && (!best || r.summary.highStretch > best.summary!.highStretch)) best = r;
  }
  return best?.size ?? null;
}
