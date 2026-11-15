import { describe, expect, it } from "vitest";
import { defaultQuality } from "./quality";

describe("defaultQuality", () => {
  it("toque começa em leve, mesmo com muitos núcleos", () => {
    expect(defaultQuality({ coarsePointer: true, cores: 16 })).toBe("leve");
  });

  it("até 4 núcleos começa em leve", () => {
    expect(defaultQuality({ coarsePointer: false, cores: 4 })).toBe("leve");
  });

  it("computador comum, ou sem saber os núcleos, começa em alta", () => {
    expect(defaultQuality({ coarsePointer: false, cores: 8 })).toBe("alta");
    expect(defaultQuality({ coarsePointer: false, cores: undefined })).toBe("alta");
  });
});
