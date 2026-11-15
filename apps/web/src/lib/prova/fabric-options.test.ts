import { FABRIC_PRESETS } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import { DEFAULT_PHOTO_CM, fabricOptionsFrom, isFabricPhoto, optionChoice, presetChoice, resolveFabric, tuningFrom } from "./fabric-options";

const FOTO = "data:image/jpeg;base64,/9j/4AAQ";
const row = (over: Partial<Parameters<typeof fabricOptionsFrom>[0][number]> = {}) => ({
  id: "f1",
  name: "Viscose floral",
  preset: "viscose",
  weight_gsm: "130.0",
  stretch_pct: 6,
  drape: 5,
  thickness_mm: "0.4",
  texture: FOTO,
  texture_cm: "20.0",
  ...over,
});

describe("tecidos da Prova", () => {
  it("lê o cadastro: preset, ajuste (números vindos como texto) e foto", () => {
    const [o] = fabricOptionsFrom([row()]);
    expect(o).toEqual({
      id: "f1",
      name: "Viscose floral",
      preset: "viscose",
      tuning: { weightGsm: 130, stretchPct: 6, drape: 5, thicknessMm: 0.4 },
      photo: { dataUrl: FOTO, cm: 20 },
      hasPhoto: true,
    });
  });

  it("lista sem as fotos: quem tem largura de foto tem foto, que a tela busca ao escolher", () => {
    const { texture: _drop, ...semFoto } = row();
    void _drop;
    const [o] = fabricOptionsFrom([semFoto, { ...semFoto, id: "f2", texture_cm: null }]);
    expect(o).toMatchObject({ photo: null, hasPhoto: true });
    expect(resolveFabric(optionChoice("f1"), [o!])).toMatchObject({ optionId: "f1", photoPending: true });
    expect(fabricOptionsFrom([{ ...semFoto, id: "f2", texture_cm: null }])[0]!.hasPhoto).toBe(false);
  });

  it("sem preset vira plano leve; foto sem largura usa a padrão; foto que não é imagem fica de fora", () => {
    const [a] = fabricOptionsFrom([row({ preset: null, texture_cm: null })]);
    expect(a!.preset).toBe("planoLeve");
    expect(a!.photo!.cm).toBe(DEFAULT_PHOTO_CM);
    const [b] = fabricOptionsFrom([row({ preset: "lycra", texture: "https://x/y.jpg" })]);
    expect(b!.preset).toBe("planoLeve");
    expect(b!.photo).toBeNull();
    expect(isFabricPhoto("data:image/gif;base64,AAA")).toBe(false);
    expect(isFabricPhoto("data:image/png;base64," + "A".repeat(300_000))).toBe(false);
  });

  it("ajuste fora do plausível fica de fora (o preset vale)", () => {
    expect(tuningFrom({ weight_gsm: 5000, stretch_pct: 0, drape: 9, thickness_mm: null })).toEqual({});
  });

  it("o seletor resolve preset e tecido cadastrado; o que sumiu volta ao padrão", () => {
    const options = fabricOptionsFrom([row()]);
    expect(resolveFabric(presetChoice("jeans"), options)).toMatchObject({ preset: "jeans", tuning: undefined, photo: null, name: "Jeans" });
    expect(resolveFabric(optionChoice("f1"), options)).toMatchObject({ preset: "viscose", name: "Viscose floral", photo: { cm: 20 } });
    expect(resolveFabric(optionChoice("apagado"), options).preset).toBe("planoLeve");
    expect(resolveFabric("p:lycra", options).preset).toBe("planoLeve");
    for (const p of FABRIC_PRESETS) expect(resolveFabric(presetChoice(p), []).preset).toBe(p);
  });
});
