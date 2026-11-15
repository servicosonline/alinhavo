import { describe, expect, it } from "vitest";
import { examplePants, exampleTop } from "../examples";
import { currentVersionsFilter, lookOptionsFrom } from "./look-options";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

describe("lookOptionsFrom", () => {
  it("cada molde na versão atual, na ordem dos moldes", () => {
    const options = lookOptionsFrom(
      [
        { id: B, name: "Top", current_version: 2 },
        { id: A, name: "Calça", current_version: 1 },
      ],
      [
        { pattern_id: A, number: 1, document: examplePants() },
        { pattern_id: B, number: 1, document: examplePants() }, // versão antiga: não conta
        { pattern_id: B, number: 2, document: exampleTop() },
      ],
    );
    expect(options.map((o) => o.name)).toEqual(["Top", "Calça"]);
    expect(options[0]!.doc.pieces.map((p) => p.id)).toEqual(exampleTop().pieces.map((p) => p.id));
  });

  it("deixa de fora molde sem a versão atual ou com documento que não lê", () => {
    const options = lookOptionsFrom(
      [
        { id: A, name: "Sem versão", current_version: 3 },
        { id: B, name: "Quebrado", current_version: 1 },
        { id: C, name: "Bom", current_version: 1 },
      ],
      [
        { pattern_id: A, number: 1, document: examplePants() },
        { pattern_id: B, number: 1, document: { schema: 99, lixo: true } },
        { pattern_id: C, number: 1, document: examplePants() },
      ],
    );
    expect(options.map((o) => o.name)).toEqual(["Bom"]);
  });
});

describe("currentVersionsFilter", () => {
  it("uma condição por molde, com a versão atual", () => {
    expect(
      currentVersionsFilter([
        { id: A, current_version: 2 },
        { id: B, current_version: 1 },
      ]),
    ).toBe(`and(pattern_id.eq.${A},number.eq.2),and(pattern_id.eq.${B},number.eq.1)`);
  });
});
