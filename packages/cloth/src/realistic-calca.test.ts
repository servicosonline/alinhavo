import { describe, expect, it } from "vitest";
import { FABRICS } from "./fabrics";
import { dressRealistic, movingRealistic } from "./realistic-test-run";
import { calca } from "./test-garments";

// Corpo realista (MakeHuman) com a calça de teste: em pé e nos 7 movimentos,
// com os limites de motion-run.test.ts (tecido até 8 mm dentro, costura até 5 mm, calça descendo até 5 cm).
describe("calça no corpo realista", () => {
  it("em pé: assenta, não entra no corpo e as costuras fecham", () => {
    const { standing } = dressRealistic(calca(), FABRICS.jeans);
    expect(standing.inside).toBeLessThan(8);
    expect(standing.insideShare).toBeLessThan(0.02);
    expect(standing.gap).toBeLessThan(5);
  }, 120_000);

  it("andando", () => {
    const { worst } = movingRealistic(calca(), FABRICS.jeans, "andar", 2.5);
    expect(worst.frames).toBe(76);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.insideShare).toBeLessThan(0.02);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(50);
  }, 240_000);

  it("correndo", () => {
    const { worst } = movingRealistic(calca(), FABRICS.jeans, "correr", 2);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(50);
  }, 240_000);

  it("dançando", () => {
    const { worst } = movingRealistic(calca(), FABRICS.jeans, "dancar", 2);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(50);
  }, 240_000);

  it("acenando", () => {
    const { worst } = movingRealistic(calca(), FABRICS.jeans, "acenar", 2);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(50);
  }, 240_000);

  it("sentando no banco", () => {
    const { worst, run } = movingRealistic(calca(), FABRICS.jeans, "sentar");
    expect(run.seat).not.toBeNull();
    expect(worst.seatedFrames).toBeGreaterThan(20);
    expect(worst.inside).toBeLessThan(8);
    expect(worst.insideShare).toBeLessThan(0.02);
    expect(worst.gap).toBeLessThan(5);
  }, 240_000);

  it("agachando: a calça fica no quadril", () => {
    const { worst } = movingRealistic(calca(), FABRICS.jeans, "agachar");
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
    expect(worst.drop).toBeLessThan(50);
  }, 240_000);

  it("deitando", () => {
    // Deitado, "descer em relação ao quadril" não tem sentido (o corpo gira); valem o tecido e as costuras.
    const { worst } = movingRealistic(calca(), FABRICS.jeans, "deitar");
    expect(worst.inside).toBeLessThan(8);
    expect(worst.gap).toBeLessThan(5);
  }, 240_000);
});
