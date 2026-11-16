import { BODY_POSES, HEEL_RANGE } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import { HEEL_OPTIONS, heelName, POSE_NAME, POSE_OPTIONS } from "./poses";

describe("poses e salto da Prova", () => {
  it("a tela oferece toda pose do corpo, uma vez", () => {
    expect(POSE_OPTIONS.map((p) => p.id).sort()).toEqual([...BODY_POSES].sort());
    for (const p of BODY_POSES) expect(POSE_NAME[p]).toBeTruthy();
  });

  it("saltos dentro do que o corpo aceita, com nome", () => {
    for (const h of HEEL_OPTIONS) {
      expect(h).toBeGreaterThanOrEqual(HEEL_RANGE[0]);
      expect(h).toBeLessThanOrEqual(HEEL_RANGE[1]);
    }
    expect(heelName(0)).toBe("Descalço");
    expect(heelName(80)).toBe("Salto de 8 cm");
  });
});
