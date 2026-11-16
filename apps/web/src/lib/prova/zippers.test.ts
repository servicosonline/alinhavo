import { describe, expect, it } from "vitest";
import { addFinish } from "@alinhavo/geometry";
import { samplePattern } from "../sample-pattern";
import { openZippersIn, zipperChoices } from "./zippers";

function withZippers() {
  let doc = samplePattern();
  const ids: string[] = [];
  for (const piece of doc.pieces) {
    const r = addFinish(doc, piece.id, { kind: "ziper", segment: 0, from: 0, to: 0.5 });
    if (!r.finishId) throw new Error("zíper não entrou");
    doc = r.doc;
    ids.push(r.finishId);
  }
  return { doc, ids };
}

describe("zíperes da Prova", () => {
  it("lista os zíperes na ordem das partes, com o nome da parte", () => {
    const { doc, ids } = withZippers();
    const list = zipperChoices(doc);
    expect(list.map((z) => z.id)).toEqual(ids);
    expect(list[0]!.label).toBe(`Zíper 1 · ${doc.pieces[0]!.name}`);
  });

  it("molde sem zíper: lista vazia", () => {
    expect(zipperChoices(samplePattern())).toEqual([]);
  });

  it("abertos: só os que ainda existem, na ordem do molde", () => {
    const { doc, ids } = withZippers();
    expect(openZippersIn(doc, ["sumiu", ids.at(-1)!, ids[0]!])).toEqual([ids[0], ids.at(-1)]);
  });
});
