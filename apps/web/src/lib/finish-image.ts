import { FINISH_IMAGE_MAX } from "@alinhavo/geometry";

/** Maior lado da imagem da estampa guardada no molde, em px. */
export const FINISH_IMAGE_SIDE = 512;

/** Tamanho em px que cabe em `max` no maior lado, mantendo a proporção (nunca aumenta). */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height, 1));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Tentativas de formato, em ordem: PNG (guarda a transparência), WebP e JPEG
 * cada vez mais comprimidos. A primeira que couber no limite fica.
 */
export const ENCODINGS: readonly { type: "image/png" | "image/webp" | "image/jpeg"; quality?: number }[] = [
  { type: "image/png" },
  { type: "image/webp", quality: 0.9 },
  { type: "image/webp", quality: 0.75 },
  { type: "image/jpeg", quality: 0.8 },
  { type: "image/jpeg", quality: 0.6 },
];

/**
 * Lê a imagem escolhida e devolve um data URL que cabe no molde (até
 * FINISH_IMAGE_SIDE px e FINISH_IMAGE_MAX caracteres), ou a mensagem do que
 * deu errado. Só no navegador.
 */
export async function prepareFinishImage(file: File): Promise<{ image: string; width: number; height: number } | { error: string }> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return { error: "Escolha uma imagem PNG, JPEG ou WebP." };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { error: "Não foi possível abrir essa imagem." };
  }
  try {
    for (let side = FINISH_IMAGE_SIDE; side >= 128; side = Math.round(side * 0.75)) {
      const size = fitWithin(bitmap.width, bitmap.height, side);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, size.width, size.height);
      for (const enc of ENCODINGS) {
        const url = canvas.toDataURL(enc.type, enc.quality);
        // O navegador sem o formato devolve PNG: não conta como a tentativa pedida.
        if (!url.startsWith(`data:${enc.type};`)) continue;
        if (url.length <= FINISH_IMAGE_MAX) return { image: url, width: bitmap.width, height: bitmap.height };
      }
    }
    return { error: "A imagem não coube no limite da estampa (cerca de 150 KB), mesmo reduzida." };
  } finally {
    bitmap.close();
  }
}
