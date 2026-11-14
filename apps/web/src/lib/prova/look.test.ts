import { describe, expect, it } from "vitest";
import { emptyDocument, validatePattern } from "@alinhavo/geometry";
import { examplePants, exampleTop } from "../examples";
import {
  addToLook,
  lookSetup,
  lookShade,
  lookSize,
  lookStart,
  LOOK_MAX,
  moveInLook,
  prefixPieces,
  removeFromLook,
  setLookFabric,
  type LookOption,
} from "./look";

const calca: LookOption = { id: "calca", name: "Calça", doc: examplePants() };
const top: LookOption = { id: "top", name: "Top", doc: exampleTop() };

describe("montar o look", () => {
  it("começa só com o molde em prova e põe cada roupa nova por fora", () => {
    let look = lookStart("Saia", "planoLeve");
    look = addToLook(look, calca, "jeans");
    look = addToLook(look, top, "malha");
    expect(look.map((i) => i.name)).toEqual(["Saia", "Calça", "Top"]);
    expect(new Set(look.map((i) => i.key)).size).toBe(3);
  });

  it("não passa do limite", () => {
    let look = lookStart("Saia", "planoLeve");
    for (let k = 0; k < 10; k++) look = addToLook(look, top, "malha");
    expect(look).toHaveLength(LOOK_MAX);
  });

  it("chave nova mesmo depois de tirar uma roupa", () => {
    let look = addToLook(addToLook(lookStart("Saia", "planoLeve"), calca, "jeans"), top, "malha");
    look = removeFromLook(look, look[1]!.key);
    look = addToLook(look, calca, "jeans");
    expect(new Set(look.map((i) => i.key)).size).toBe(look.length);
  });

  it("o molde em prova não sai; as outras saem", () => {
    const look = addToLook(lookStart("Saia", "planoLeve"), calca, "jeans");
    expect(removeFromLook(look, "main")).toHaveLength(2);
    expect(removeFromLook(look, look[1]!.key)).toHaveLength(1);
  });

  it("muda de camada e fica na ponta sem erro", () => {
    const look = addToLook(lookStart("Saia", "planoLeve"), calca, "jeans");
    const moved = moveInLook(look, look[1]!.key, -1);
    expect(moved.map((i) => i.name)).toEqual(["Calça", "Saia"]);
    expect(moveInLook(moved, moved[0]!.key, -1)).toEqual(moved);
    expect(moveInLook(moved, moved[1]!.key, 1)).toEqual(moved);
  });

  it("troca o tecido de uma roupa só", () => {
    const look = addToLook(lookStart("Saia", "planoLeve"), calca, "jeans");
    const next = setLookFabric(look, look[1]!.key, "malha");
    expect(next.map((i) => i.fabric)).toEqual(["planoLeve", "malha"]);
  });
});

describe("lookSetup", () => {
  it("dá a camada de cada roupa pela posição na lista", () => {
    let look = addToLook(addToLook(lookStart("Top", "malha"), calca, "jeans"), top, "malha");
    look = moveInLook(look, look[1]!.key, -1); // calça por dentro do molde
    const { layer, extras } = lookSetup(look, [calca, top]);
    expect(layer).toBe(1);
    expect(extras.map((e) => [e.name, e.layer, e.fabric])).toEqual([
      ["Calça", 0, "jeans"],
      ["Top", 2, "malha"],
    ]);
  });

  it("roupa que não está mais nas opções sai sem deixar buraco", () => {
    const look = addToLook(addToLook(lookStart("Saia", "planoLeve"), calca, "jeans"), top, "malha");
    const { layer, extras } = lookSetup(look, [top]);
    expect(layer).toBe(0);
    expect(extras.map((e) => [e.name, e.layer])).toEqual([["Top", 1]]);
  });
});

describe("prefixPieces", () => {
  it("renomeia partes e costuras e o molde continua válido", () => {
    const doc = prefixPieces(examplePants(), "look1:");
    expect(doc.pieces.every((p) => p.id.startsWith("look1:"))).toBe(true);
    expect(doc.seams.every((s) => s.a.piece.startsWith("look1:") && s.b.piece.startsWith("look1:"))).toBe(true);
    expect(validatePattern(doc)).toEqual([]);
    expect(examplePants().pieces[0]!.id).not.toMatch(/^look1:/); // não mexe no original
  });
});

describe("lookSize", () => {
  it("usa o mesmo tamanho se a roupa tiver; senão, o base dela", () => {
    const doc = emptyDocument(["36", "38", "40"], "38");
    expect(lookSize(doc, "40")).toEqual({ size: "40", fallback: false });
    expect(lookSize(doc, "M")).toEqual({ size: "38", fallback: true });
  });
});

describe("lookShade", () => {
  it("a primeira fica com a cor do tecido; as outras mudam de tom", () => {
    expect(lookShade("#4a6687", 0)).toBe("#4a6687");
    expect(lookShade("#4a6687", 1)).not.toBe("#4a6687");
    expect(lookShade("#4a6687", 2)).not.toBe(lookShade("#4a6687", 1));
    expect(lookShade("#ffffff", 2)).toBe("#ffffff");
    expect(lookShade("#000000", 1)).toBe("#000000");
  });
});
