import { describe, expect, it } from "vitest";
import {
  catalogPhotoPrompt,
  CATALOG_INPUT_MAX_BYTES,
  DEFAULT_PHOTO_OPTIONS,
  NOTE_MAX,
  photoSettings,
  readCaptureImage,
  readPhotoOptions,
  safetyIdentifier,
} from "./catalog-photo";

const JPEG = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]).toString("base64")}`;

describe("foto de catálogo: regras", () => {
  it("lê as opções da tela e recusa o que não conhece", () => {
    expect(readPhotoOptions(DEFAULT_PHOTO_OPTIONS)).toEqual(DEFAULT_PHOTO_OPTIONS);
    expect(readPhotoOptions({ ...DEFAULT_PHOTO_OPTIONS, note: "  com   bolsa  " })?.note).toBe("com bolsa");
    for (const bad of [
      null,
      "x",
      { ...DEFAULT_PHOTO_OPTIONS, skin: "verde" },
      { ...DEFAULT_PHOTO_OPTIONS, scene: "lua" },
      { ...DEFAULT_PHOTO_OPTIONS, quality: "max" },
      { ...DEFAULT_PHOTO_OPTIONS, angle: "cima" },
      { ...DEFAULT_PHOTO_OPTIONS, note: 3 },
      { ...DEFAULT_PHOTO_OPTIONS, note: "x".repeat(NOTE_MAX + 1) },
    ]) {
      expect(readPhotoOptions(bad)).toBeNull();
    }
  });

  it("aceita só captura JPEG ou PNG dentro do teto", () => {
    const ok = readCaptureImage(JPEG);
    expect(ok.ok && ok.mime).toBe("image/jpeg");
    expect(ok.ok && [...ok.bytes.slice(0, 2)]).toEqual([0xff, 0xd8]);
    expect(readCaptureImage(`data:image/gif;base64,AAAA`)).toMatchObject({ ok: false });
    expect(readCaptureImage(undefined)).toMatchObject({ ok: false });
    const big = `data:image/jpeg;base64,${"A".repeat(Math.ceil((CATALOG_INPUT_MAX_BYTES + 10) / 3) * 4)}`;
    expect(readCaptureImage(big)).toMatchObject({ ok: false, error: expect.stringMatching(/grande/) });
  });

  it("o prompt manda manter a roupa e leva as escolhas", () => {
    const p = catalogPhotoPrompt(
      { ...DEFAULT_PHOTO_OPTIONS, skin: "escura", body: "plus", scene: "externo", angle: "costas", note: 'com "tênis" branco' },
      {
        name: "Saia midi",
        fabric: "Linho",
      },
    );
    expect(p.split("\n")[0]).toMatch(/catalog photograph/);
    expect(p).toMatch(/Keep the garment exactly as it is/);
    expect(p).toContain('"Saia midi" in Linho');
    expect(p).toMatch(/dark skin tone/);
    expect(p).toMatch(/plus-size/);
    expect(p).toMatch(/outdoor/);
    expect(p).toMatch(/back view/);
    expect(p).toContain("com 'tênis' branco"); // aspas da pessoa não fecham as do prompt
    expect(catalogPhotoPrompt(DEFAULT_PHOTO_OPTIONS, { name: "Calça", fabric: null })).not.toMatch(/Extra direction/);
  });

  it("guarda as opções com o formato e esconde o usuário no identificador", async () => {
    expect(photoSettings(DEFAULT_PHOTO_OPTIONS)).toEqual({ format: 1, ...DEFAULT_PHOTO_OPTIONS });
    const id = await safetyIdentifier("8a0c7c38-2b0e-4d36-9a52-6a1c2f3e4b5d");
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toContain("8a0c7c38");
    expect(await safetyIdentifier("8a0c7c38-2b0e-4d36-9a52-6a1c2f3e4b5d")).toBe(id);
  });
});
