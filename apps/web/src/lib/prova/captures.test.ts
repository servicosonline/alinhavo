import { describe, expect, it } from "vitest";
import { addCaptures, base64Bytes, dataUrlBase64, MAX_CAPTURE_BYTES, type Capture } from "./captures";

const jpeg = (b64 = "/9j/4AAQ") => `data:image/jpeg;base64,${b64}`;

describe("capturas da Prova", () => {
  it("lê o base64 só de JPEG e PNG", () => {
    expect(dataUrlBase64(jpeg())).toBe("/9j/4AAQ");
    expect(dataUrlBase64("data:image/png;base64,iVBORw0KGgo=")).toBe("iVBORw0KGgo=");
    expect(dataUrlBase64("data:image/svg+xml;base64,PHN2Zz4=")).toBeNull();
    expect(dataUrlBase64("data:image/jpeg;base64,não é base64")).toBeNull();
  });

  it("conta os bytes do base64 sem decodificar", () => {
    expect(base64Bytes(Buffer.from("abc").toString("base64"))).toBe(3);
    expect(base64Bytes(Buffer.from("abcd").toString("base64"))).toBe(4);
    expect(base64Bytes(Buffer.from("abcde").toString("base64"))).toBe(5);
  });

  it("guarda até 4, recusa imagem grande ou fora do formato e diz quantas ficaram de fora", () => {
    const tres: Capture[] = ["frente", "costas", "lado"].map((a) => ({ angle: a as Capture["angle"], dataUrl: jpeg() }));
    const grande = Buffer.alloc(MAX_CAPTURE_BYTES + 3).toString("base64");
    const r = addCaptures(tres, [
      { angle: "atual", dataUrl: jpeg(grande) },
      { angle: "atual", dataUrl: jpeg() },
      { angle: "atual", dataUrl: jpeg() },
    ]);
    expect(r.list).toHaveLength(4);
    expect(r.dropped).toBe(2);
    expect(addCaptures([], [{ angle: "atual", dataUrl: "data:text/html;base64,PGI+" }])).toEqual({ list: [], dropped: 1 });
  });
});
