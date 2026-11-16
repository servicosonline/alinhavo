import { BODY_POSES, HEEL_RANGE } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import { HEEL_OPTIONS, heelName, nearestHeel, POSE_NAME, POSE_OPTIONS } from "./poses";

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

  it("o salto de um manequim salvo vai para o da lista mais perto", () => {
    expect(nearestHeel(80)).toBe(80);
    expect(nearestHeel(0)).toBe(0);
    expect(nearestHeel(70)).toBe(80);
    expect(nearestHeel(150)).toBe(120);
    expect(nearestHeel(10)).toBe(0);
  });
});
