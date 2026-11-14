import { describe, expect, it } from "vitest";
import { addFinish, validatePattern } from "@alinhavo/geometry";
import { samplePattern } from "./sample-pattern";
import { defaultLabel, defaultPrint, defaultSeamFinish, firstEdge } from "./finish-defaults";

const PNG = "data:image/png;base64,iVBORw0KGgo=";

describe("valores iniciais dos acabamentos", () => {
  const doc = samplePattern();
  const frente = doc.pieces[0]!; // dobra no segmento 3

  it("o primeiro segmento que não é dobra", () => {
    expect(firstEdge(frente)).toBe(0);
    expect(firstEdge({ ...frente, fold: 0 })).toBe(1);
  });

  it("cada acabamento inicial é válido na saia de exemplo", () => {
    let next = doc;
    for (const f of [
      defaultSeamFinish(frente, "pesponto")!,
      defaultSeamFinish(frente, "ziper")!,
      defaultLabel(frente),
      defaultPrint(frente, PNG, 400, 200),
    ]) {
      const r = addFinish(next, frente.id, f);
      expect(r.finishId).not.toBeNull();
      next = r.doc;
    }
    expect(validatePattern(next)).toEqual([]);
  });

  it("zíper de 18 cm (ou o segmento todo) e estampa na proporção da imagem", () => {
    const z = defaultSeamFinish(frente, "ziper")!;
    if (z.kind !== "ziper") throw new Error();
    expect(z.to).toBe(1); // a cintura da meia frente tem 18 cm: o zíper ocupa o segmento todo
    const p = defaultPrint(frente, PNG, 400, 200);
    if (p.kind !== "estampa") throw new Error();
    expect([p.width, p.height]).toEqual([150, 75]);
  });

  it("etiqueta no meio da parte", () => {
    const l = defaultLabel(frente);
    if (l.kind !== "etiqueta") throw new Error();
    const a = frente.points[frente.start]!;
    expect({ x: a.x + l.offset.x, y: a.y + l.offset.y }).toEqual({ x: 115, y: 300 });
  });
});
