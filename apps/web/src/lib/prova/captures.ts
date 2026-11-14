/**
 * Capturas da Prova (imagens para a aprovação): até 4 imagens, JPEG ou PNG.
 * O banco aceita até 600 KB por imagem, mas aqui o teto é 150 KB: as 4 vão
 * juntas numa Server Action, que o Next limita a 1 MB (4 × 150 KB em base64
 * ≈ 800 KB). Uma captura de 900 × 1200 px sai com uns 30 KB.
 */

export type CaptureAngle = "atual" | "frente" | "costas" | "lado";
export type Capture = { angle: CaptureAngle; /** data:image/jpeg;base64,... */ dataUrl: string };

export const MAX_CAPTURES = 4;
export const MAX_CAPTURE_BYTES = 150_000;

export const ANGLE_LABEL: Record<CaptureAngle, string> = {
  atual: "Ângulo livre",
  frente: "Frente",
  costas: "Costas",
  lado: "Lado",
};

/** Só o base64 de um data URL de imagem JPEG ou PNG; null se não for. */
export function dataUrlBase64(dataUrl: string): string | null {
  const m = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  return m ? m[2]! : null;
}

/** Bytes que o base64 representa (sem decodificar). */
export function base64Bytes(b64: string): number {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return (b64.length / 4) * 3 - pad;
}

/** Acrescenta capturas respeitando o limite; devolve a lista nova e quantas ficaram de fora. */
export function addCaptures(current: readonly Capture[], incoming: readonly Capture[]): { list: Capture[]; dropped: number } {
  const valid = incoming.filter((c) => {
    const b64 = dataUrlBase64(c.dataUrl);
    return b64 !== null && base64Bytes(b64) <= MAX_CAPTURE_BYTES;
  });
  const room = Math.max(0, MAX_CAPTURES - current.length);
  return { list: [...current, ...valid.slice(0, room)], dropped: incoming.length - Math.min(valid.length, room) };
}
