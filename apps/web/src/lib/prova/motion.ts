import { MOTIONS, type MotionId } from "@alinhavo/cloth";

/**
 * Movimento na Prova ("preparar e tocar"): o Worker calcula o movimento
 * inteiro mais devagar que o tempo real e a cena toca os quadros em volta.
 * Regras puras da tela; a simulação mora no cloth (`createMotionRun`).
 */

/** Quadros guardados por segundo (a cena toca nesta velocidade). */
export const MOTION_FPS = 30;

/** Os movimentos para o seletor, na ordem do cloth. */
export const MOTION_OPTIONS: readonly { id: MotionId; name: string; hint: string }[] = MOTIONS.map((m) => ({ id: m.id, name: m.name, hint: m.hint }));

export const motionName = (id: MotionId) => MOTION_OPTIONS.find((m) => m.id === id)?.name ?? id;

/** Junta os quadros (todos do mesmo tamanho) num bloco só, para mandar do Worker sem copiar. */
export function packFrames(frames: readonly Float32Array[]): Float32Array {
  const size = frames[0]?.length ?? 0;
  const out = new Float32Array(size * frames.length);
  frames.forEach((f, i) => {
    if (f.length !== size) throw new Error("Os quadros do movimento precisam ter o mesmo tamanho.");
    out.set(f, i * size);
  });
  return out;
}

/** O quadro `index` de um bloco de `count` quadros (vista, sem cópia). */
export function frameOf(packed: Float32Array, count: number, index: number): Float32Array {
  const size = count > 0 ? packed.length / count : 0;
  const i = Math.min(count - 1, Math.max(0, Math.floor(index)));
  return packed.subarray(i * size, (i + 1) * size);
}

/** Quadro a mostrar depois de `elapsedMs` tocando, em volta (o movimento começa e termina em pé). */
export function frameAt(elapsedMs: number, fps: number, count: number): number {
  if (count <= 1 || !(elapsedMs > 0)) return 0;
  return Math.floor((elapsedMs / 1000) * fps) % count;
}

/** Texto do preparo ("Preparando o movimento… 40%"). */
export function motionProgressText(done: number, total: number): string {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return `Preparando o movimento… ${pct}%`;
}
