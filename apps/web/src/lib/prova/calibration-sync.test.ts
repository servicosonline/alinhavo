import { CALIBRATION_ITERATIONS, CALIBRATION_SPACING } from "@alinhavo/cloth";
import { describe, expect, it } from "vitest";
import { PROVA_ITERATIONS, PROVA_MESH_SPACING } from "./protocol";

// Os tecidos são calibrados na malha da Prova (docs/10-calibracao-tecidos.md):
// a flexão e o esticamento são por aresta, então outra malha dá outro tecido.
// Mudou a malha ou as iterações da Prova? Mude em packages/cloth/src/calibration/settings.ts
// e rode a calibração de novo (npm run calibrate -w @alinhavo/cloth).
describe("Prova e calibração dos tecidos", () => {
  it("usam a mesma malha e as mesmas iterações", () => {
    expect(PROVA_MESH_SPACING).toBe(CALIBRATION_SPACING);
    expect(PROVA_ITERATIONS).toBe(CALIBRATION_ITERATIONS);
  });
});
