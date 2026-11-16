import { describe, expect, it } from "vitest";
import { MAX_CAPTURE_BYTES, type Capture } from "./captures";
import { KIT_ANGLES, kitCaptures, kitMessage } from "./kit";

const jpeg = (b64 = "/9j/4AAQ") => `data:image/jpeg;base64,${b64}`;

describe("kit de aprovação", () => {
  it("captura frente, costas e lado, nessa ordem", () => {
    expect(KIT_ANGLES).toEqual(["frente", "costas", "lado"]);
  });

  it("substitui as capturas (montar de novo não acumula) e conta as que passam do limite", () => {
    const shots: Capture[] = KIT_ANGLES.map((angle) => ({ angle, dataUrl: jpeg() }));
    expect(kitCaptures(shots)).toEqual({ list: shots, dropped: 0 });

    const grande = Buffer.alloc(MAX_CAPTURE_BYTES + 3).toString("base64");
    const r = kitCaptures([shots[0]!, { angle: "costas", dataUrl: jpeg(grande) }, shots[2]!]);
    expect(r.list.map((c) => c.angle)).toEqual(["frente", "lado"]);
    expect(r.dropped).toBe(1);
  });

  it("diz o que entrou no kit", () => {
    expect(kitMessage({ captured: 3, dropped: 0, video: "ok" })).toEqual({
      ok: true,
      text: "Kit pronto: 3 imagens e o vídeo 360°. Escolha a validade e gere o link.",
    });
    expect(kitMessage({ captured: 2, dropped: 1, video: "sem-suporte" }).text).toBe(
      "Kit pronto: 2 imagens (uma ficou de fora pelo tamanho); este navegador não grava vídeo, então o link vai só com as imagens. Escolha a validade e gere o link.",
    );
    expect(kitMessage({ captured: 1, dropped: 0, video: "erro" }).text).toMatch(/^Kit pronto: 1 imagem; o vídeo não gravou/);
  });

  it("sem nenhuma imagem, o kit não serve para pedir aprovação", () => {
    expect(kitMessage({ captured: 0, dropped: 3, video: "ok" }).ok).toBe(false);
  });
});
