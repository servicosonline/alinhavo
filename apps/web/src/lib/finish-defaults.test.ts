import { describe, expect, it } from "vitest";
import { LABEL_TEXT_MAX, addFinish, setEdgeSeamAllowance, validatePattern } from "@alinhavo/geometry";
import { samplePattern } from "./sample-pattern";
import {
  FINISH_PRESETS,
  INVISIBLE_ZIPPER_ALLOWANCE,
  compositionLabel,
  defaultLabel,
  defaultPrint,
  defaultSeamFinish,
  firstEdge,
  presetFinish,
} from "./finish-defaults";

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

describe("acabamentos prontos", () => {
  const doc = samplePattern();
  const frente = doc.pieces[0]!;

  it("cada um é válido na saia de exemplo, com a margem do zíper no segmento", () => {
    let next = doc;
    for (const { id } of FINISH_PRESETS) {
      const p = presetFinish(frente, id, "96% algodão, 4% elastano")!;
      const r = addFinish(next, frente.id, p.finish);
      expect(r.finishId).not.toBeNull();
      next = r.doc;
      if (p.edgeAllowanceMm !== undefined && "segment" in p.finish) next = setEdgeSeamAllowance(next, frente.id, p.finish.segment, p.edgeAllowanceMm);
    }
    expect(validatePattern(next)).toEqual([]);
    expect(next.pieces[0]!.seamAllowanceByEdge?.[0]).toBe(INVISIBLE_ZIPPER_ALLOWANCE);
  });

  it("pesponto de jeans: duas carreiras a 2 mm da costura", () => {
    expect(presetFinish(frente, "pesponto-jeans")!.finish).toMatchObject({ kind: "pesponto", rows: 2, distance: 2 });
  });

  it("etiqueta de composição leva o texto do tecido; sem composição, não entra", () => {
    expect(presetFinish(frente, "etiqueta-composicao", "  100%   linho ")!.finish).toMatchObject({ kind: "etiqueta", text: "100% linho" });
    expect(presetFinish(frente, "etiqueta-composicao", null)).toBeNull();
    expect(presetFinish(frente, "etiqueta-composicao", "   ")).toBeNull();
  });

  it("composição longa é cortada no limite da etiqueta", () => {
    const t = compositionLabel("a".repeat(80))!;
    expect(t.length).toBe(LABEL_TEXT_MAX);
    expect(t.endsWith("…")).toBe(true);
  });

  it("parte sem segmento que aceite: pesponto e zíper não entram", () => {
    const so = { ...frente, outline: frente.outline.slice(0, 1), fold: 0 };
    expect(presetFinish(so, "pesponto-jeans")).toBeNull();
    expect(presetFinish(so, "ziper-invisivel")).toBeNull();
  });
});
