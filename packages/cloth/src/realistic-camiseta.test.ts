import { describe, expect, it } from "vitest";
import { FABRICS } from "./fabrics";
import { dressRealistic, movingRealistic } from "./realistic-test-run";
import { camiseta } from "./test-garments";

// Corpo realista (MakeHuman) com a camiseta de teste: em pé e nos 7 movimentos,
// com os limites de motion-run.test.ts (tecido até 8 mm dentro, costura até 5 mm, camiseta descendo até 3 cm).
describe("camiseta no corpo realista", () => {
  it("em pé: assenta, não entra no corpo e as costuras fecham", () => {
    const { standing } = dressRealistic(camiseta(), FABRICS.malha);
    expect(standing.inside).toBeLessThan(8);
    expect(standing.insideShare).toBeLessThan(0.02);
    expect(standing.gap).toBeLessThan(5);
  }, 120_000);

  it("andando", () => {
    const { worst } = movingRealistic(camiseta(), FABRICS.malha, "andar", 2.5);
    expect(worst.frames).toBe(76);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.insideShare).toBeLessThan(0.02);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(30);
  }, 240_000);

  it("correndo", () => {
    const { worst } = movingRealistic(camiseta(), FABRICS.malha, "correr", 2);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(30);
  }, 240_000);

  it("dançando", () => {
    const { worst } = movingRealistic(camiseta(), FABRICS.malha, "dancar", 2);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(30);
  }, 240_000);

  it("acenando", () => {
    const { worst } = movingRealistic(camiseta(), FABRICS.malha, "acenar", 2);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(30);
  }, 240_000);

  it("sentando no banco", () => {
    const { worst, run } = movingRealistic(camiseta(), FABRICS.malha, "sentar");
    expect(run.seat).not.toBeNull();
    expect(worst.seatedFrames).toBeGreaterThan(20);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.insideShare).toBeLessThan(0.02);
    expect(worst.gap).toBeLessThan(5);
  }, 240_000);

  it("agachando", () => {
    const { worst } = movingRealistic(camiseta(), FABRICS.malha, "agachar");
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(30);
  }, 240_000);

  it("deitando", () => {
    // Deitado, "descer em relação ao quadril" não tem sentido (o corpo gira); valem o tecido e as costuras.
    const { worst } = movingRealistic(camiseta(), FABRICS.malha, "deitar");
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
  }, 240_000);
});
