/**
 * Kit de aprovação em um clique: frente, costas e lado capturados e o vídeo 360°
 * gravado de uma vez, prontos para o "Pedir aprovação". Só monta: o link continua
 * saindo pelo botão "Gerar link", com a pessoa escolhendo a validade.
 */
import { addCaptures, type Capture, type CaptureAngle } from "./captures";

/** Os ângulos do kit, na ordem em que o cliente vê. */
export const KIT_ANGLES = ["frente", "costas", "lado"] as const satisfies readonly CaptureAngle[];

/**
 * As capturas do kit **substituem** as que havia: o kit é sempre o mesmo conjunto
 * (montar de novo não acumula frentes repetidas).
 */
export function kitCaptures(shots: readonly Capture[]): { list: Capture[]; dropped: number } {
  return addCaptures([], shots);
}

/** Como terminou o vídeo do kit. */
export type KitVideo = "ok" | "sem-suporte" | "erro";

export type KitResult = { captured: number; dropped: number; video: KitVideo };

/** O aviso depois de montar o kit. `ok` = dá para gerar o link. */
export function kitMessage(r: KitResult): { ok: boolean; text: string } {
  if (r.captured === 0) return { ok: false, text: "Nenhuma imagem saiu dentro do limite. Tente de novo ou capture um ângulo de cada vez." };
  const images = r.captured === 1 ? "1 imagem" : `${r.captured} imagens`;
  const lost = r.dropped > 0 ? ` (${r.dropped === 1 ? "uma ficou" : `${r.dropped} ficaram`} de fora pelo tamanho)` : "";
  const video =
    r.video === "ok"
      ? " e o vídeo 360°"
      : r.video === "sem-suporte"
        ? "; este navegador não grava vídeo, então o link vai só com as imagens"
        : "; o vídeo não gravou, então o link vai só com as imagens (dá para gravar de novo no Vídeo 360°)";
  return { ok: true, text: `Kit pronto: ${images}${lost}${video}. Escolha a validade e gere o link.` };
}
