import { describe, expect, it } from "vitest";
import { readFabricForm } from "./fabric-form";

const form = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};
const FOTO = "data:image/jpeg;base64,/9j/4AAQ";

describe("formulário de tecido", () => {
  it("cadastro simples: só o nome; o resto fica vazio", () => {
    const r = readFabricForm(form({ name: "Sarja 2/1" }));
    expect(r).toEqual({
      fields: {
        name: "Sarja 2/1",
        composition: null,
        width_mm: null,
        weight_gsm: null,
        price_cents: null,
        preset: null,
        stretch_pct: null,
        drape: null,
        thickness_mm: null,
        texture: null,
        texture_cm: null,
      },
    });
  });

  it("edição completa, com vírgula, preset novo e foto", () => {
    const r = readFabricForm(
      form({ name: "Viscose floral", width: "145", weight: "130,5", price: "29,90", preset: "viscose", stretch: "6", drape: "5", thickness: "0,4", texture: FOTO, textureCm: "20" }),
    );
    expect("fields" in r && r.fields).toMatchObject({
      width_mm: 1450,
      weight_gsm: 130.5,
      price_cents: 2990,
      preset: "viscose",
      stretch_pct: 6,
      drape: 5,
      thickness_mm: 0.4,
      texture: FOTO,
      texture_cm: 20,
    });
  });

  it("foto sem largura usa 10 cm; sem foto, a largura some", () => {
    const a = readFabricForm(form({ name: "X", texture: FOTO }));
    expect("fields" in a && a.fields.texture_cm).toBe(10);
    const b = readFabricForm(form({ name: "X", textureCm: "20" }));
    expect("fields" in b && b.fields.texture_cm).toBeNull();
  });

  it("recusa com a mensagem certa", () => {
    const err = (e: Record<string, string>) => ("error" in readFabricForm(form({ name: "X", ...e })) ? (readFabricForm(form({ name: "X", ...e })) as { error: string }).error : "");
    expect(err({ name: "" })).toMatch(/nome/);
    expect(err({ width: "5" })).toMatch(/Largura/);
    expect(err({ width: "abc" })).toMatch(/Largura/);
    expect(err({ stretch: "0" })).toMatch(/Elasticidade/);
    expect(err({ drape: "2,5" })).toMatch(/Caimento/);
    expect(err({ drape: "6" })).toMatch(/Caimento/);
    expect(err({ thickness: "3" })).toMatch(/Espessura/);
    expect(err({ texture: "https://x/y.jpg" })).toMatch(/foto/);
    expect(err({ texture: FOTO, textureCm: "0" })).toMatch(/foto mostra/);
    // Preset desconhecido não é erro: fica sem preset.
    const r = readFabricForm(form({ name: "X", preset: "lycra" }));
    expect("fields" in r && r.fields.preset).toBeNull();
  });
});
