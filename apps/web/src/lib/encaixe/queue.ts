import type { NestJobStatus } from "../supabase/database.types";

/** Regras da tela da fila de encaixes. */

export const JOB_STATUS_LABEL: Record<NestJobStatus, string> = {
  fila: "Na fila",
  rodando: "Encaixando",
  pronto: "Pronto",
  erro: "Erro",
};

/** De quanto em quanto tempo o processador avisa o progresso (e renova o prazo de 2 min do banco). */
export const PROGRESS_EVERY_MS = 5_000;
/** Espera entre consultas quando a fila está vazia. */
export const IDLE_WAIT_MS = 10_000;
/** A tela da fila se atualiza sozinha neste intervalo (o que os outros estão processando). */
export const REFRESH_EVERY_MS = 10_000;

/** "Encaixando · 40%" / "Na fila" / "Pronto · risco nº 3". */
export function jobStatusText(job: { status: NestJobStatus; progress: number; markerNumber?: number | null }): string {
  const label = JOB_STATUS_LABEL[job.status];
  if (job.status === "rodando") return `${label} · ${Math.round(job.progress * 100)}%`;
  if (job.status === "pronto" && job.markerNumber) return `${label} · risco nº ${job.markerNumber}`;
  return label;
}
