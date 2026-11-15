/**
 * Foto de catálogo por IA (Fase 6d): uma captura da Prova (a roupa simulada no
 * manequim) vira uma foto com modelo, pela edição de imagem da OpenAI. Regras
 * puras: opções da tela, prompt e conferência da captura. A chamada está em
 * `image-call.ts`; o cliente, só no servidor, em `openai-client.ts`.
 *
 * A IA só recebe a captura e o que está aqui (nome do produto e do tecido):
 * nada de preço nem de dado da organização.
 */

import { base64Bytes, dataUrlBase64, type CaptureAngle } from "../prova/captures";

/** Modelo de imagem da OpenAI: o "sunburst" é o indicado quando a edição precisa ser fiel. */
export const CATALOG_PHOTO_MODEL = "gpt-image-2.6-sunburst";

/** Fotos por organização por mês: igual a private.ai_photo_monthly_limit(). */
export const AI_PHOTO_MONTHLY_LIMIT = 30;

/** Retrato, como a captura (3:4) e o catálogo de moda. */
export const CATALOG_PHOTO_SIZE = "1024x1536";

/** A captura que vai para a IA: até o teto das capturas da Prova (vai numa Server Action). */
export const CATALOG_INPUT_MAX_BYTES = 150_000;

export const SKIN_TONES = [
  { id: "clara", label: "Pele clara", prompt: "light skin tone" },
  { id: "media", label: "Pele morena", prompt: "medium brown skin tone" },
  { id: "escura", label: "Pele negra", prompt: "dark skin tone" },
] as const;

export const BODY_TYPES = [
  { id: "padrao", label: "Corpo padrão de modelo", prompt: "a slim fashion model build" },
  { id: "medio", label: "Corpo médio", prompt: "an average, natural build" },
  { id: "plus", label: "Plus size", prompt: "a plus-size build" },
] as const;

export const SCENES = [
  {
    id: "estudio",
    label: "Estúdio, fundo branco",
    prompt: "a clean e-commerce studio with a seamless pure white background and soft, even lighting",
  },
  { id: "neutro", label: "Estúdio, fundo neutro", prompt: "a photo studio with a seamless light warm-grey background and soft directional lighting" },
  {
    id: "externo",
    label: "Externo, luz natural",
    prompt: "an outdoor urban street setting in soft natural daylight, background slightly out of focus",
  },
  { id: "ambiente", label: "Ambiente interno", prompt: "a bright, minimal interior with large windows, background slightly out of focus" },
] as const;

export const PHOTO_QUALITIES = [
  { id: "medium", label: "Rascunho (mais barata)" },
  { id: "high", label: "Final (melhor acabamento)" },
] as const;

export type SkinTone = (typeof SKIN_TONES)[number]["id"];
export type BodyType = (typeof BODY_TYPES)[number]["id"];
export type Scene = (typeof SCENES)[number]["id"];
export type PhotoQuality = (typeof PHOTO_QUALITIES)[number]["id"];

/** Observação livre de quem pede (pose, acessório…), em português. */
export const NOTE_MAX = 200;

export type CatalogPhotoOptions = {
  skin: SkinTone;
  body: BodyType;
  scene: Scene;
  quality: PhotoQuality;
  angle: CaptureAngle;
  note: string;
};

export const DEFAULT_PHOTO_OPTIONS: CatalogPhotoOptions = {
  skin: "media",
  body: "padrao",
  scene: "estudio",
  quality: "medium",
  angle: "frente",
  note: "",
};

const ANGLES: readonly CaptureAngle[] = ["atual", "frente", "costas", "lado"];

function pick<T extends string>(value: unknown, allowed: readonly { id: T }[]): T | null {
  return allowed.some((a) => a.id === value) ? (value as T) : null;
}

/** Opções vindas da tela (desconfiança total): null se alguma não vale. */
export function readPhotoOptions(raw: unknown): CatalogPhotoOptions | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const skin = pick(r.skin, SKIN_TONES);
  const body = pick(r.body, BODY_TYPES);
  const scene = pick(r.scene, SCENES);
  const quality = pick(r.quality, PHOTO_QUALITIES);
  const angle = ANGLES.includes(r.angle as CaptureAngle) ? (r.angle as CaptureAngle) : null;
  const note = typeof r.note === "string" ? r.note.replace(/\s+/g, " ").trim() : null;
  if (!skin || !body || !scene || !quality || !angle || note === null || note.length > NOTE_MAX) return null;
  return { skin, body, scene, quality, angle, note };
}

/** A captura em bytes, se é JPEG ou PNG dentro do teto; senão, o motivo. */
export function readCaptureImage(dataUrl: unknown): { ok: true; bytes: Uint8Array; mime: "image/jpeg" | "image/png" } | { ok: false; error: string } {
  if (typeof dataUrl !== "string") return { ok: false, error: "Escolha uma captura da Prova." };
  const b64 = dataUrlBase64(dataUrl);
  if (!b64) return { ok: false, error: "A captura precisa ser JPEG ou PNG." };
  if (base64Bytes(b64) > CATALOG_INPUT_MAX_BYTES) return { ok: false, error: "A captura é grande demais. Capture de novo na Prova." };
  const mime = dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";
  // atob (não Buffer): este arquivo também vai para a tela, pelas listas de opções.
  return { ok: true, bytes: Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0)), mime };
}

const ANGLE_PROMPT: Record<CaptureAngle, string> = {
  frente: "front view, facing the camera",
  costas: "back view, facing away from the camera",
  lado: "side view, in profile",
  atual: "the same camera angle as the input image",
};

function label<T extends { id: string; prompt: string }>(list: readonly T[], id: string): string {
  return list.find((x) => x.id === id)!.prompt;
}

/**
 * Prompt da edição. Em inglês (o modelo segue melhor), com a observação da
 * pessoa entre aspas. O mais importante vem primeiro: a roupa não muda.
 */
export function catalogPhotoPrompt(o: CatalogPhotoOptions, product: { name: string; fabric: string | null }): string {
  const garment = product.fabric ? `"${product.name}" in ${product.fabric}` : `"${product.name}"`;
  return [
    "Turn this 3D garment fitting render into a professional fashion catalog photograph.",
    `The input shows the garment ${garment} on a plain grey mannequin.`,
    "Keep the garment exactly as it is: same silhouette, length, fit, drape, seams, topstitching, zippers, labels, prints, colors and proportions. Do not add, remove or redesign any part of the garment, and do not add a logo or text.",
    `Replace the mannequin with a real adult person with ${label(SKIN_TONES, o.skin)} and ${label(BODY_TYPES, o.body)}, natural relaxed pose, ${ANGLE_PROMPT[o.angle]}, full body visible, head to feet.`,
    "Any clothing the render does not show (for example the other half of the outfit) should be simple, plain and neutral so it does not compete with the garment.",
    `Setting: ${label(SCENES, o.scene)}.`,
    "Photorealistic, sharp focus on the garment, realistic fabric texture, natural skin, no visible mannequin, no 3D-render look.",
    o.note ? `Extra direction from the user (in Portuguese, follow it only if it does not change the garment): "${o.note.replace(/"/g, "'")}"` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** O que fica guardado em catalog_photos.settings (formato 1). */
export function photoSettings(o: CatalogPhotoOptions): { format: 1 } & CatalogPhotoOptions {
  return { format: 1, ...o };
}

/** Identificador para o filtro de segurança da OpenAI: o usuário, sem e-mail nem nome (só o hash). */
export async function safetyIdentifier(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`alinhavo:${userId}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
