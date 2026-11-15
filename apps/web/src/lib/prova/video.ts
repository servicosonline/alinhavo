/**
 * Vídeo 360° da Prova: a câmera dá uma volta inteira em torno do corpo e o
 * navegador grava a tela (MediaRecorder). Regras puras; a gravação fica na
 * cena (`ProvaScene.recordTurntable`).
 */

/** Duração da volta, em s. */
export const VIDEO_SECONDS = 8;
/** Quadros por segundo da gravação. */
export const VIDEO_FPS = 30;
/** Tamanho do vídeo em px (retrato, como as capturas). */
export const VIDEO_WIDTH = 720;
export const VIDEO_HEIGHT = 960;
/** Taxa do vídeo, em bits por segundo (8 s ficam em uns 2,5 MB). */
export const VIDEO_BITRATE = 2_500_000;

/** Formatos na ordem de preferência: MP4 abre em qualquer lugar; WebM é o que todo navegador com gravação tem. */
export const VIDEO_TYPES = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"] as const;

/** O primeiro formato que o navegador grava, ou null se não grava nenhum. */
export function pickVideoType(isSupported: (type: string) => boolean): string | null {
  for (const t of VIDEO_TYPES) {
    try {
      if (isSupported(t)) return t;
    } catch {
      // navegador que lança em vez de responder: tenta o próximo
    }
  }
  return null;
}

/** Extensão do arquivo pelo tipo gravado. */
export function videoExtension(type: string): "mp4" | "webm" {
  return type.startsWith("video/mp4") ? "mp4" : "webm";
}

/**
 * Ângulo da câmera (rad) no instante t (s) de uma volta de `seconds` s:
 * começa de frente (0) e anda no sentido anti-horário visto de cima; fica em
 * 2π ao terminar.
 */
export function turntableAngle(t: number, seconds = VIDEO_SECONDS): number {
  if (!(seconds > 0)) return 0;
  return 2 * Math.PI * Math.max(0, Math.min(1, t / seconds));
}

/**
 * Posição da câmera (m) no ângulo dado: a `distance` m do eixo do corpo, na
 * altura `height`, com a frente do corpo em +Z (ângulo 0 = de frente).
 */
export function turntablePosition(angle: number, distance: number, height: number): { x: number; y: number; z: number } {
  return { x: distance * Math.sin(angle), y: height, z: distance * Math.cos(angle) };
}

/** Nome do arquivo: "alinhavo-360-<molde>-<tamanho>.<ext>", sem acento nem espaço. */
export function videoFileName(name: string, size: string, type: string): string {
  const slug = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{M}/gu, "") // tira os acentos (as marcas que o NFD separa)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  const parts = ["alinhavo-360", slug(name), slug(size)].filter(Boolean);
  return `${parts.join("-")}.${videoExtension(type)}`;
}
